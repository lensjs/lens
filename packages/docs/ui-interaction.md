# Interacting with the Lens UI

This document provides a guide on how to navigate and interact with the Lens UI, a dashboard designed to monitor requests, database queries, cache operations, and exceptions within your application.

## 1. Navigation

The Lens UI is organized into several main sections, accessible via the sidebar on the left.

*   **Requests:** View all incoming HTTP requests.
*   **Queries:** Monitor database queries executed by your application.
*   **Cache:** Track cache hits, misses, writes, and deletes.
*   **Exceptions:** Review application errors and their stack traces.

### 1.1. Header

The header, located at the top of the page, displays:
*   **Application Name:** Click on the application name to return to the main Requests list.
*   **Delete Button:** A trash icon button. Clicking this will open a confirmation modal to **permanently delete all recorded entries** across all categories (requests, queries, cache, exceptions). Use with caution.
*   **Mobile Menu Toggle:** On smaller screens, a menu icon (`☰`) will appear to toggle the sidebar visibility.

## 2. Viewing Requests

### 2.1. Requests List (`/lens/requests`)

This page displays a table of all recorded HTTP requests.

*   **Columns:**
    *   **Method:** The HTTP method (e.g., GET, POST) with a color-coded badge.
    *   **Path:** The request URL path. Click on the path or the "Actions" arrow to view request details.
    *   **Status:** The HTTP status code of the response, with a color-coded badge.
    *   **Duration:** The time taken to process the request.
    *   **Happened:** A human-readable timestamp indicating when the request occurred.
    *   **Actions:** An arrow icon to navigate to the request's detail page.
*   **Load More:** If there are more requests than currently displayed, a "Load More" button will appear at the bottom of the table to fetch additional entries.

### 2.2. Request Details (`/lens/requests/:id`)

This page provides a comprehensive view of a single HTTP request.

*   **Request Details Panel:** Displays basic information about the request, including:
    *   Time, Hostname, Method, Request ID, Path, Status, Duration, IP Address.
*   **User Panel (if available):** Shows details about the authenticated user associated with the request (ID, Email, Name).
*   **Request Data Tabs:**
    *   **Payload:** The request body (e.g., JSON payload for POST/PUT requests).
    *   **Headers:** All request headers.
*   **Response Data Tabs:**
    *   **Body:** The response body (e.g., JSON response).
    *   **Headers:** All response headers.
*   **Related Entries Tabs:**
    *   **Queries:** A table listing all database queries executed during this request. Click on a query to view its details.
    *   **Cache:** A table listing all cache operations performed during this request. Click on a cache entry to view its details.
    *   **Exceptions:** A table listing any exceptions that occurred during this request. Click on an exception to view its details.

## 3. Viewing Queries

### 3.1. Queries List (`/lens/queries`)

This page displays a table of all recorded database queries.

*   **Columns:**
    *   **Query:** The SQL or MongoDB query string.
    *   **Duration:** The time taken to execute the query.
    *   **Provider:** The database type (e.g., `sql`, `mongodb`).
    *   **Happened:** A human-readable timestamp indicating when the query occurred.
    *   **Actions:** An arrow icon to navigate to the query's detail page.
*   **Load More:** A "Load More" button will appear if there are additional queries to fetch.

### 3.2. Query Details (`/lens/queries/:id`)

This page shows detailed information about a single database query.

*   **Query Details Panel:** Displays:
    *   Request (link to related request, if any).
    *   Time, Duration, Provider.
*   **Query Tab:** Displays the formatted and syntax-highlighted query string.

## 4. Viewing Cache Entries

### 4.1. Cache Entries List (`/lens/cache`)

This page displays a table of all recorded cache operations.

*   **Columns:**
    *   **Key:** The cache key.
    *   **Operation:** The type of cache operation (e.g., `hit`, `miss`, `write`, `delete`, `clear`) with a color-coded badge.
    *   **Happened:** A human-readable timestamp indicating when the cache operation occurred.
    *   **Actions:** An arrow icon to navigate to the cache entry's detail page.
*   **Load More:** A "Load More" button will appear if there are additional cache entries to fetch.

### 4.2. Cache Entry Details (`/lens/cache/:id`)

This page shows detailed information about a single cache operation.

*   **Details Panel:** Displays:
    *   Request (link to related request, if any).
    *   Operation, Key.
*   **Value Tab:** Displays the cached value in a JSON viewer.

## 5. Viewing Exceptions

### 5.1. Exceptions List (`/lens/exceptions`)

This page displays a table of all recorded exceptions.

*   **Columns:**
    *   **Type:** The exception name and message.
    *   **Happened:** A human-readable timestamp indicating when the exception occurred.
    *   **Actions:** An arrow icon to navigate to the exception's detail page.
*   **Load More:** A "Load More" button will appear if there are additional exceptions to fetch.

### 5.2. Exception Details (`/lens/exceptions/:id`)

This page provides detailed information about a single exception.

*   **Exception Details Panel:** Displays:
    *   Request (link to related request, if any).
    *   Name, File, Function.
*   **Tabs:**
    *   **Message:** The exception message.
    *   **Stacktrace:** A formatted and highlighted stack trace, showing the call stack from the error origin.
    *   **Location:** A code frame viewer highlighting the exact line of code where the exception occurred, with surrounding context.
    *   **Cause (if available):** Additional information about the exception's cause.
    *   **Original Stack (if available):** The raw, unparsed stack trace.

## 6. Common UI Elements

*   **Tables:** Used extensively to display lists of entries. They support pagination via the "Load More" button.
*   **Detail Panels:** Used to present key-value pairs of information for individual entries.
*   **Tabbed Data Viewers:** Allow switching between different views of related data (e.g., request payload vs. headers, stack trace vs. code frame).
*   **JSON Viewers:** Used to display structured data (like request bodies, response JSON, cache values) in a readable, collapsible format with a copy-to-clipboard option.
*   **Code Frame Viewer:** Specifically designed to show code context around an error.
*   **Stack Trace Viewer:** Formats and highlights stack traces for easier debugging.
*   **Syntax Highlighters:** Used for SQL, MongoDB queries, and code frames to improve readability.

## 7. Filtering, Search, Sort & Date Range

Every list view (Requests, Queries, Cache, Exceptions, Mail, HTTP, Events, Redis, FCM, Logs, Jobs) has a toolbar that filters the **entire dataset on the server** — not only the rows already loaded. Every control is written to the URL, so a filtered view is deep-linkable and shareable.

*   **Search:** Debounced substring match across an entry's summary fields — e.g. a request path, a log message, or a Redis command.
*   **Filters:** Per-view dropdowns (e.g. request Method/Status, log Level, cache Operation) narrow results by field.
*   **Date range:** Choose a preset (Last 15 min / hour / 24 hours / 7 days) or a custom start/end. Bounds are stored as absolute timestamps, so the link stays stable over time.
*   **Sort:** Sort by Time (default, newest first) or a column such as Duration, ascending or descending.
*   **Clear:** The "Clear" button (showing the active-filter count) removes every active filter at once.

### Live tail and sorting

The default view — newest-first by time — keeps the **live feed** on, so new matching entries stream in automatically. Choosing an explicit sort (any column, or oldest-first) switches to a stable page-through ordering and **pauses the live feed** for that view. Clear the sort (or reload) to resume live updates.
