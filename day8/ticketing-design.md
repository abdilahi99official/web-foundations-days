# TicketHub System Design Document

## 1. Requirements

### Functional Requirements
* **User Management:** Users can register, log in, and manage their profiles.
* **Event Browsing & Search:** Users can view upcoming concerts, search by artist or venue, and check event details.
* **Real-Time Seat Selection:** Users can view interactive seat maps displaying available, held, and sold seats.
* **Temporary Seat Holding:** Users can lock a selected seat for a limited duration (e.g., 10 minutes) while completing payment.
* **Checkout & Payment:** Users can securely purchase held seats and receive order confirmation.
* **Ticket Management:** Users can view their purchased tickets and QR codes for event entry.

### Non-Functional Requirements
* **Correctness (Zero Double-Booking):** Absolute guarantee that two users can never successfully purchase the exact same seat.
* **Fairness & Stability:** Prevention of bot stampedes and system crashes during high-demand flash sales using queueing mechanisms.
* **Speed:** Sub-second UI response times for browsing and seat availability checks.
* **Availability & Scalability:** 99.99% uptime capable of absorbing massive traffic spikes during popular on-sale events.

---

## 2. Traffic Estimates

### Normal Day Traffic
* **Registered Users:** 2,000,000
* **Daily Visitors:** 50,000 active visitors
* **Page Views:** 50,000 visitors × 10 pages/day = **500,000 page views/day**
* **Read Requests per Second:** 500,000 / 86,400 seconds $\approx$ **5.8 reads/sec**
* **Tickets Sold:** 5,000 tickets/day $\approx$ **0.06 writes/sec**

### Popular Concert On-Sale Peak (Flash Sale)
* **Burst Load:** 200,000 concurrent users attempting to buy 20,000 seats within the first 10 minutes (600 seconds).
* **Peak Write / Hold Requests per Second:** 200,000 requests / 600 seconds $\approx$ **333 requests/sec** (burst spikes can reach 1,000+ requests/sec at the exact minute the sale opens).
* **Comparison:** While normal write traffic is negligible (~0.06/sec), flash sale write traffic surges by over **5,500x**, creating severe database contention if unmanaged.

---

## 3. API Design

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events` | Retrieves a list of upcoming concerts and events. | `200 OK` |
| `GET` | `/api/v1/events/:id/seats` | Retrieves real-time seat availability for a specific event. | `200 OK` |
| `POST` | `/api/v1/tickets/hold` | Temporarily locks selected seats for a user during checkout. | `201 Created` |
| `POST` | `/api/v1/orders/checkout` | Processes payment and finalizes ticket purchase for held seats. | `201 Created` |
| `GET` | `/api/v1/users/:id/tickets` | Retrieves all purchased tickets and QR codes for a user. | `200 OK` |

---

## 4. Data Model & Preventing Double-Booking

### Entities & Schema
1. **`users`**: `id` (PK), `username`, `email`, `password_hash`, `created_at`
2. **`events`**: `id` (PK), `title`, `artist`, `venue`, `date`, `total_seats`
3. **`seats`**: `id` (PK), `event_id` (FK), `seat_number`, `status` (`'available'`, `'held'`, `'sold'`), `version` (for optimistic locking)
4. **`orders`**: `id` (PK), `user_id` (FK), `total_amount`, `status` (`'pending'`, `'completed'`, `'expired'`), `created_at`
5. **`order_items`**: `id` (PK), `order_id` (FK), `seat_id` (FK)

### Preventing Double-Booking (Concurrency Control)
To guarantee that two users never buy the same seat, TicketHub combines a **State Machine**, **Distributed Locking (Redis)**, and **Database Transactions**:
1. **State Machine:** Seats transition strictly from `available` $\rightarrow$ `held` $\rightarrow$ `sold`.
2. **Redis Distributed TTL Locks:** When a user selects a seat, a Redis key (`seat:lock:{seat_id}`) is set with a 10-minute expiration (`EX 600`). If another user tries to hold that seat while the key exists, the request is immediately rejected.
3. **Database Transactions with Row-Level Locking:** When transitioning a seat from `available` to `held` in the relational database, the system executes an atomic transaction using `SELECT ... FOR UPDATE` or optimistic locking (`UPDATE seats SET status = 'held', version = version + 1 WHERE id = ? AND status = 'available'`). If zero rows are updated, it means another transaction beat it to the punch, and the hold fails safely.

---

## 5. Architecture & Flash Sale Survival Plan

```text
[ Clients (Web / Mobile) ]
           │
           ▼
     [ Cloud CDN ] ────────────── (Caches static pages & event assets)
           │
           ▼
[ WAF & Rate Limiter ] ────────── (Blocks DDoS & bot traffic)
           │
           ▼
[ Global Load Balancer ]
           │
           ▼
[ Virtual Waiting Room Queue ] ── (Absorbs 200k stampede, throttles traffic)
           │
           ▼
[ App Servers Cluster ] ───────── (Handles hold & checkout business logic)
           │
           ├──► [ Redis Distributed Cache ] ──► (Manages 10-minute seat hold TTLs)
           │
           └──► [ Primary Database (Writes) ]
                      │
                      ▼ (Async Replication)
                 [ Read Replicas (Reads) ]

Component Descriptions
Cloud CDN: Caches static content (images, JS, CSS) to minimize server bandwidth.

WAF & Rate Limiter: Inspects traffic and blocks automated bots or scraping tools attempting to snipe tickets.

Global Load Balancer: Distributes incoming user requests across regional app servers.

Virtual Waiting Room Queue: The secret weapon for flash sales. Instead of letting 200,000 users crash the database simultaneously, users entering a popular sale are placed into an organized FIFO (First-In, First-Out) queue and let in gradually in batches matching system capacity.

App Servers Cluster: Stateless servers executing API requests and validation logic.

Redis Cache: Provides lightning-fast in-memory locking and temporary seat hold tracking.

Primary Database & Read Replicas: The Primary Database handles atomic purchase transactions, while Read Replicas serve high-volume seat map browsing queries.

6. Trade-Offs
Trade-Off 1: Virtual Waiting Room vs. Direct First-Come-First-Served Access

Choice: We implement a Virtual Waiting Room queue for high-demand events.

Consequence: While forcing users to wait in a queue introduces minor friction, it completely protects the backend infrastructure from crashing under flash-sale spikes and ensures fair, bot-resistant distribution.

Trade-Off 2: Temporary Seat Holds (TTL) vs. Immediate Purchase Enforcement

Choice: We give users a 10-minute hold window to complete payment.

Consequence: Some users will hold seats and abandon their carts, temporarily locking out other buyers until the TTL expires and seats revert to available. However, this significantly improves checkout conversion rates and user experience compared to forcing instant payment.


---
