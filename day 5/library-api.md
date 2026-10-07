# Library Books API Specification

## Endpoints

### 1. List All Books
- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Retrieves a list of all books in the library.
- **Success Status:** `200 OK`

### 2. Search Books by Author
- **Method:** `GET`
- **Path:** `/api/books?author=Orwell`
- **Description:** Retrieves all books written by a specific author using a query parameter.
- **Success Status:** `200 OK`

### 3. Get Single Book
- **Method:** `GET`
- **Path:** `/api/books/:id`
- **Description:** Retrieves details for a specific book by its ID.
- **Success Status:** `200 OK`

### 4. Create New Book
- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Adds a new book to the library catalogue.
- **Request Body Example:**
  ```json
  {
    "title": "1984",
    "author": "George Orwell",
    "isbn": "9780451524935",
    "publishedYear": 1949
  }