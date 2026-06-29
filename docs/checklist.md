# Servo — MVP Development Checklist

> A practical checklist to track development progress for the 3-week MVP.

---

# Project Setup

## Repository

- [x] Create GitHub repository
- [x] Setup branching strategy
- [x] Protect main branch
- [x] Configure `.gitignore`
- [ ] Add `README.md`

---

## Backend Setup

- [ ] Initialize Express + TypeScript
- [ ] Configure ESLint
- [ ] Configure Prettier
- [ ] Configure Husky
- [ ] Configure lint-staged
- [ ] Configure environment variables
- [ ] Configure Zod validation
- [ ] Configure tsconfig
- [ ] Setup folder structure

---

## Database

- [ ] Install PostgreSQL
- [ ] Setup Prisma
- [ ] Create initial migration
- [ ] Configure Prisma Client
- [ ] Create seed script
- [ ] Seed demo data

---

## Infrastructure

- [ ] Global Error Handler
- [ ] Response Formatter
- [ ] Request Validation
- [ ] Logger (Pino)
- [ ] Helmet
- [ ] CORS
- [ ] Rate Limiter
- [ ] Health Check Endpoint

---

# Authentication

## User Authentication

- [ ] Register
- [ ] Login
- [ ] Refresh Token
- [ ] Logout
- [ ] Forgot Password *(if required)*
- [ ] Reset Password *(if required)*

---

## Authorization

- [ ] JWT Authentication
- [ ] Role-Based Access Control
- [ ] Protected Routes
- [ ] Admin Middleware

---

# User Module

## Backend

- [ ] Get Profile
- [ ] Update Profile
- [ ] Change Password

---

## Admin

- [ ] List Users
- [ ] Search Users
- [ ] View User Details
- [ ] Suspend User *(optional)*

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

- [ ] Station Table
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

- [ ] Swagger Setup
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
- [ ] Generate APK/AAB *(Android)*
- [ ] Generate IPA *(iOS, if required)*

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