# TicketHub: Ticketing Website Design

## 1. Requirements

### Functional requirements
1. Visitors can browse events by name, date, venue, category, and location.
2. Users can register, sign in, and manage their profiles.
3. Users can view event details, ticket prices, seat maps, and live seat availability.
4. Users can select seats and temporarily reserve them during checkout.
5. The system prevents a seat from being confirmed for more than one order.
6. Users can pay through a payment provider and receive an order confirmation and ticket.
7. Users can view, download, or receive tickets by email.
8. Organisers can create events, configure venues and seat maps, set prices, and view sales.
9. Administrators can cancel or update events, issue refunds where appropriate, and investigate suspicious activity.
10. The system records orders, payments, reservation expirations, and important administrative actions.

### Non-functional requirements
- **Consistency:** a seat can have no more than one active reservation or confirmed sale for a particular event.
- **Availability:** browsing should remain available during sales spikes, even if checkout is temporarily queued or rate-limited.
- **Performance:** ordinary event pages should generally load within 2 seconds at normal load; seat selection and checkout should return clear status promptly.
- **Scalability:** stateless web/API services can scale horizontally, and traffic-heavy reads can be cached.
- **Security:** use HTTPS, secure password hashing, authentication and role-based authorisation; validate inputs; protect against common web attacks; never store raw payment-card details.
- **Reliability:** durable order and payment records, database backups, monitoring, alerts, and recovery procedures.
- **Fairness:** apply a waiting room and rate limits during high-demand releases, with a clear queue position and no promise that entry guarantees a ticket.
- **Accessibility:** support keyboard navigation, screen readers, readable contrast, and mobile layouts.
- **Observability:** measure request latency, error rates, queue depth, failed payments, and seat-conflict attempts.

## 2. Traffic estimates

### Normal day
Given:
- 50,000 visitors per day
- 10 page views per visitor
- 5,000 tickets sold per day

Calculations:
- Page views per day = 50,000 × 10 = **500,000**
- Average page views per second = 500,000 ÷ 86,400 ≈ **5.8 page views/second**
- Average visitors per second = 50,000 ÷ 86,400 ≈ **0.58 visitors/second**
- Average tickets sold per second = 5,000 ÷ 86,400 ≈ **0.058 tickets/second**

Daily averages hide peaks, so the design should handle perhaps 10–20 times the average browsing rate during busy periods. These are planning assumptions, not measured forecasts.

### Popular concert on sale
Given 200,000 people attempt to buy 20,000 seats in the first 10 minutes:
- Arrival rate = 200,000 ÷ 600 seconds ≈ **333 people/second**
- Maximum seat-to-interested-person ratio = 20,000 ÷ 200,000 = **10%**
- If every person checks availability and makes several API calls, checkout traffic can be several times the arrival rate.

The waiting room admits customers to the purchase flow at a controlled rate. A queue and rate limiter protect the database; browsing pages and static event information can be served from a CDN/cache. The inventory service must still enforce correctness even if thousands of requests arrive at once. Capacity should be load-tested above the estimated peak, for example at 500–700 entrants per second, and adjusted using test results.

## 3. API design

All endpoints use HTTPS and JSON. Authenticated endpoints require a session or bearer token. Responses include appropriate HTTP status codes and a request/correlation ID.

| Method and endpoint | Purpose | Example outcome |
|---|---|---|
| `GET /api/events` | Search and filter published events | `200 OK` with event list |
| `GET /api/events/{eventId}` | Get event details, venue, prices, and sale status | `200 OK` |
| `GET /api/events/{eventId}/seats` | Read seat map and current availability | `200 OK`; availability is advisory until a hold succeeds |
| `POST /api/reservations` | Hold selected seats for a short period | `201 Created` if held; `409 Conflict` if unavailable |
| `GET /api/reservations/{reservationId}` | Check reservation status and expiry | `200 OK` |
| `POST /api/orders` | Create an order from a valid reservation and idempotency key | `201 Created`; reject expired/invalid holds |
| `POST /api/payments/webhook` | Receive signed payment-provider status updates | `200 OK` after safe processing |
| `GET /api/orders/{orderId}` | View order and ticket status | `200 OK` for an authorised owner |
| `POST /api/reservations/{reservationId}/release` | Release a user's hold before expiry | `200 OK` if released |

### API rules
- `POST /api/reservations` checks seat availability and creates the hold in a database transaction. It returns a reservation ID and `expiresAt`.
- Require an **idempotency key** on order creation and payment initiation so retries do not create duplicate orders or charges.
- The payment webhook verifies the provider's signature and handles repeated events safely.
- Do not trust the seat map shown in the browser; the server rechecks inventory during reservation and order confirmation.
- Return `409 Conflict` when a seat has already been held or sold. Return `410 Gone` or a clear conflict response for an expired reservation.
- Authorise every order and reservation lookup so one user cannot inspect another user's purchase.

## 4. Data model

The core relational database uses transactions and constraints to preserve inventory correctness.

### Tables

**Users**
- `user_id` (PK)
- `name`
- `email` (unique)
- `password_hash`
- `created_at`

**Events**
- `event_id` (PK)
- `organiser_id` (FK → Users.user_id)
- `title`
- `venue_id` (FK → Venues.venue_id)
- `starts_at`
- `sale_starts_at`
- `status`

**Venues**
- `venue_id` (PK)
- `name`
- `address`

**Seats**
- `seat_id` (PK)
- `venue_id` (FK → Venues.venue_id)
- `section`
- `row_label`
- `seat_number`
- Unique constraint on (`venue_id`, `section`, `row_label`, `seat_number`)

**EventSeats**
- `event_seat_id` (PK)
- `event_id` (FK → Events.event_id)
- `seat_id` (FK → Seats.seat_id)
- `price`
- `status` (available, held, sold)
- `reservation_id` (nullable FK → Reservations.reservation_id)
- Unique constraint on (`event_id`, `seat_id`)

**Reservations**
- `reservation_id` (PK)
- `user_id` (FK → Users.user_id)
- `event_id` (FK → Events.event_id)
- `status` (active, expired, released, converted)
- `created_at`
- `expires_at`

**Orders**
- `order_id` (PK)
- `user_id` (FK → Users.user_id)
- `reservation_id` (FK → Reservations.reservation_id, unique)
- `total_amount`
- `currency`
- `status` (pending, paid, cancelled, refunded)
- `created_at`
- Unique `idempotency_key` for order creation (or unique per user)

**Payments**
- `payment_id` (PK)
- `order_id` (FK → Orders.order_id)
- `provider_reference` (unique)
- `amount`
- `status` (pending, succeeded, failed, refunded)
- `updated_at`

### Relationships
- One user can create many reservations and orders.
- One venue has many seats and can host many events.
- Each event belongs to one venue and has many event-seat inventory records.
- Each physical seat can be offered at many events, but only once per event due to the unique (`event_id`, `seat_id`) constraint.
- A reservation can cover multiple event seats. Each event-seat record can point to its active reservation.
- One order is created from one reservation; an order can have multiple payment attempts, while each provider payment reference is unique.

### How duplicate seat sales are prevented
The browser's seat map is only a display; it does not lock seats. When a customer selects a seat, the inventory service performs an atomic database transaction:
1. Lock the relevant `EventSeats` row(s) (for example, with `SELECT ... FOR UPDATE`) in a consistent order to reduce deadlocks.
2. Check that each seat is still available, then mark it `held`, create a reservation, and set a short expiry (for example, five minutes).
3. Commit the transaction. If any requested seat is unavailable, roll back the entire reservation so the user does not receive only part of a requested group unexpectedly.
4. A background worker expires old holds and returns their seats to `available`, but it only releases a seat if the stored reservation is still the one that expired.
5. At checkout, the service verifies that the reservation is active and unexpired before creating the order. Successful payment converts the held seats to `sold` in a transaction.

The database is the final authority. Use a conditional update such as `UPDATE EventSeats SET status='held' ... WHERE event_id=? AND seat_id=? AND status='available'`, and confirm exactly one row was updated. Unique constraints and transactional locking are additional safeguards. If two requests race for the same seat, only one can change it from `available`; the other receives `409 Conflict`. Payment callbacks are idempotent, and tickets are issued only after a verified successful payment and a valid reservation. If payment succeeds after a hold has expired, the system must not sell the seat again to that customer; it should attempt a safe recovery flow or refund and alert support.

## 5. Architecture

```text
                         +----------------------+
                         | Customers / Organisers|
                         +-----------+----------+
                                     |
                                  HTTPS
                                     v
                         +----------------------+
                         | CDN + WAF + Rate Limit|
                         | Static assets / cache |
                         +-----------+----------+
                                     |
                                     v
                         +----------------------+
                         | Load Balancer / API  |
                         | Gateway              |
                         +-----------+----------+
                                     |
                    +----------------+----------------+
                    |                |                |
                    v                v                v
             +-------------+  +-------------+  +--------------+
             | Event/Search|  | Inventory & |  | User / Order |
             | Service     |  | Reservation |  | Service      |
             +------+------+  +------+------+  +------+-------+
                    |                |                 |
                    |                +--------+--------+
                    |                         |
                    v                         v
             +-------------+          +------------------+
             | Cache /     |          | Relational DB    |
             | Search Index|          | transactions,    |
             +-------------+          | constraints      |
                                      +--------+---------+
                                               |
                              +----------------+----------------+
                              |                                 |
                              v                                 v
                     +----------------+                 +----------------+
                     | Queue / Workers|                 | Payment Provider|
                     | expiry, email, |<--- signed ---->| (external)     |
                     | ticket issuing |     webhook     +----------------+
                     +-------+--------+
                             |
                             v
                     +----------------+
                     | Email / Ticket |
                     | delivery        |
                     +----------------+
```

### Component explanations
- **Customers and organisers:** use the website on desktop or mobile. Organiser functions are permission-protected.
- **CDN, WAF, and rate limiter:** serve static files close to users, block common malicious traffic, and limit abuse. During a major sale, the waiting room controls admission to checkout.
- **Load balancer/API gateway:** distributes requests across service instances and centralises routing, request limits, and correlation IDs.
- **Event/search service:** serves event listings and details. Frequently read data can be cached because it changes less often than seat inventory.
- **Inventory/reservation service:** owns seat holds, expiry, and seat-state transitions. All writes that affect a seat go through this service and the transactional database.
- **User/order service:** manages accounts, orders, authorisation, and order history.
- **Relational database:** stores authoritative users, event-seat inventory, reservations, orders, and payment status. Transactions, row locks, and unique constraints protect consistency.
- **Cache/search index:** improves read performance but is never the source of truth for whether a seat can be sold.
- **Queue and workers:** process hold expiry, email delivery, ticket generation, and retryable background tasks without blocking web requests.
- **Payment provider:** securely processes payments. TicketHub stores provider references and payment states rather than raw card details. Signed webhooks update payment status idempotently.
- **Monitoring and logs:** collect metrics, traces, and structured logs across components; alerts notify the team about errors, slow responses, queue growth, and inventory conflicts.

## 6. Trade-offs

### Trade-off 1: Strong consistency versus maximum throughput
Seat inventory uses transactional relational writes, locks, and constraints. This may reduce write throughput and increase latency compared with an eventually consistent inventory cache, but it prevents duplicate sales. This is the right choice for seat allocation because correctness is more important than a small speed gain. Caching is used for event pages, not final seat ownership.

### Trade-off 2: Waiting room versus immediate access
A virtual waiting room adds friction and means some users wait before checkout. However, it smooths the 200,000-person burst, protects core services, and gives the platform a more controlled and fair sale. Queue rules should be transparent and monitored for abuse.

### Trade-off 3: Microservices versus a simpler modular application
Separate services can scale inventory independently from event browsing, but they add deployment, monitoring, network, and debugging complexity. For an initial release, TicketHub could start as a modular application with clear service boundaries and a separate queue, then split high-load components only when load tests justify it.

### Trade-off 4: Short seat holds versus customer convenience
A short hold (such as five minutes) reduces the time seats remain unavailable when users abandon checkout, but it can pressure customers who need more time to pay. A clear countdown, accessible checkout, and carefully designed payment-retry policy help balance convenience and inventory turnover.

## Operational checks before launch
- Load-test normal traffic and the concert-sale scenario, including failed and repeated requests.
- Test two simultaneous customers reserving the same seat; verify exactly one succeeds.
- Test reservation expiry, payment timeouts, duplicate webhooks, and late payment success.
- Back up the database and rehearse recovery.
- Monitor waiting-room length, reservation conflicts, payment conversion, and checkout latency.
