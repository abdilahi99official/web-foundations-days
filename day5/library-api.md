# Library REST API Design

This document outlines the REST API endpoints for managing books in the library system resource (`/books`).

---

## Endpoints

### 1. List all books
* **Method:** `GET`
* **Path:** `/books`
* **Description:** Retrieves a list of all books available in the library catalog.
* **Success Status Code:** `200 OK`

### 2. List books by author (Query Parameter)
* **Method:** `GET`
* **Path:** `/books?author=AuthorName`
* **Description:** Filters and retrieves books written by a specific author.
* **Success Status Code:** `200 OK`

### 3. Get a single book
* **Method:** `GET`
* **Path:** `/books/:id`
* **Description:** Retrieves details for a single book specified by its unique ID.
* **Success Status Code:** `200 OK`

### 4. Create a new book
* **Method:** `POST`
* **Path:** `/books`
* **Description:** Adds a new book to the library catalog.
* **Example Request Body:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "publishedYear": 2008,
    "genre": "Software Engineering"
  }
