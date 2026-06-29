# Servo — Backend Implementation Roadmap

> Phase-by-phase, sprint-by-sprint development plan for the TypeScript backend.
> 6 months · 12 sprints · Starting May 2026
> Fuel Delivery Platform · v1.0

---

## Timeline Overview

| Phase                     | Sprints | Weeks | Dates           | Theme                             |
| ------------------------- | ------- | ----- | --------------- | --------------------------------- |
| **1 — Foundation**        | S1–S2   | 1–4   | May 2 – May 27  | Project Setup, Auth, Database     |
| **2 — Core Features**     | S3–S4   | 5–8   | May 28 – Jun 24 | Stations, Orders, Real-time       |
| **3 — Payments**          | S5–S6   | 9–12  | Jun 25 – Jul 22 | Paystack Integration, Wallets     |
| **4 — Delivery Tracking** | S7–S8   | 13–16 | Jul 23 – Aug 19 | Real-time Tracking, Maps          |
| **5 — Admin & Analytics** | S9–S10  | 17–20 | Aug 20 – Sep 16 | Admin Dashboard, Dashboards       |
| **6 — Testing & Polish**  | S11–S12 | 21–24 | Sep 17 – Oct 14 | Testing, Optimization, MVP Launch |

---

## Phase 1 — Foundation (Sprints 1–2)

### Sprint 1 (Weeks 1–2) — Project Setup & Database Schema

**Goal:** Development environment fully operational, TypeScript configured, database schema deployed, seed data populated.

**Priority Focus:** Mobile-first API design, real-time infrastructure setup

| ID        | Task                                                                           | Acceptance Criteria                                                      |
| --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| SERVO-1.1 | Set up Express.js + TypeScript project — configured for strict type-checking   | `npm run dev` runs without type errors                                   |
| SERVO-1.2 | Configure environment variables with Zod validation                            | `.env.example` provided, server refuses to start with missing vars       |
| SERVO-1.3 | Implement Prisma schema v1 — User, UserProfile, Station, Order, Payment models | `prisma migrate dev` runs clean, all tables created                      |
| SERVO-1.4 | Create database seed script — 50 stations, 5 test users, admin account         | `npm run db:seed` completes without errors                               |
| SERVO-1.5 | Set up global error handler middleware with structured logging                 | All errors return `{ success: false, error: { code, message } }`         |
| SERVO-1.6 | Implement request logging middleware (Winston/Pino)                            | All requests logged with request ID for tracing                          |
| SERVO-1.7 | Configure CORS, rate limiting, security headers (helmet)                       | Mobile client can connect, requests limited to 100/min per IP            |
| SERVO-1.8 | Set up health check endpoint                                                   | `GET /api/v1/health` returns `{ success: true, data: { status: "ok" } }` |
| SERVO-1.9 | Configure WebSocket server for real-time features                              | WebSocket server listens on /ws, handles connections gracefully          |

**Deliverable:** Backend server starts cleanly, connects to PostgreSQL via Prisma, serves health endpoint, WebSocket ready.

---

### Sprint 2 (Weeks 3–4) — Authentication & User Management

**Goal:** User registration, login, 2FA, NIN verification pipeline ready; JWT tokens implemented.

| ID        | Task                                                            | Acceptance Criteria                                            |
| --------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| SERVO-2.1 | Implement JWT authentication strategy — access + refresh tokens | Tokens issued on login, refresh endpoint functional            |
| SERVO-2.2 | Create user registration endpoint with email verification       | New users receive verification email, must verify before login |
| SERVO-2.3 | Implement password reset flow with secure tokens                | Password reset tokens expire in 1 hour, single-use only        |
| SERVO-2.4 | Add 2FA setup endpoint (TOTP with authenticator app)            | Users can enable/disable 2FA, codes validated correctly        |
| SERVO-2.5 | Create NIN verification endpoint (mock for now)                 | Accepts NIN, validates format, stores verification status      |
| SERVO-2.6 | Implement user profile update endpoint                          | Update name, phone, address, profile picture                   |
| SERVO-2.7 | Add role-based access control (RBAC) middleware                 | Users, Admins, Agents have separate permissions                |
| SERVO-2.8 | Create user listing endpoint (admin only)                       | Paginated, filterable by role, status, verification status     |
| SERVO-2.9 | Set up auth tests (unit + integration)                          | >90% coverage on auth endpoints                                |

**Deliverable:** Full auth flow working—register → verify email → login → 2FA → dashboard access.

---

## Phase 2 — Core Features (Sprints 3–4)

### Sprint 3 (Weeks 5–6) — Stations & Real-Time Setup

**Goal:** Station management, real-time availability updates, WebSocket infrastructure for mobile clients.

| ID        | Task                                                                          | Acceptance Criteria                                        |
| --------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| SERVO-3.1 | Create Station model schema — location, fuel types, prices, inventory         | Prisma migration clean, constraints enforced               |
| SERVO-3.2 | Implement station listing endpoint — filtering by location, fuel type, rating | Returns paginated results, filters work correctly          |
| SERVO-3.3 | Add station detail endpoint with reviews/ratings                              | Single station details + user reviews visible              |
| SERVO-3.4 | Implement real-time station availability updates via WebSocket                | Mobile client receives fuel availability changes instantly |
| SERVO-3.5 | Create station admin panel endpoints (update prices, inventory)               | Admins can update fuel prices and inventory counts         |
| SERVO-3.6 | Add geolocation-based station search (lat/lng)                                | Returns 10 nearest stations sorted by distance             |
| SERVO-3.7 | Implement station rating/review system                                        | Users can rate (1-5 stars) and leave reviews               |
| SERVO-3.8 | Create station uptime/status tracking                                         | Track which stations are online/offline                    |

**Deliverable:** Mobile client can browse stations in real-time, see fuel availability, receive live updates via WebSocket.

---

### Sprint 4 (Weeks 7–8) — Order Management

**Goal:** Order creation, tracking, status updates; real-time order sync to mobile.

| ID        | Task                                                                               | Acceptance Criteria                                           |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| SERVO-4.1 | Create Order schema — user, station, fuel type, quantity, price, status            | Schema supports order lifecycle states                        |
| SERVO-4.2 | Implement create order endpoint — validate station availability, calculate total   | Orders created with `pending` status                          |
| SERVO-4.3 | Add order listing endpoint (user) — show user's orders with filters                | Paginated, filterable by status, date range                   |
| SERVO-4.4 | Implement order status update flow (pending → confirmed → in-delivery → completed) | Status transitions validated, only allowed sequences accepted |
| SERVO-4.5 | Create real-time order update notifications via WebSocket                          | User receives live updates when order status changes          |
| SERVO-4.6 | Add order cancellation endpoint with refund logic                                  | Orders can be cancelled within time window, refunds triggered |
| SERVO-4.7 | Implement delivery location selection (address + GPS)                              | Orders store delivery coordinates and address                 |
| SERVO-4.8 | Create order history endpoint with pagination                                      | Users can view past 100 orders with details                   |
| SERVO-4.9 | Set up order tracking schema (timestamp, location updates)                         | Each status change logged with timestamp                      |

**Deliverable:** Users can place orders, track status in real-time, receive WebSocket notifications on mobile.

---

## Phase 3 — Payments (Sprints 5–6)

### Sprint 5 (Weeks 9–10) — Paystack Integration & Wallets

**Goal:** Payment processing via Paystack, wallet system, transaction history.

| ID        | Task                                                           | Acceptance Criteria                                                |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| SERVO-5.1 | Integrate Paystack API — initialize payment for orders         | Payment initialized, returns authorization URL                     |
| SERVO-5.2 | Implement payment verification endpoint                        | Webhook from Paystack verified, order marked as paid               |
| SERVO-5.3 | Create wallet system — store user balance, transaction history | Users have wallet account, balance tracked accurately              |
| SERVO-5.4 | Implement wallet top-up endpoint via Paystack                  | Users can add funds to wallet, reflected immediately after payment |
| SERVO-5.5 | Add wallet withdrawal endpoint                                 | Users can request cashout (processed daily)                        |
| SERVO-5.6 | Create transaction history endpoint                            | Paginated, shows all debits/credits with timestamps                |
| SERVO-5.7 | Implement cashback calculation and credit                      | Orders generate cashback (e.g., 2% of order value)                 |
| SERVO-5.8 | Create payment error handling & retry logic                    | Failed payments can be retried without duplicate charges           |
| SERVO-5.9 | Set up webhook security (signature verification, idempotency)  | Paystack webhooks validated, duplicate events ignored              |

**Deliverable:** Users can pay via Paystack, receive cashback, track wallet, withdraw funds.

---

### Sprint 6 (Weeks 11–12) — Payment Analytics & Settlements

**Goal:** Payment reporting, settlement reconciliation, fraud detection basics.

| ID        | Task                                                                        | Acceptance Criteria                            |
| --------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| SERVO-6.1 | Create payment summary endpoint (admin) — daily revenue, transactions count | Returns aggregated payment data for date range |
| SERVO-6.2 | Implement settlement tracking — which payments settled, pending             | Settlement status tracked per transaction      |
| SERVO-6.3 | Add refund management endpoint                                              | Admins can initiate refunds, status tracked    |
| SERVO-6.4 | Create transaction dispute handling (basic)                                 | Users can flag suspicious transactions         |
| SERVO-6.5 | Implement payment reconciliation report                                     | Daily settlement vs. Paystack statements match |

**Deliverable:** Payment reporting functional, admins can see revenue dashboards, settlements tracked.

---

## Phase 4 — Delivery Tracking (Sprints 7–8)

### Sprint 7 (Weeks 13–14) — Real-Time Location Tracking

**Goal:** GPS tracking, delivery agent assignment, live location updates via WebSocket.

| ID        | Task                                                        | Acceptance Criteria                                     |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| SERVO-7.1 | Create DeliveryAgent model schema                           | Agent assigned to orders, tracks active/inactive status |
| SERVO-7.2 | Implement delivery agent location update endpoint (GPS)     | Agents send lat/lng, stored in real-time tracker        |
| SERVO-7.3 | Create live tracking WebSocket for users                    | Users see delivery agent location in real-time on map   |
| SERVO-7.4 | Implement order assignment to nearest agent                 | System auto-assigns nearby agents to new orders         |
| SERVO-7.5 | Add agent acceptance/rejection workflow                     | Agents can accept/reject orders, reassignment triggered |
| SERVO-7.6 | Create estimated time of arrival (ETA) calculation          | Calculate ETA based on distance, traffic patterns       |
| SERVO-7.7 | Implement delivery completion flow — photo proof, signature | Agents upload delivery photo, order marked complete     |
| SERVO-7.8 | Add delivery history for agents                             | Agents can view completed deliveries                    |

**Deliverable:** Real-time delivery tracking on mobile—users see agent location, ETA updates live.

---

### Sprint 8 (Weeks 15–16) — Geolocation & Maps

**Goal:** Google Maps integration, location validation, geofencing basics.

| ID        | Task                                                                  | Acceptance Criteria                                  |
| --------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| SERVO-8.1 | Integrate Google Maps API — place autocomplete for delivery addresses | Address autocomplete works on mobile app             |
| SERVO-8.2 | Implement address validation & geocoding                              | Coordinates extracted from addresses, validated      |
| SERVO-8.3 | Create geofence logic — detect when delivery in progress              | Agents notified when arriving at delivery location   |
| SERVO-8.4 | Add service area validation — check if delivery location serviceable  | Orders rejected for out-of-service locations         |
| SERVO-8.5 | Implement distance calculation (haversine formula)                    | Accurate distance between station and delivery point |
| SERVO-8.6 | Create delivery radius configuration (admin)                          | Admins can set service areas per station             |

**Deliverable:** Delivery addresses validated via maps, geofencing works, service area enforced.

---

## Phase 5 — Admin & Analytics (Sprints 9–10)

### Sprint 9 (Weeks 17–18) — Admin Dashboard Backend

**Goal:** Admin endpoints for user management, order oversight, revenue analytics.

| ID        | Task                                                                         | Acceptance Criteria                               |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| SERVO-9.1 | Create admin user listing & management endpoints                             | Admins can view, search, filter, deactivate users |
| SERVO-9.2 | Implement user ban/suspend functionality                                     | Banned users cannot log in                        |
| SERVO-9.3 | Create order management endpoints (admin) — view all orders, force cancel    | Admins can view/cancel any order                  |
| SERVO-9.4 | Add station management endpoints — CRUD operations                           | Admins can create, update, delete stations        |
| SERVO-9.5 | Implement agent management — assign/remove agents, view performance          | Agent performance metrics tracked                 |
| SERVO-9.6 | Create system configuration endpoint (admin) — update commission rates, fees | Global settings manageable                        |

**Deliverable:** Admin dashboard has full backend support for user/order/station management.

---

### Sprint 10 (Weeks 19–20) — Analytics & Reporting

**Goal:** Revenue dashboards, user engagement metrics, operational KPIs.

| ID         | Task                                                                              | Acceptance Criteria                                |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| SERVO-10.1 | Create revenue analytics endpoint — daily/weekly/monthly totals                   | Aggregated revenue by period                       |
| SERVO-10.2 | Implement order metrics — completion rate, cancellation rate, avg order value     | KPI calculations accurate                          |
| SERVO-10.3 | Add user acquisition metrics — new users per day, retention                       | User growth tracked                                |
| SERVO-10.4 | Create payment method breakdown report                                            | Revenue by payment method (Paystack, wallet, etc.) |
| SERVO-10.5 | Implement agent performance metrics — deliveries completed, rating, response time | Agent leaderboards, individual stats               |
| SERVO-10.6 | Add geographic analytics — revenue by location, station performance               | Regional performance visible                       |

**Deliverable:** Analytics dashboard functional, admins can see all key metrics, generate reports.

---

## Phase 6 — Testing & Polish (Sprints 11–12)

### Sprint 11 (Weeks 21–22) — Comprehensive Testing

**Goal:** Unit tests, integration tests, end-to-end tests; >80% code coverage.

| ID         | Task                                                 | Acceptance Criteria                               |
| ---------- | ---------------------------------------------------- | ------------------------------------------------- |
| SERVO-11.1 | Write unit tests for all services                    | >80% coverage on business logic                   |
| SERVO-11.2 | Write integration tests for all API endpoints        | Every endpoint has at least 2 integration tests   |
| SERVO-11.3 | Test payment flow end-to-end                         | Full order → payment → confirmation cycle tested  |
| SERVO-11.4 | Test real-time WebSocket features                    | Multiple concurrent connections tested            |
| SERVO-11.5 | Test error handling & edge cases                     | Invalid inputs, network failures, race conditions |
| SERVO-11.6 | Load testing — simulate 100+ concurrent users        | Server handles load without timeouts              |
| SERVO-11.7 | Security testing — SQL injection, CSRF, token expiry | OWASP Top 10 vulnerabilities checked              |

**Deliverable:** Test suite comprehensive, automated CI/CD pipeline passing, >80% coverage.

---

### Sprint 12 (Weeks 23–24) — Optimization & MVP Launch

**Goal:** Performance optimization, documentation, production-ready deployment.

| ID         | Task                                                            | Acceptance Criteria                            |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------- |
| SERVO-12.1 | Database query optimization — add indexes, optimize N+1 queries | Query performance < 200ms avg                  |
| SERVO-12.2 | Implement caching layer (Redis) for frequently accessed data    | Station list cached, ETA calculations cached   |
| SERVO-12.3 | Optimize WebSocket implementation — batch updates, compression  | WebSocket messages < 50ms latency              |
| SERVO-12.4 | Create API documentation (OpenAPI/Swagger)                      | Interactive docs available at /api/docs        |
| SERVO-12.5 | Set up monitoring & alerting (Sentry, DataDog, LogRocket)       | Errors tracked, alerts configured              |
| SERVO-12.6 | Create deployment automation (GitHub Actions)                   | Automated testing, build, deploy to staging    |
| SERVO-12.7 | Write deployment guide & runbooks                               | Production setup documented, runbooks ready    |
| SERVO-12.8 | Set up production database backups & recovery plan              | Daily backups, recovery tested                 |
| SERVO-12.9 | Prepare for MVP launch — final QA, go/no-go criteria            | All critical tests pass, performance meets SLA |

**Deliverable:** Backend production-ready, monitored, documented; MVP launch approved.

---

## Key Priorities Addressed

✅ **Mobile-First** — All endpoints optimized for mobile clients, WebSocket for real-time sync
✅ **Payment Processing** — Paystack integrated, wallet system, transaction tracking
✅ **Real-Time Tracking** — WebSocket infrastructure, live location updates, delivery tracking

---

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js 5.x + TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Real-Time**: Socket.io / ws (WebSocket)
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Payment**: Paystack API
- **Logging**: Winston or Pino
- **Testing**: Jest, Supertest
- **Monitoring**: Sentry, DataDog (optional)
- **Caching**: Redis (optional, Sprint 12)
- **API Docs**: Swagger/OpenAPI
- **CI/CD**: GitHub Actions

---

## Dependencies (High-Level)

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    "typescript": "^5.3.0",
    "jsonwebtoken": "^9.1.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "socket.io": "^4.7.0",
    "axios": "^1.6.0",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "@types/jest": "^29.5.0"
  }
}
```

---

## Success Metrics

- **Code Quality**: >80% test coverage, 0 critical security vulnerabilities
- **Performance**: API response time <200ms (p95), WebSocket latency <50ms
- **Availability**: 99.5% uptime, <1s recovery on failures
- **User Adoption**: Mobile app can successfully order fuel → payment → tracking → delivery

---

## Notes

- Sprints are 2 weeks each; each phase review marks go/no-go for next phase
- Real-time features prioritized early (WebSocket infrastructure in Sprint 1)
- Payment processing mid-project (critical path item)
- Testing distributed across sprints, not back-loaded
- Monitoring/alerting critical before MVP launch
- Database backup & disaster recovery tested before production

---

**Version**: 1.0
**Last Updated**: May 2, 2026
**Next Review**: Sprint 1 retrospective (May 27, 2026)
