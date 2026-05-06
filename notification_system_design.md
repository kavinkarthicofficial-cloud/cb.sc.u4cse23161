# Stage 1

## Notification System REST API Design

### Core Actions
1. Fetch all notifications for a user (with pagination).
2. Fetch unread notifications.
3. Mark a specific notification as read.
4. Mark all notifications as read.
5. Get Priority Inbox (Top N most important unread notifications).

### API Endpoints

#### 1. Fetch User Notifications
- **Method:** `GET`
- **Endpoint:** `/api/v1/notifications`
- **Description:** Retrieve a paginated list of notifications for the logged-in user.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page` (default: 1), `limit` (default: 20), `unreadOnly` (boolean, default: false)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "notifications": [
      {
        "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "isRead": false,
        "timestamp": "2026-04-22T17:51:18.000Z"
      }
    ]
  }
}
```

#### 2. Mark Notification as Read
- **Method:** `PATCH`
- **Endpoint:** `/api/v1/notifications/:id/read`
- **Description:** Mark a specific notification as read.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### 3. Mark All Notifications as Read
- **Method:** `PATCH`
- **Endpoint:** `/api/v1/notifications/read-all`
- **Description:** Mark all unread notifications for the user as read.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Real-Time Notification Mechanism

To support real-time updates for students to see "Placements, Events, and Results" as soon as they are triggered, we will use **WebSockets** (e.g., via `Socket.io`). 

**Flow:**
1. User logs in, the client establishes a persistent WebSocket connection: `wss://api.affordmed.com/notifications`.
2. Client authenticates by sending a connection frame containing the JWT token.
3. Server verifies token and maps the WebSocket connection ID to the `studentId`.
4. When a new notification is created on the backend, the backend emits an event (`NEW_NOTIFICATION`) containing the notification JSON payload over the socket specifically to the connected `studentId`s.
5. The frontend receives the event and updates the UI notification counter and list dynamically without a page refresh.


<br>

# Stage 2

### Persistent Storage Choice: PostgreSQL
**Why PostgreSQL?**
Notifications typically have a predictable schema and involve distinct entities (Students, Notifications) with a strong many-to-many or one-to-many relationship depending on how bulk notifications are handled. PostgreSQL ensures ACID compliance, provides excellent indexing mechanisms (B-Tree, Partial Indexes), and handles complex queries like ordering by date and filtering efficiently. Additionally, for massive bulk notifications, we could structure it efficiently using junction tables.

### Database Schema

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE students (
    student_id BIGSERIAL PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id BIGINT REFERENCES students(student_id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimize fetching unread notifications and sorting
CREATE INDEX idx_student_unread ON notifications (student_id, is_read, created_at DESC);
CREATE INDEX idx_student_created ON notifications (student_id, created_at DESC);
```

### Potential Scale Problems & Solutions
**Problem 1: Rapid Data Growth**
With 50,000 students, "Notify All" creates 50,000 rows. A few events can cause the `notifications` table to swell to millions of rows quickly, slowing down `INSERT` and `SELECT` operations.
**Solution:**
- **Table Partitioning:** Partition the `notifications` table by date range (e.g., monthly). Most users only query recent notifications.
- **Archiving:** Move notifications older than 6 months to a cheaper "cold storage" DB or Data Lake.

**Problem 2: Heavy Read Load**
Every page load might request unread notification counts.
**Solution:**
Cache the unread count in a fast in-memory store like **Redis**. When a new notification is inserted, increment the Redis counter. When read, fetch from Redis instead of doing a `COUNT(*)` in Postgres.

### Example Queries

**Fetch User's Unread Notifications (Stage 1 API):**
```sql
SELECT id, type, message, created_at 
FROM notifications 
WHERE student_id = 12345 AND is_read = FALSE 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;
```


<br>

# Stage 3

### Analyzing the Existing Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```
**Is this query accurate?** Yes, it accurately fetches unread notifications for a specific student, ordered by newest first.
**Why is it slow?** With 5,000,000 notifications in the table, if there is no index covering `(studentID, isRead, createdAt)`, the database is forced to do an expensive table scan or sort the results in memory (filesort) for every single request.

**What would you change and what is the computation cost?**
I would add a **Composite Index**.
```sql
CREATE INDEX idx_student_unread_sort ON notifications (studentID, isRead, createdAt DESC);
```
*Cost reduction:* Time complexity drops from `O(N log N)` (scanning and sorting large datasets) to `O(log N + K)` (where K is the number of unread notifications for that student) because the B-Tree index is already pre-sorted based on `createdAt`.

**Is adding indexes on every column effective?**
**No, this is terrible advice.** 
Why? Because every `INSERT`, `UPDATE`, and `DELETE` operation requires the database to update every single index. Adding indexes on every column drastically degrades write performance and consumes massive amounts of disk space. Indexes should be carefully targeted based on the actual queries run against the database.

### Query: Find all students who got a Placement notification in the last 7 days

```sql
SELECT DISTINCT s.student_id, s.name, s.roll_no, s.email
FROM students s
JOIN notifications n ON s.student_id = n.student_id
WHERE n.type = 'Placement' 
  AND n.created_at >= NOW() - INTERVAL '7 days';
```


<br>

# Stage 4

### The Problem: Overwhelmed DB due to frequent page loads
Fetching notifications from PostgreSQL on every single page load for 50,000 students will cause DB connection exhaustion, high CPU/Memory usage, and significantly slow down the user experience.

### Suggested Solutions to Improve Performance

#### Strategy 1: Caching Layer with Redis (Read-Through Cache)
Instead of querying PostgreSQL directly, we store the recent notifications and unread counts in Redis.
- **Workflow:** When a student loads a page, the backend queries `Redis` for `notifications:studentID`. If it exists (cache hit), it returns it instantly. If not (cache miss), it queries Postgres, stores the result in Redis with an expiry (TTL), and returns it.
- **Tradeoffs:** 
  - *Pros:* Massive reduction in DB load, sub-millisecond response times.
  - *Cons:* "Cache invalidation" overhead when notifications are updated/read; requires maintaining an extra infrastructural component (Redis cluster).

#### Strategy 2: WebSockets / Server-Sent Events (SSE)
Instead of the client "polling" or fetching on every page load, the client establishes a persistent connection upon login. The server pushes updates to the client *only* when new data exists. State is kept in memory on the frontend (Redux/Context API).
- **Tradeoffs:**
  - *Pros:* Completely eliminates redundant DB queries on page navigation. True real-time experience.
  - *Cons:* Stateful architecture requires load balancer configurations for sticky sessions or a Pub/Sub backbone (like Redis Pub/Sub) to handle connections across multiple backend scaled instances.

#### Strategy 3: Client-Side Caching (Service Workers / LocalStorage)
Fetch notifications once per session and store them in the browser's `localStorage` or `IndexedDB`.
- **Tradeoffs:**
  - *Pros:* Zero cost to backend performance.
  - *Cons:* Data can easily become stale if multiple tabs or devices are used simultaneously.


<br>

# Stage 5

### Shortcomings of the Proposed Pseudocode
```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)        # calls Email API
        save_to_db(student_id, message)        # DB insert
        push_to_app(student_id, message)       # WebSockets
```
1. **Synchronous Execution & Blocking:** Sending 50,000 emails sequentially in a loop will take hours. Network latency from external email APIs will block the entire thread.
2. **Lack of Transactionality/Reliability:** If `send_email` fails on student #201, the loop might crash. The remaining 49,800 students won't receive the email, won't get the DB insert, and won't get the app push.
3. **Database Overload:** Running 50,000 individual `INSERT` statements will lock the database and slow it to a crawl. It should use Bulk Inserts.

**What happens to the 200 failed emails?**
With this current implementation, they are lost. There is no retry mechanism and no record distinguishing who successfully received the email vs who failed.

### How to Redesign for Reliability and Speed
We must decouple the processes using **Asynchronous Message Queues** (e.g., RabbitMQ, Kafka, or AWS SQS / Bull for Node.js).

1. The API simply receives the request and drops 1 event into a message queue: `{"type": "NOTIFY_ALL", "message": "msg"}`. The API responds to HR immediately (fast UX).
2. A **Background Worker** picks up the event.
3. The worker does a **Bulk Insert** to the DB for all 50,000 students in one query.
4. The worker breaks the 50,000 users into chunks (e.g., 500 batches of 100) and pushes "Email Job" messages to the Queue.
5. Multiple concurrent "Email Workers" process these jobs rapidly. If an email fails, the queue system automatically retries the job later (e.g., exponential backoff).

**Should saving to DB and sending email happen together?**
No. They should be strictly decoupled. Database insertion is fast and strictly internal. Emailing relies on a 3rd party API which is prone to rate-limits and timeouts. We should save to the DB first so we have a persistent record of the notification's existence, and *then* dispatch the asynchronous jobs to handle email delivery.

### Revised Pseudocode
```python
# 1. API Endpoint (Fast Response)
function notify_all_api(student_ids: array, message: string):
    MessageQueue.publish("BATCH_NOTIFICATION", {
        "student_ids": student_ids, 
        "message": message
    })
    return "Notification processing started."

# 2. Worker Processing the Batch (Background)
function handle_batch_notification_job(job):
    student_ids = job.data.student_ids
    message = job.data.message
    
    # Fast Bulk DB Insert
    db.execute_bulk_insert_notifications(student_ids, message)
    
    # Real-Time Push to all connected sockets
    websocket_server.broadcast_to_users(student_ids, message)
    
    # Fan-out to Queue for reliable, async email delivery
    for student_id in student_ids:
        MessageQueue.publish("SEND_EMAIL", { "student_id": student_id, "message": message })

# 3. Dedicated Email Worker (Concurrent, Isolated, Retryable)
function handle_email_job(job):
    try:
        send_email(job.data.student_id, job.data.message)
    except APIError:
        # Puts it back in queue to try again later
        MessageQueue.retry(job, backoff="exponential")
```


<br>

# Stage 6

### Priority Inbox Implementation Approach
To implement a "Priority Inbox" that always displays the top 'N' most important unread notifications efficiently, we can use a **Min-Heap (Priority Queue)** data structure.

**Scoring Strategy:**
Priority is determined by a combination of Weight and Recency.
- **Weight:** Placement (3000 points) > Result (2000 points) > Event (1000 points).
- **Recency:** Subtract the age in minutes (or ms) to slightly reduce the score of older items. 
This ensures a new Placement completely outranks an old Placement, but an old Placement might still outrank a brand new Event.

**Why a Min-Heap?**
Since we only need the top N (e.g., Top 10) items out of thousands, sorting the entire array `O(M log M)` is computationally wasteful. Instead, we maintain a Min-Heap of size N. 
As we iterate through the list of M notifications `O(M)`:
1. If the heap is less than size N, insert the item.
2. If the heap is full to size N, we compare the current item to the *root* of the Min-Heap (which represents the lowest score currently in the Top N). 
3. If the item's score is greater than the root, we evict the root and insert the new item `O(log N)`.

Final time complexity: `O(M log N)`, which is extremely fast and scalable.

**How will you maintain the top 10 efficiently as new notifications come in?**
When a new notification arrives via the real-time WebSocket connection on the client side:
1. Calculate its priority score.
2. Compare it to the lowest scored item currently in the local UI's Top 10 Inbox.
3. If it's higher, pop the lowest item and insert the new one, re-sorting the small array. Because N is tiny (e.g., 10), simply inserting into an array and doing a standard sort `O(N log N)` on the client side is virtually instantaneous.

*(The code implementation and screenshots for this algorithm are provided in the GitHub repository inside the `notification_app_be` folder).*
