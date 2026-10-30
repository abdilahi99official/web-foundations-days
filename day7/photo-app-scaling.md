# SnapShare Scaling Architecture Plan

## 1. Assumptions & Active Users
* **Total Registered Users:** 10,000,000
* **Daily Active Users (DAU):** 10% of registered users = **1,000,000 DAU**
* **Activity Metrics:** Each active user uploads 1 photo per day and views 50 feed pages per day.
* **File Metrics:** Average photo size is 2 MB; thumbnail size is 50 KB.
* **Traffic Multiplier:** Peak traffic multiplier is estimated at 5× average traffic.

---

## 2. Mathematical Estimates & Calculations

### Traffic Estimates
* **Uploads per Day:** 1,000,000 active users × 1 photo = **1,000,000 uploads/day**
* **Average Uploads per Second:** 1,000,000 / 86,400 seconds $\approx$ **11.6 uploads/sec**
* **Peak Uploads per Second:** 11.6 × 5 $\approx$ **58 uploads/sec**

* **Feed Views per Day:** 1,000,000 active users × 50 feed pages = **50,000,000 feed views/day**
* **Average Feed Views per Second:** 50,000,000 / 86,400 seconds $\approx$ **578.7 feed views/sec** (~579/sec)
* **Peak Feed Views per Second:** 578.7 × 5 $\approx$ **2,893.5 feed views/sec** (~2,900/sec)

### Storage Estimates (per year)
* **Photos Storage:** 1,000,000 photos/day × 365 days = 365,000,000 photos/year.
  365,000,000 × 2 MB = 730,000,000 MB = **730 TB/year**
* **Thumbnail Storage:** 365,000,000 thumbnails × 50 KB = 18,250,000,000 KB $\approx$ **18.25 TB/year**
* **Total Storage Required per Year:** 730 TB + 18.25 TB = **748.25 TB/year**

---

## 3. Workload Characterization: Read-Heavy vs. Write-Heavy
SnapShare is **significantly read-heavy**, with roughly 50 feed views for every 1 photo upload (a 50:1 read-to-write ratio).
* **Design Implications:** Because read traffic heavily eclipses write traffic, the system design must prioritize read scalability. This is achieved by utilizing CDNs for image delivery, database read replicas to distribute query loads, and robust caching layers for user feeds so that database servers are not overwhelmed during peak viewing hours.

---

## 4. Why Object Storage Instead of a Database?
Relational databases are optimized for structured tabular data, fast indexing, transactional integrity (ACID), and complex queries. Storing large binary files (BLOBs) like 2 MB images inside a database would bloat storage, severely degrade query performance, and make database backups slow and expensive. Instead, binary files are stored in **Object Storage** (such as AWS S3), which is built specifically for scalable, highly durable, and cost-effective storage of unstructured files, while the database stores only lightweight metadata (file URLs, timestamps, user IDs).

---

## 5. Architecture Diagram

```text
[ Clients (Web / Mobile) ]
           │
           ▼
     [ Cloud CDN ] ────── (Caches static images / thumbnails)
           │
           ▼
[ Global Load Balancer ]
           │
           ├──► [ App Servers (Write Cluster) ] ──► [ Message Queue ] ──► [ Worker (Thumbnail Generator) ]
           │           │                                                              │
           │           └──► [ Primary Database (Writes) ]                             │
           │                      │                                                   │
           │                      ▼ (Async Replication)                               │
           ▼                 [ Read Replicas (Reads) ] ◄──────────────────────────────┘
[ App Servers (Read Cluster) ] ◄──► [ In-Memory Cache (Redis) ]                       │
           │                                                                          │
           └───────────────────────────────────────────────► [ Object Storage (S3) ] ◄──┘

6. Component Descriptions (One Sentence Each)
CDN (Content Delivery Network): Caches and delivers static image files and thumbnails from edge locations closest to the user to minimize latency and bandwidth costs.

Load Balancer: Distributes incoming HTTP traffic evenly across multiple application servers to prevent overloading and ensure high availability.

App Servers: Execute application business logic, process user requests, handle authentication, and orchestrate data flow between caches, databases, and storage.

In-Memory Cache (Redis): Stores hot data and pre-computed user feeds in memory to deliver ultra-fast read responses and reduce database load.

Primary Database: Handles all transactional write operations (user profiles, relationships, and photo metadata) to maintain consistency and integrity.

Read Replicas: Scale out read performance by serving high-volume read queries (such as user profiles and metadata lookups) asynchronously replicated from the primary database.

Object Storage: Securely stores raw uploaded photo binaries and generated thumbnails at scale with high durability.

Message Queue & Worker: Asynchronously decouples heavy background tasks (like thumbnail generation) from the main request-response cycle to keep uploads fast and responsive.

7. Step-by-Step Photo Upload Flow
Client Request: The user selects a photo on their device and sends a POST request containing the image binary and metadata to the Load Balancer.

Routing: The Load Balancer forwards the request to an available Application Server.

Direct Storage Upload: The App Server uploads the raw binary file directly to Object Storage, receiving a secure URL in return.

Metadata Persistence: The App Server writes the photo metadata (URL, caption, user ID, timestamp) into the Primary Database.

Queue Publication: The App Server publishes an asynchronous event message (containing the image reference) to the Message Queue.

Background Processing: A Worker process picks up the message from the queue, pulls the raw image from Object Storage, generates a 50 KB thumbnail, and uploads the thumbnail back to Object Storage.

Cache Invalidation: The App Server invalidates or updates the user's cached feed data so followers will see the new post upon their next refresh.

Client Response: The App Server returns a 201 Created success response to the client.

8. System Trade-Offs
Trade-Off 1: Eventual Consistency vs. Strong Consistency in Feeds

Choice: We choose eventual consistency for feed distribution.

Consequence: When a user uploads a photo, their followers' cached feeds might take a few seconds to update, but this trade-off allows us to serve millions of read requests instantly via caching without locking the database.

Trade-Off 2: Storage Cost vs. Performance (Thumbnails)

Choice: We pre-generate and store thumbnails (adding ~18.25 TB of storage per year) rather than resizing images on-the-fly.

Consequence: While storing extra files increases storage costs, it drastically reduces CPU load on app servers and speeds up feed rendering times for mobile clients browsing grids of photos.


---
