# Servo — MVP Development Checklist

> A practical checklist to track development progress for the 3-week MVP.

---

# Project Setup

## Repository

- [x] Create GitHub repository
- [x] Setup branching strategy
- [x] Protect main branch
- [x] Configure `.gitignore`
- [x] Add `README.md`

---

## Backend Setup

- [x] Initialize Express + TypeScript
- [x] Configure ESLint
- [x] Configure Prettier
- [x] Configure Husky
- [x] Configure lint-staged
- [x] Configure environment variables
- [ ] Configure Zod validation
- [x] Configure tsconfig
- [x] Setup folder structure

---

## Database

- [x] Install PostgreSQL
- [x] Setup Prisma
- [x] Create initial migration
- [x] Configure Prisma Client
- [x] Create seed script
- [ ] Seed demo data

---

## Infrastructure

- [x] Global Error Handler
- [x] Response Formatter
- [x] Request Validation
- [ ] Logger (Pino)
- [x] Helmet
- [x] CORS
- [ ] Rate Limiter
- [x] Health Check Endpoint

---

# Authentication

## User Authentication

- [x] Register
- [x] Login
- [x] Refresh Token
- [x] Logout
- [ ] Forgot Password _(if required)_
- [ ] Reset Password _(if required)_

---

## Authorization

- [x] JWT Authentication
- [x] Role-Based Access Control
- [x] Protected Routes
- [x] Admin Middleware

---

# User Module

## Backend

- [x] Get Profile
- [x] Update Profile
- [ ] Change Password

---

## Admin

- [x] List Users
- [x] Search Users
- [x] View User Details
- [ ] Suspend User _(optional)_

---

# Station Module

## Backend

- [ ] Create Station
- [ ] Get Stations
- [ ] Get Station Details
- [ ] Update Station
- [ ] Delete Station
- [ ] Search Stations

---

## Admin Dashboard

- [x] Station Table
- [ ] Add Station
- [ ] Edit Station
- [ ] Delete Station

---

# Order Module

## Backend

- [ ] Create Order
- [ ] Get User Orders
- [ ] Get Order Details
- [ ] Cancel Order
- [ ] Update Order Status

---

## Admin

- [ ] View Orders
- [ ] Filter Orders
- [ ] Update Status

---

# Payment Module

- [ ] Initialize Paystack Payment
- [ ] Verify Payment
- [ ] Configure Webhook
- [ ] Update Order Payment Status

---

# Admin Dashboard (React)

## Authentication

- [ ] Login
- [ ] Logout

---

## Dashboard

- [ ] Dashboard Layout
- [ ] Sidebar
- [ ] Header
- [ ] Statistics Cards

---

## User Management

- [ ] User List
- [ ] User Details

---

## Station Management

- [ ] Station List
- [ ] Create Station
- [ ] Update Station
- [ ] Delete Station

---

## Order Management

- [ ] Order List
- [ ] Order Details
- [ ] Update Status

---

# Mobile App (React Native)

## Authentication

- [ ] Login
- [ ] Register
- [ ] Logout
- [ ] Token Storage

---

## Home

- [ ] Home Screen
- [ ] Station List
- [ ] Search Stations

---

## Stations

- [ ] Station Details

---

## Orders

- [ ] Create Order
- [ ] Payment Screen
- [ ] Order History
- [ ] Order Details

---

## Profile

- [ ] View Profile
- [ ] Update Profile

---

# API Documentation

- [x] Swagger Setup
- [ ] Document Authentication APIs
- [ ] Document Station APIs
- [ ] Document Order APIs
- [ ] Document Payment APIs

---

# Testing

## Backend

- [ ] Authentication Tests
- [ ] User Tests
- [ ] Station Tests
- [ ] Order Tests
- [ ] Payment Tests

---

## Frontend

- [ ] Authentication Flow
- [ ] Place Order Flow
- [ ] Payment Flow
- [ ] Admin Dashboard Flow

---

# Deployment

## Backend

- [ ] Production Build
- [ ] Environment Variables
- [ ] Deploy API
- [ ] Configure Database

---

## Admin Website

- [ ] Production Build
- [ ] Deploy
- [ ] Configure API URL

---

## Mobile App

- [ ] Production Environment
- [ ] API Configuration
- [ ] Generate APK/AAB _(Android)_
- [ ] Generate IPA _(iOS, if required)_

---

# Final QA

- [ ] Register User
- [ ] Login
- [ ] Browse Stations
- [ ] Place Order
- [ ] Make Payment
- [ ] View Order History
- [ ] Admin Login
- [ ] Manage Stations
- [ ] Manage Orders
- [ ] Verify Production Deployment

---

# MVP Completion Criteria

## Backend

- [ ] Authentication Complete
- [ ] User Module Complete
- [ ] Station Module Complete
- [ ] Order Module Complete
- [ ] Payment Module Complete
- [ ] API Documentation Complete

---

## Admin Website

- [ ] Authentication Complete
- [ ] Dashboard Complete
- [ ] User Management Complete
- [ ] Station Management Complete
- [ ] Order Management Complete

---

## Mobile App

- [ ] Authentication Complete
- [ ] Home Complete
- [ ] Station Module Complete
- [ ] Order Module Complete
- [ ] Profile Complete

---

## Deployment

- [ ] Backend Live
- [ ] Admin Website Live
- [ ] Mobile App Connected to Production
- [ ] Client Demo Completed
- [ ] MVP Delivered
