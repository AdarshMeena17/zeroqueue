# Socket.IO Architecture & Integration

QueueZero uses Socket.IO to provide real-time updates for waiting users and staff, enabling instant synchronization without page reloads.

## Core Philosophy
1. **REST APIs remain the single source of truth.** Socket.IO is NOT used for mutating queue state.
2. All queue state changes happen via HTTP `POST /api/queues/...` routes.
3. The backend services perform the database transaction and then **emit** real-time events to connected clients.
4. Clients missing an event can safely resync by calling standard HTTP `GET` endpoints.

## Authentication
Socket connections enforce strict security:
- We do not trust arbitrary client identifiers.
- Upon connection, `socket.auth.js` middleware extracts the HTTP-only `token` cookie.
- It parses the JWT and fetches the user from the database.
- The `socket.user` object is attached to the socket.
- If the token is invalid or missing, the connection is immediately rejected.

## Room Architecture
We isolate events using Socket.IO rooms to prevent data leakage and unnecessary network traffic:

- **Private User Room (`user:{userId}`)**: Every authenticated socket automatically joins its own private room upon connection. Used for sending private token numbers, position updates, and estimated wait times.
- **Queue Room (`queue:{queueId}`)**: Authenticated clients viewing an active department's queue emit `joinQueueRoom` to subscribe to general state updates (e.g., current token being served, paused/active status, total waiting count). Admins may also subscribe to inactive department queues.

## Client -> Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `joinQueueRoom` | `{ queueId }` | Client subscribes to public queue broadcasts. The server validates the ID and joins the socket to `queue:{queueId}`. |
| `leaveQueueRoom`| `{ queueId }` | Client unsubscribes from the queue room. |

## Server -> Client Events
| Event | Payload | Audience | Triggered When |
|-------|---------|----------|----------------|
| `queue:error` | `{ success, message }` | Emit to sender | `joinQueueRoom` fails validation. |
| `queue:status:updated` | `{ queueId, status }` | `queue:{queueId}` | Admin pauses, resumes, or closes a queue. |
| `queue:updated` | `QueueStatus` | `queue:{queueId}` | ANY mutation occurs (join, leave, next, complete). Contains total waiting count and current serving token. |
| `queue:entry:updated` | `{ queueId }` | `queue:{queueId}` | Staff modifies an entry; this is a refresh signal only and contains no entrant data. |
| `user:queue:updated` | `MyEntryStatus` | `user:{userId}` | Sent privately to affected users. Contains real-time `position`, `peopleAhead`, and `estimatedWaitTime`. Triggers for the active user during NEXT, and for ALL users behind someone who leaves or is skipped. |

## Position Recalculation Strategy
When a user is skipped, cancelled, or called to be served, the wait times for everyone *behind* them changes. 
Instead of making the client guess, the backend REST services safely loop through the remaining waiting users, invoke the existing wait-time calculation logic, and emit `user:queue:updated` to their respective private rooms.
