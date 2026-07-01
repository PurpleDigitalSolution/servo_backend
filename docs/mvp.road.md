# Servo — MVP Implementation Roadmap

> Phase-by-phase, day-by-day implementation plan for a production-ready MVP.
> Duration: **3 Weeks (21 Days)**
> Goal: Deliver a deployed backend, Admin Web Dashboard, and User Mobile App.

---

# Timeline Overview

| Phase                         | Days      | Theme                                   |
| ----------------------------- | --------- | --------------------------------------- |
| **1 — Foundation**            | Day 1–5   | Project Setup, Database, Authentication |
| **2 — Core Backend**          | Day 6–12  | Stations, Orders, Payments              |
| **3 — Frontend & Deployment** | Day 13–21 | Admin Dashboard, Mobile App, Deployment |

---

# Phase 1 — Foundation (Day 1–5)

## Day 1 — Project Setup

**Goal:** Development environment fully configured.

| ID        | Task                                       | Acceptance Criteria                           |
| --------- | ------------------------------------------ | --------------------------------------------- |
| SERVO-1.1 | Initialize Express + TypeScript project    | Project runs successfully                     |
| SERVO-1.2 | Configure ESLint, Prettier & Husky         | Code formatting enforced                      |
| SERVO-1.3 | Configure environment validation using Zod | Server fails on invalid environment variables |
| SERVO-1.4 | Setup PostgreSQL & Prisma                  | Database connection successful                |
| SERVO-1.5 | Create initial folder structure            | Modular architecture established              |
| SERVO-1.6 | Configure Git repository                   | Initial commit completed                      |

**Deliverable:** Backend project ready for development.

---

## Day 2 — Database & Authentication

**Goal:** Authentication system fully functional.

| ID        | Task                    | Acceptance Criteria         |
| --------- | ----------------------- | --------------------------- |
| SERVO-2.1 | Design Prisma schema    | Database migration succeeds |
| SERVO-2.2 | Create User model       | Users stored successfully   |
| SERVO-2.3 | Implement Registration  | User account created        |
| SERVO-2.4 | Implement Login         | JWT access token returned   |
| SERVO-2.5 | Implement Refresh Token | New access token generated  |
| SERVO-2.6 | Implement Logout        | Refresh token revoked       |

**Deliverable:** Authentication completed.

---

## Day 3 — Backend Infrastructure

**Goal:** Backend ready for production development.

| ID        | Task                   | Acceptance Criteria              |
| --------- | ---------------------- | -------------------------------- |
| SERVO-3.1 | Global error handling  | Consistent API error responses   |
| SERVO-3.2 | Request validation     | Invalid requests rejected        |
| SERVO-3.3 | Configure Helmet       | Security headers enabled         |
| SERVO-3.4 | Configure CORS         | Frontends connected successfully |
| SERVO-3.5 | Configure Rate Limiter | Abuse protection enabled         |
| SERVO-3.6 | Setup Logger (Pino)    | Requests logged successfully     |
| SERVO-3.7 | Health Check Endpoint  | `/health` returns healthy status |

**Deliverable:** Backend infrastructure complete.

---

## Day 4 — User Management

**Goal:** Complete user profile functionality.

| ID        | Task                     | Acceptance Criteria               |
| --------- | ------------------------ | --------------------------------- |
| SERVO-4.1 | Update Profile API       | User profile updated              |
| SERVO-4.2 | Change Password          | Password updated securely         |
| SERVO-4.3 | Role-Based Authorization | Admin/User roles enforced         |
| SERVO-4.4 | Seed Demo Data           | Demo users and stations available |

**Deliverable:** User management completed.

---

## Day 5 — Deployment Preparation

**Goal:** Backend available online.

| ID        | Task                            | Acceptance Criteria               |
| --------- | ------------------------------- | --------------------------------- |
| SERVO-5.1 | Deploy Backend                  | API accessible online             |
| SERVO-5.2 | Configure Environment Variables | Production configuration complete |
| SERVO-5.3 | Setup Swagger Documentation     | API documentation available       |

**Deliverable:** Backend deployed.

---

# Phase 2 — Core Backend (Day 6–12)

## Day 6 — Station Module

**Goal:** Users can browse fuel stations.

| ID        | Task                | Acceptance Criteria         |
| --------- | ------------------- | --------------------------- |
| SERVO-6.1 | Station CRUD        | Admin manages stations      |
| SERVO-6.2 | List Stations API   | Returns all stations        |
| SERVO-6.3 | Station Details API | Returns station information |
| SERVO-6.4 | Search Stations     | Search works correctly      |

**Deliverable:** Station module completed.

---

## Day 7 — Orders

**Goal:** Users can place fuel orders.

| ID        | Task              | Acceptance Criteria          |
| --------- | ----------------- | ---------------------------- |
| SERVO-7.1 | Create Order API  | Orders created successfully  |
| SERVO-7.2 | Order History API | User sees previous orders    |
| SERVO-7.3 | Order Details API | Order retrieved successfully |
| SERVO-7.4 | Cancel Order API  | Eligible orders cancelled    |

**Deliverable:** Order creation complete.

---

## Day 8 — Order Management

**Goal:** Admin manages customer orders.

| ID        | Task                | Acceptance Criteria         |
| --------- | ------------------- | --------------------------- |
| SERVO-8.1 | Admin Order Listing | Admin views all orders      |
| SERVO-8.2 | Update Order Status | Status changes successfully |
| SERVO-8.3 | Order Filters       | Orders filtered by status   |

**Deliverable:** Order management completed.

---

## Day 9 — Payments

**Goal:** Online payment working.

| ID        | Task               | Acceptance Criteria            |
| --------- | ------------------ | ------------------------------ |
| SERVO-9.1 | Integrate Paystack | Payment initialized            |
| SERVO-9.2 | Verify Payment     | Payment verified successfully  |
| SERVO-9.3 | Implement Webhook  | Payments updated automatically |

**Deliverable:** Payments functional.

---

## Day 10 — Admin APIs

**Goal:** Backend supports admin dashboard.

| ID         | Task                     | Acceptance Criteria         |
| ---------- | ------------------------ | --------------------------- |
| SERVO-10.1 | Dashboard Statistics API | Summary statistics returned |
| SERVO-10.2 | User Management API      | Admin manages users         |
| SERVO-10.3 | Station Management API   | CRUD operations complete    |

**Deliverable:** Admin APIs completed.

---

## Day 11 — Backend Testing

**Goal:** Core backend validated.

| ID         | Task                | Acceptance Criteria   |
| ---------- | ------------------- | --------------------- |
| SERVO-11.1 | Test Authentication | Authentication passes |
| SERVO-11.2 | Test Orders         | Orders pass testing   |
| SERVO-11.3 | Test Payments       | Payments verified     |

**Deliverable:** Backend stable.

---

## Day 12 — Bug Fixes

**Goal:** Backend ready for frontend integration.

| ID         | Task              | Acceptance Criteria      |
| ---------- | ----------------- | ------------------------ |
| SERVO-12.1 | Fix Critical Bugs | No blocking issues       |
| SERVO-12.2 | API Cleanup       | Consistent API responses |

**Deliverable:** Backend feature complete.

---

# Phase 3 — Frontend & Deployment (Day 13–21)

## Day 13–15 — Admin Dashboard

**Goal:** Admin website functional.

| ID         | Task                  | Acceptance Criteria        |
| ---------- | --------------------- | -------------------------- |
| SERVO-13.1 | Admin Authentication  | Login works                |
| SERVO-13.2 | Dashboard Layout      | Dashboard accessible       |
| SERVO-13.3 | User Management UI    | Users managed successfully |
| SERVO-13.4 | Station Management UI | CRUD works                 |
| SERVO-13.5 | Order Management UI   | Orders managed             |

**Deliverable:** Admin website complete.

---

## Day 16–19 — Mobile App

**Goal:** User application functional.

| ID         | Task                   | Acceptance Criteria       |
| ---------- | ---------------------- | ------------------------- |
| SERVO-16.1 | Authentication Screens | Login & registration work |
| SERVO-16.2 | Home Screen            | Stations displayed        |
| SERVO-16.3 | Station Details        | Details displayed         |
| SERVO-16.4 | Place Order            | Orders created            |
| SERVO-16.5 | Payment Flow           | Payment successful        |
| SERVO-16.6 | Order History          | Orders listed             |
| SERVO-16.7 | Profile Screen         | Profile updated           |

**Deliverable:** Mobile application complete.

---

## Day 20–21 — Final Deployment & QA

**Goal:** Production-ready MVP.

| ID         | Task                             | Acceptance Criteria       |
| ---------- | -------------------------------- | ------------------------- |
| SERVO-20.1 | Deploy Admin Website             | Website accessible        |
| SERVO-20.2 | Configure Production Environment | All services connected    |
| SERVO-20.3 | End-to-End Testing               | Complete user flow passes |
| SERVO-20.4 | Fix Final Bugs                   | No critical issues remain |
| SERVO-20.5 | Client Acceptance Demo           | MVP approved              |

**Deliverable:** Production-ready MVP deployed.

---

# MVP Scope

✅ User Authentication

✅ Admin Authentication

✅ User Management

✅ Station Management

✅ Fuel Ordering

✅ Payment Integration (Paystack)

✅ Order Management

✅ Admin Dashboard

✅ Mobile App

✅ Backend Deployment

✅ Admin Website Deployment

---

# Out of Scope (Future Versions)

- Wallet System
- Cashback
- Live GPS Tracking
- WebSockets
- Push Notifications
- Google Maps Integration
- Reviews & Ratings
- Analytics Dashboard
- Redis Caching
- CI/CD Pipeline
- Monitoring (Sentry, DataDog)
- 2FA
- NIN Verification
- Advanced Reporting

---

# Tech Stack

- **Runtime:** Node.js (LTS)
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Payment:** Paystack
- **Validation:** Zod
- **Logging:** Pino
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI
- **Admin Web:** React
- **Mobile App:** React Native (Expo)

---

# Success Metrics

- Backend deployed and accessible.
- Admin website deployed and operational.
- Mobile app connected to production backend.
- Users can register, log in, place orders, and make payments.
- Admins can manage users, stations, and orders.
- Critical user flows tested and functioning.

---

**Version:** 1.0 MVP
**Duration:** 3 Weeks (21 Days)
**Goal:** Deliver a fully functional MVP ready for client review and production deployment.
