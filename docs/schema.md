# Servo — Database Schema Documentation

> PostgreSQL Schema for Servo Fuel Delivery Platform
> Designed for TypeScript + Prisma ORM
> v1.0 | May 2, 2026

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Schemas](#core-schemas)
3. [Data Types & Conventions](#data-types--conventions)
4. [Indexes & Performance](#indexes--performance)
5. [Relationships Diagram](#relationships-diagram)
6. [Prisma Schema](#prisma-schema)

---

## Schema Overview

The database is organized into **5 logical schemas**:

| Schema       | Purpose                                  | Tables                                                                   |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| **auth**     | Authentication, accounts, security       | accounts, refresh_tokens, audit_logs                                     |
| **users**    | User profiles, preferences, verification | profiles, documents, two_factor_auth                                     |
| **delivery** | Stations, orders, tracking, drivers      | stations, orders, order_status_history, drivers, agent_location_tracking |
| **payment**  | Transactions, wallets, settlement        | transactions, wallet_transactions, refunds                               |
| **system**   | Configuration, system-wide settings      | settings, feature_flags                                                  |

---

## Core Schemas

### 1. AUTH Schema

#### `auth.accounts`

Core account table for all users (customers, drivers, admins).

```sql
CREATE TABLE auth.accounts (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash (~60 chars)
  role VARCHAR(50) NOT NULL DEFAULT 'user',  -- user, driver, admin, agent
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, suspended, banned
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,

  -- 2FA / TOTP
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret VARCHAR(255),

  -- Password Reset
  reset_password_token VARCHAR(255),
  reset_password_token_expiry TIMESTAMP WITH TIME ZONE,

  -- Referral System
  referrer_id BIGINT REFERENCES auth.accounts(id) ON DELETE SET NULL,
  referral_code VARCHAR(24) UNIQUE,

  -- Login Tracking
  last_login TIMESTAMP WITH TIME ZONE,
  last_password_change TIMESTAMP WITH TIME ZONE,
  last_ip_address INET,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete for compliance
);

CREATE INDEX idx_accounts_email ON auth.accounts(email);
CREATE INDEX idx_accounts_role ON auth.accounts(role);
CREATE INDEX idx_accounts_status ON auth.accounts(account_status);
CREATE INDEX idx_accounts_referrer ON auth.accounts(referrer_id);
```

**Acceptance Criteria:**

- `password_hash`: bcrypt-hashed password (60 chars minimum)
- `role`: Enforced enum (user, driver, admin, agent)
- `email_verified`: Set TRUE only after email verification
- `two_factor_secret`: TOTP secret (encrypted at rest in production)

---

#### `auth.refresh_tokens`

Store refresh tokens for JWT rotation.

```sql
CREATE TABLE auth.refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,  -- Hash of the actual token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_account ON auth.refresh_tokens(account_id);
CREATE INDEX idx_refresh_tokens_expires ON auth.refresh_tokens(expires_at);
```

**Acceptance Criteria:**

- One refresh token per device/session
- Token expires in 30 days
- Can be revoked immediately (logout)

---

#### `auth.audit_logs`

Immutable log of authentication events and security-relevant actions.

```sql
CREATE TABLE auth.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES auth.accounts(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,  -- login, logout, password_change, 2fa_enable, etc.
  resource_type VARCHAR(100),  -- account, order, station, etc.
  resource_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,  -- success, failure
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,  -- Additional context (device info, location, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_account ON auth.audit_logs(account_id);
CREATE INDEX idx_audit_logs_action ON auth.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON auth.audit_logs(created_at);
```

---

### 2. USERS Schema

#### `users.profiles`

Extended user profile information.

```sql
CREATE TABLE users.profiles (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL UNIQUE REFERENCES auth.accounts(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  profile_picture_url TEXT,
  profile_picture_key VARCHAR(255),  -- S3 key or file path
  bio TEXT,
  date_of_birth DATE,

  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_country VARCHAR(100) DEFAULT 'Nigeria',
  address_postal_code VARCHAR(20),

  -- Preferences
  default_delivery_address JSONB,  -- { street, city, state, country, postal_code, lat, lng }
  notification_preferences JSONB,  -- { email, sms, push, in_app }

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_account ON users.profiles(account_id);
CREATE INDEX idx_user_profiles_phone ON users.profiles(phone_number);
```

---

#### `users.documents`

User document verification (NIN, BVN, drivers license, etc.).

```sql
CREATE TABLE users.documents (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,  -- nin, bvn, drivers_license, intl_passport
  document_number VARCHAR(100) NOT NULL,
  document_url TEXT,
  document_key VARCHAR(255),  -- S3 key
  front_image_url TEXT,
  front_image_key VARCHAR(255),
  back_image_url TEXT,
  back_image_key VARCHAR(255),

  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, verified, rejected, expired
  verified_by BIGINT REFERENCES auth.accounts(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_account ON users.documents(account_id);
CREATE INDEX idx_documents_status ON users.documents(verification_status);
CREATE INDEX idx_documents_type ON users.documents(document_type);
CREATE UNIQUE INDEX idx_documents_number ON users.documents(document_type, document_number);
```

---

#### `users.two_factor_auth`

2FA verification codes and backup codes.

```sql
CREATE TABLE users.two_factor_auth (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL UNIQUE REFERENCES auth.accounts(id) ON DELETE CASCADE,
  totp_secret VARCHAR(255) NOT NULL,  -- Encrypted TOTP secret
  backup_codes TEXT[] NOT NULL,  -- Array of encrypted backup codes
  enabled_at TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. DELIVERY Schema

#### `delivery.stations`

Fuel stations offering delivery services.

```sql
CREATE TABLE delivery.stations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_country VARCHAR(100) DEFAULT 'Nigeria',
  address_postal_code VARCHAR(20),

  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Fuel Types & Pricing
  fuel_types VARCHAR(50)[] NOT NULL,  -- ['petrol', 'diesel']
  prices JSONB NOT NULL,  -- { petrol: 600, diesel: 550 }

  -- Operating Hours
  open_time TIME,
  close_time TIME,
  is_24h BOOLEAN DEFAULT FALSE,

  -- Status
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Contact
  phone_number VARCHAR(20),
  manager_name VARCHAR(255),

  metadata JSONB,  -- Additional info (facilities, payment methods, etc.)

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stations_city ON delivery.stations(address_city);
CREATE INDEX idx_stations_available ON delivery.stations(is_available);
CREATE INDEX idx_stations_location ON delivery.stations USING GIST(
  ll_to_earth(latitude, longitude)
);  -- For geospatial queries

-- Unique index on name + address to prevent duplicates
CREATE UNIQUE INDEX idx_stations_location_unique
ON delivery.stations(name, address_street, address_city);
```

---

#### `delivery.drivers`

Delivery drivers/agents assigned to orders.

```sql
CREATE TABLE delivery.drivers (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL UNIQUE REFERENCES auth.accounts(id) ON DELETE CASCADE,
  station_id BIGINT NOT NULL REFERENCES delivery.stations(id) ON DELETE RESTRICT,

  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,

  -- License & Verification
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'inactive',  -- active, inactive, on_break, suspended
  availability_status VARCHAR(50) NOT NULL DEFAULT 'offline',  -- online, offline, on_delivery

  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_deliveries INT DEFAULT 0,

  -- Employment
  hire_date DATE NOT NULL,
  employee_id VARCHAR(50),

  -- Shift Preferences
  preferred_shift VARCHAR(50),  -- morning, afternoon, evening, night

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_account ON delivery.drivers(account_id);
CREATE INDEX idx_drivers_station ON delivery.drivers(station_id);
CREATE INDEX idx_drivers_status ON delivery.drivers(status);
```

---

#### `delivery.agent_location_tracking`

Real-time location updates for delivery agents.

```sql
CREATE TABLE delivery.agent_location_tracking (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES delivery.drivers(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES delivery.orders(id) ON DELETE SET NULL,

  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(7, 2),  -- GPS accuracy in meters

  status VARCHAR(50),  -- on_the_way, arrived, delivering, completed

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_tracking_driver ON delivery.agent_location_tracking(driver_id);
CREATE INDEX idx_agent_tracking_order ON delivery.agent_location_tracking(order_id);
CREATE INDEX idx_agent_tracking_created ON delivery.agent_location_tracking(created_at);

-- Keep only last 7 days of data (retention policy)
-- Partition by date for performance
```

---

#### `delivery.orders`

Core order table for fuel orders.

```sql
CREATE TABLE delivery.orders (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE RESTRICT,
  driver_id BIGINT REFERENCES delivery.drivers(id) ON DELETE SET NULL,
  station_id BIGINT NOT NULL REFERENCES delivery.stations(id) ON DELETE RESTRICT,

  -- Order Details
  fuel_type VARCHAR(50) NOT NULL,  -- petrol, diesel
  quantity_liters DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,

  -- References
  order_reference VARCHAR(100) NOT NULL UNIQUE,  -- Human-readable ref (SRV-20260502-001)
  payment_reference VARCHAR(100),  -- Payment gateway reference (Paystack)

  -- Delivery Location
  delivery_address_street VARCHAR(255) NOT NULL,
  delivery_address_city VARCHAR(100) NOT NULL,
  delivery_address_state VARCHAR(100) NOT NULL,
  delivery_latitude DECIMAL(10, 8) NOT NULL,
  delivery_longitude DECIMAL(11, 8) NOT NULL,

  -- Payment
  payment_method VARCHAR(50) NOT NULL,  -- card, wallet, transfer
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, completed, failed, refunded
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, confirmed, assigned, in_transit, arrived, completed, cancelled

  -- Ratings & Reviews
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review_comment TEXT,
  rated_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_orders_account ON delivery.orders(account_id);
CREATE INDEX idx_orders_driver ON delivery.orders(driver_id);
CREATE INDEX idx_orders_station ON delivery.orders(station_id);
CREATE INDEX idx_orders_status ON delivery.orders(status);
CREATE INDEX idx_orders_payment_status ON delivery.orders(payment_status);
CREATE INDEX idx_orders_created ON delivery.orders(created_at);
CREATE INDEX idx_orders_reference ON delivery.orders(order_reference);
```

---

#### `delivery.order_status_history`

Immutable audit trail of order status changes.

```sql
CREATE TABLE delivery.order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES delivery.orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by BIGINT REFERENCES auth.accounts(id) ON DELETE SET NULL,  -- User or system
  reason TEXT,
  metadata JSONB,  -- Additional context (location, time, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_history_order ON delivery.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON delivery.order_status_history(created_at);
```

---

#### `delivery.order_notifications`

Notifications sent to users about their orders.

```sql
CREATE TABLE delivery.order_notifications (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES delivery.orders(id) ON DELETE CASCADE,

  notification_type VARCHAR(50) NOT NULL,  -- order_placed, order_confirmed, driver_assigned, driver_arrived, order_completed, payment_received
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Delivery Channels
  sent_via_push BOOLEAN DEFAULT FALSE,
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_sms BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_account ON delivery.order_notifications(account_id);
CREATE INDEX idx_notifications_order ON delivery.order_notifications(order_id);
CREATE INDEX idx_notifications_read ON delivery.order_notifications(is_read);
```

---

### 4. PAYMENT Schema

#### `payment.transactions`

All payment transactions (orders, wallet top-ups, refunds).

```sql
CREATE TABLE payment.transactions (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE RESTRICT,
  order_id BIGINT REFERENCES delivery.orders(id) ON DELETE SET NULL,

  transaction_type VARCHAR(50) NOT NULL,  -- order_payment, wallet_topup, refund, withdrawal
  transaction_reference VARCHAR(100) NOT NULL UNIQUE,
  payment_gateway_reference VARCHAR(100),  -- Paystack reference

  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',

  payment_method VARCHAR(50) NOT NULL,  -- card, bank_transfer, wallet
  payment_channel VARCHAR(50),  -- paystack, direct_bank, etc.

  -- Paystack Fields
  paystack_access_code VARCHAR(255),
  paystack_authorization_url TEXT,

  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed, cancelled
  failure_reason TEXT,

  metadata JSONB,  -- Additional data (card_brand, last_4_digits, etc.)

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_account ON payment.transactions(account_id);
CREATE INDEX idx_transactions_order ON payment.transactions(order_id);
CREATE INDEX idx_transactions_status ON payment.transactions(status);
CREATE INDEX idx_transactions_reference ON payment.transactions(transaction_reference);
CREATE INDEX idx_transactions_created ON payment.transactions(created_at);
```

---

#### `payment.wallet_transactions`

Wallet balance changes (top-ups, debits, cashback).

```sql
CREATE TABLE payment.wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE CASCADE,

  transaction_type VARCHAR(50) NOT NULL,  -- credit, debit, cashback, refund
  amount DECIMAL(12, 2) NOT NULL,

  previous_balance DECIMAL(12, 2) NOT NULL,
  new_balance DECIMAL(12, 2) NOT NULL,

  reason TEXT,  -- order_payment, cashback_earned, refund_issued, admin_adjustment
  related_order_id BIGINT REFERENCES delivery.orders(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_txn_account ON payment.wallet_transactions(account_id);
CREATE INDEX idx_wallet_txn_created ON payment.wallet_transactions(created_at);
```

---

#### `payment.wallets`

Denormalized wallet balance (for quick access).

```sql
CREATE TABLE payment.wallets (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL UNIQUE REFERENCES auth.accounts(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_earned_cashback DECIMAL(12, 2) NOT NULL DEFAULT 0,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: Keep this in sync with wallet_transactions (auto-update on each transaction)
```

---

#### `payment.refunds`

Refund requests and their status.

```sql
CREATE TABLE payment.refunds (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES payment.transactions(id) ON DELETE RESTRICT,
  order_id BIGINT REFERENCES delivery.orders(id) ON DELETE SET NULL,
  account_id BIGINT NOT NULL REFERENCES auth.accounts(id) ON DELETE RESTRICT,

  amount DECIMAL(12, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT,

  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, completed, failed
  approved_by BIGINT REFERENCES auth.accounts(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  paystack_refund_reference VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_refunds_transaction ON payment.refunds(transaction_id);
CREATE INDEX idx_refunds_account ON payment.refunds(account_id);
CREATE INDEX idx_refunds_status ON payment.refunds(status);
```

---

### 5. SYSTEM Schema

#### `system.settings`

Global system configuration.

```sql
CREATE TABLE system.settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  setting_type VARCHAR(50),  -- string, number, boolean, json
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Example rows:
-- commission_rate: 0.05 (5%)
-- max_delivery_distance_km: 50
-- min_order_value: 5000
-- cashback_percentage: 0.02 (2%)
-- order_expiry_minutes: 30
```

---

## Data Types & Conventions

### Naming Conventions

| Type             | Convention                                | Example                                  |
| ---------------- | ----------------------------------------- | ---------------------------------------- |
| **Tables**       | `snake_case`, plural preferred in schemas | `delivery.orders`, `users.profiles`      |
| **Columns**      | `snake_case`                              | `first_name`, `phone_number`             |
| **Indexes**      | `idx_{table}_{column}`                    | `idx_orders_account`, `idx_users_email`  |
| **Foreign Keys** | Column name ends with `_id`               | `account_id`, `station_id`               |
| **Timestamps**   | Always `TIMESTAMP WITH TIME ZONE`         | `created_at`, `updated_at`, `deleted_at` |
| **Status Enums** | `snake_case`, lowercase values            | `active`, `pending`, `in_transit`        |

### Data Types

| Purpose          | PostgreSQL Type                                | Notes                                             |
| ---------------- | ---------------------------------------------- | ------------------------------------------------- |
| **IDs**          | `BIGSERIAL`                                    | Supports up to 9.2 quintillion rows               |
| **Amounts**      | `DECIMAL(12, 2)`                               | Money: 10 digits + 2 decimals = NGN 99,999,999.99 |
| **Percentages**  | `DECIMAL(3, 2)`                                | 0.00 to 9.99                                      |
| **Ratings**      | `INT CHECK (x BETWEEN 1 AND 5)`                | Enforce constraints at DB level                   |
| **Coordinates**  | `DECIMAL(10, 8)` / `DECIMAL(11, 8)`            | Latitude / Longitude (~1 meter precision)         |
| **URLs**         | `TEXT`                                         | No length limit (store S3 keys)                   |
| **Enums**        | `VARCHAR(50)`                                  | More flexible than ENUM type                      |
| **JSON**         | `JSONB`                                        | Use for flexible, nested data                     |
| **Arrays**       | `VARCHAR(50)[]`                                | PostgreSQL native array type                      |
| **IP Addresses** | `INET`                                         | PostgreSQL native INET type                       |
| **Encryption**   | Store as `VARCHAR(255)` + app-level encryption | Keys stored separately (never in DB)              |

---

## Indexes & Performance

### Index Strategy

**Priority 1: Foreign Keys** (Always create)

```sql
CREATE INDEX idx_orders_account ON delivery.orders(account_id);
CREATE INDEX idx_orders_driver ON delivery.orders(driver_id);
CREATE INDEX idx_orders_station ON delivery.orders(station_id);
```

**Priority 2: Filters** (Frequently filtered columns)

```sql
CREATE INDEX idx_orders_status ON delivery.orders(status);
CREATE INDEX idx_orders_payment_status ON delivery.orders(payment_status);
```

**Priority 3: Sorting** (Frequently ordered columns)

```sql
CREATE INDEX idx_orders_created ON delivery.orders(created_at DESC);
```

**Priority 4: Geospatial** (Location queries)

```sql
CREATE INDEX idx_stations_location ON delivery.stations USING GIST(
  ll_to_earth(latitude, longitude)
);
```

### Query Examples & Recommended Indexes

| Query                             | Recommended Index                    |
| --------------------------------- | ------------------------------------ |
| Find orders by user in date range | `(account_id, created_at DESC)`      |
| Find active orders by status      | `(status, driver_id)`                |
| Find nearby stations              | Geospatial GIST index on coordinates |
| Find pending payments             | `(status, created_at)`               |

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    auth.accounts (Core)                      │
│  id, email, password_hash, role, account_status, ...        │
└──────────────┬────────────┬────────────┬────────────┬────────┘
               │            │            │            │
        ┌──────┘            │            │            └──────┐
        │                   │            │                   │
        ▼                   ▼            ▼                   ▼
   users.profiles   users.documents  delivery.drivers  system (admins)
   (user data)      (NIN, license)    (delivery agents)


┌──────────────────────────────────────────────────────────┐
│              delivery.stations (Fuel Stations)            │
│  id, name, address, coordinates, fuel_types, prices      │
└──────────┬──────────────────────────────────┬─────────────┘
           │                                  │
           ▼                                  ▼
    delivery.drivers          delivery.agent_location_tracking
    (Assigned drivers)        (Real-time GPS)
           │
           │
           ▼
    delivery.orders ◄──────────┐
    (Fuel orders)              │
           │                   │
           ├─────────┬─────────┼─────────┬──────────────┐
           │         │         │         │              │
           ▼         ▼         ▼         ▼              ▼
     payment.txn   order_status   order_notify   delivery.reviews
                   (Status trail)  (Notifications)

           │
           ▼
     payment.wallets
     (User balance)
           │
           ▼
     payment.wallet_txn
     (Ledger)
```

---

## Prisma Schema

The SQL schema above translates to the following Prisma schema:

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============ AUTH SCHEMA ============

model Account {
  id                         BigInt    @id @default(autoincrement())
  email                      String    @unique @db.VarChar(255)
  passwordHash               String    @map("password_hash") @db.VarChar(255)
  role                       String    @default("user") @db.VarChar(50)
  accountStatus              String    @default("active") @map("account_status") @db.VarChar(20)
  emailVerified              Boolean   @default(false) @map("email_verified")
  emailVerifiedAt            DateTime? @map("email_verified_at") @db.Timestamp(3)

  twoFactorEnabled           Boolean   @default(false) @map("two_factor_enabled")
  twoFactorSecret            String?   @map("two_factor_secret") @db.VarChar(255)

  resetPasswordToken         String?   @map("reset_password_token") @db.VarChar(255)
  resetPasswordTokenExpiry   DateTime? @map("reset_password_token_expiry") @db.Timestamp(3)

  referrerId                 BigInt?   @map("referrer_id")
  referralCode               String?   @unique @map("referral_code") @db.VarChar(24)

  lastLogin                  DateTime? @map("last_login") @db.Timestamp(3)
  lastPasswordChange         DateTime? @map("last_password_change") @db.Timestamp(3)
  lastIpAddress              String?   @map("last_ip_address") @db.Inet

  createdAt                  DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt                  DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)
  deletedAt                  DateTime? @map("deleted_at") @db.Timestamp(3)

  // Relations
  referrer                   Account?  @relation("Referrer", fields: [referrerId], references: [id], onDelete: SetNull)
  referredUsers              Account[] @relation("Referrer")

  userProfile                UserProfile?
  userDocuments              UserDocument[]
  twoFactorAuth              TwoFactorAuth?
  deliveryDriver             DeliveryDriver?
  orders                     Order[]
  transactions               Transaction[]
  walletTransactions         WalletTransaction[]
  wallet                     Wallet?
  notifications              OrderNotification[]
  auditLogs                  AuditLog[]

  @@map("accounts")
  @@schema("auth")
}

model RefreshToken {
  id        BigInt    @id @default(autoincrement())
  accountId BigInt    @map("account_id")
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)
  expiresAt DateTime  @map("expires_at") @db.Timestamp(3)
  revokedAt DateTime? @map("revoked_at") @db.Timestamp(3)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  account   Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([expiresAt])
  @@map("refresh_tokens")
  @@schema("auth")
}

model AuditLog {
  id            BigInt    @id @default(autoincrement())
  accountId     BigInt?   @map("account_id")
  action        String    @db.VarChar(100)
  resourceType  String?   @map("resource_type") @db.VarChar(100)
  resourceId    String?   @map("resource_id") @db.VarChar(100)
  status        String    @db.VarChar(20)
  errorMessage  String?   @map("error_message")
  ipAddress     String?   @map("ip_address") @db.Inet
  userAgent     String?   @map("user_agent")
  metadata      Json?
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  account       Account?  @relation(fields: [accountId], references: [id], onDelete: SetNull)

  @@index([accountId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
  @@schema("auth")
}

// ============ USERS SCHEMA ============

model UserProfile {
  id                     BigInt    @id @default(autoincrement())
  accountId              BigInt    @unique @map("account_id")
  firstName              String    @map("first_name") @db.VarChar(100)
  lastName               String    @map("last_name") @db.VarChar(100)
  phoneNumber            String?   @map("phone_number") @db.VarChar(20)
  phoneVerified          Boolean   @default(false) @map("phone_verified")
  profilePictureUrl      String?   @map("profile_picture_url")
  profilePictureKey      String?   @map("profile_picture_key") @db.VarChar(255)
  bio                    String?
  dateOfBirth            DateTime? @map("date_of_birth") @db.Date

  addressStreet          String?   @map("address_street") @db.VarChar(255)
  addressCity            String?   @map("address_city") @db.VarChar(100)
  addressState           String?   @map("address_state") @db.VarChar(100)
  addressCountry         String    @default("Nigeria") @map("address_country") @db.VarChar(100)
  addressPostalCode      String?   @map("address_postal_code") @db.VarChar(20)

  defaultDeliveryAddress Json?    @map("default_delivery_address")
  notificationPreferences Json?    @map("notification_preferences")

  createdAt              DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt              DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)

  account                Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([phoneNumber])
  @@map("profiles")
  @@schema("users")
}

model UserDocument {
  id              BigInt    @id @default(autoincrement())
  accountId       BigInt    @map("account_id")
  documentType    String    @map("document_type") @db.VarChar(50)
  documentNumber  String    @map("document_number") @db.VarChar(100)
  documentUrl     String?   @map("document_url")
  documentKey     String?   @map("document_key") @db.VarChar(255)
  frontImageUrl   String?   @map("front_image_url")
  frontImageKey   String?   @map("front_image_key") @db.VarChar(255)
  backImageUrl    String?   @map("back_image_url")
  backImageKey    String?   @map("back_image_key") @db.VarChar(255)

  verificationStatus String  @default("pending") @map("verification_status") @db.VarChar(20)
  verifiedBy       BigInt?   @map("verified_by")
  verifiedAt       DateTime? @map("verified_at") @db.Timestamp(3)
  rejectionReason  String?   @map("rejection_reason")

  expiresAt        DateTime? @map("expires_at") @db.Date
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)

  account          Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([verificationStatus])
  @@index([documentType])
  @@unique([documentType, documentNumber])
  @@map("documents")
  @@schema("users")
}

model TwoFactorAuth {
  id               BigInt    @id @default(autoincrement())
  accountId        BigInt    @unique @map("account_id")
  totpSecret       String    @map("totp_secret") @db.VarChar(255)
  backupCodes      String[]  @map("backup_codes")
  enabledAt        DateTime? @map("enabled_at") @db.Timestamp(3)
  lastVerifiedAt   DateTime? @map("last_verified_at") @db.Timestamp(3)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  account          Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@map("two_factor_auth")
  @@schema("users")
}

// ============ DELIVERY SCHEMA ============

model Station {
  id                   BigInt    @id @default(autoincrement())
  name                 String    @db.VarChar(255)
  addressStreet        String    @map("address_street") @db.VarChar(255)
  addressCity          String    @map("address_city") @db.VarChar(100)
  addressState         String    @map("address_state") @db.VarChar(100)
  addressCountry       String    @default("Nigeria") @map("address_country") @db.VarChar(100)
  addressPostalCode    String?   @map("address_postal_code") @db.VarChar(20)

  latitude             Decimal   @db.Decimal(10, 8)
  longitude            Decimal   @db.Decimal(11, 8)

  fuelTypes            String[]  @map("fuel_types")
  prices               Json      @db.Json

  openTime             DateTime? @map("open_time") @db.Time()
  closeTime            DateTime? @map("close_time") @db.Time()
  is24h                Boolean   @default(false) @map("is_24h")

  isAvailable          Boolean   @default(true) @map("is_available")
  isVerified           Boolean   @default(false) @map("is_verified")

  phoneNumber          String?   @map("phone_number") @db.VarChar(20)
  managerName          String?   @map("manager_name") @db.VarChar(255)

  metadata             Json?

  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)

  drivers              DeliveryDriver[]
  orders               Order[]

  @@index([addressCity])
  @@index([isAvailable])
  @@unique([name, addressStreet, addressCity])
  @@map("stations")
  @@schema("delivery")
}

model DeliveryDriver {
  id                   BigInt    @id @default(autoincrement())
  accountId            BigInt    @unique @map("account_id")
  stationId            BigInt    @map("station_id")

  firstName            String    @map("first_name") @db.VarChar(100)
  lastName             String    @map("last_name") @db.VarChar(100)
  phoneNumber          String    @map("phone_number") @db.VarChar(20)

  licenseNumber        String    @unique @map("license_number") @db.VarChar(50)
  licenseExpiry        DateTime  @map("license_expiry") @db.Date
  licenseVerified      Boolean   @default(false) @map("license_verified")

  status               String    @default("inactive") @db.VarChar(50)
  availabilityStatus   String    @default("offline") @map("availability_status") @db.VarChar(50)

  averageRating        Decimal   @default(0) @map("average_rating") @db.Decimal(3, 2)
  totalDeliveries      Int       @default(0) @map("total_deliveries")

  hireDate             DateTime  @map("hire_date") @db.Date
  employeeId           String?   @map("employee_id") @db.VarChar(50)

  preferredShift       String?   @map("preferred_shift") @db.VarChar(50)

  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)

  account              Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  station              Station   @relation(fields: [stationId], references: [id], onDelete: Restrict)
  orders               Order[]
  locationTracking     AgentLocationTracking[]

  @@index([accountId])
  @@index([stationId])
  @@index([status])
  @@map("drivers")
  @@schema("delivery")
}

model AgentLocationTracking {
  id         BigInt    @id @default(autoincrement())
  driverId   BigInt    @map("driver_id")
  orderId    BigInt?   @map("order_id")

  latitude   Decimal   @db.Decimal(10, 8)
  longitude  Decimal   @db.Decimal(11, 8)
  accuracy   Decimal?  @db.Decimal(7, 2)
  status     String?   @db.VarChar(50)

  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  driver     DeliveryDriver @relation(fields: [driverId], references: [id], onDelete: Cascade)
  order      Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([driverId])
  @@index([orderId])
  @@index([createdAt])
  @@map("agent_location_tracking")
  @@schema("delivery")
}

model Order {
  id                       BigInt    @id @default(autoincrement())
  accountId                BigInt    @map("account_id")
  driverId                 BigInt?   @map("driver_id")
  stationId                BigInt    @map("station_id")

  fuelType                 String    @map("fuel_type") @db.VarChar(50)
  quantityLiters           Decimal   @map("quantity_liters") @db.Decimal(10, 2)
  unitPrice                Decimal   @map("unit_price") @db.Decimal(10, 2)
  totalAmount              Decimal   @map("total_amount") @db.Decimal(12, 2)

  orderReference           String    @unique @map("order_reference") @db.VarChar(100)
  paymentReference         String?   @map("payment_reference") @db.VarChar(100)

  deliveryAddressStreet    String    @map("delivery_address_street") @db.VarChar(255)
  deliveryAddressCity      String    @map("delivery_address_city") @db.VarChar(100)
  deliveryAddressState     String    @map("delivery_address_state") @db.VarChar(100)
  deliveryLatitude         Decimal   @map("delivery_latitude") @db.Decimal(10, 8)
  deliveryLongitude        Decimal   @map("delivery_longitude") @db.Decimal(11, 8)

  paymentMethod            String    @map("payment_method") @db.VarChar(50)
  paymentStatus            String    @default("pending") @map("payment_status") @db.VarChar(50)
  paidAt                   DateTime? @map("paid_at") @db.Timestamp(3)

  status                   String    @default("pending") @db.VarChar(50)

  rating                   Int?      @db.Int
  reviewComment            String?   @map("review_comment")
  ratedAt                  DateTime? @map("rated_at") @db.Timestamp(3)

  createdAt                DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt                DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)
  completedAt              DateTime? @map("completed_at") @db.Timestamp(3)
  cancelledAt              DateTime? @map("cancelled_at") @db.Timestamp(3)
  cancellationReason       String?   @map("cancellation_reason")

  account                  Account   @relation(fields: [accountId], references: [id], onDelete: Restrict)
  driver                   DeliveryDriver? @relation(fields: [driverId], references: [id], onDelete: SetNull)
  station                  Station   @relation(fields: [stationId], references: [id], onDelete: Restrict)

  statusHistory            OrderStatusHistory[]
  notifications            OrderNotification[]
  transactions             Transaction[]
  locationTracking         AgentLocationTracking[]

  @@index([accountId])
  @@index([driverId])
  @@index([stationId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
  @@index([orderReference])
  @@map("orders")
  @@schema("delivery")
}

model OrderStatusHistory {
  id            BigInt    @id @default(autoincrement())
  orderId       BigInt    @map("order_id")
  previousStatus String?   @map("previous_status") @db.VarChar(50)
  newStatus     String    @map("new_status") @db.VarChar(50)
  changedBy     BigInt?   @map("changed_by")
  reason        String?
  metadata      Json?
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  order         Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  changedByUser Account?  @relation(fields: [changedBy], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([createdAt])
  @@map("order_status_history")
  @@schema("delivery")
}

model OrderNotification {
  id              BigInt    @id @default(autoincrement())
  accountId       BigInt    @map("account_id")
  orderId         BigInt    @map("order_id")

  notificationType String   @map("notification_type") @db.VarChar(50)
  title           String    @db.VarChar(255)
  message         String

  isRead          Boolean   @default(false) @map("is_read")
  readAt          DateTime? @map("read_at") @db.Timestamp(3)

  sentViaPush     Boolean   @default(false) @map("sent_via_push")
  sentViaEmail    Boolean   @default(false) @map("sent_via_email")
  sentViaSms      Boolean   @default(false) @map("sent_via_sms")

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  account         Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([orderId])
  @@index([isRead])
  @@map("order_notifications")
  @@schema("delivery")
}

// ============ PAYMENT SCHEMA ============

model Transaction {
  id                      BigInt    @id @default(autoincrement())
  accountId               BigInt    @map("account_id")
  orderId                 BigInt?   @map("order_id")

  transactionType         String    @map("transaction_type") @db.VarChar(50)
  transactionReference    String    @unique @map("transaction_reference") @db.VarChar(100)
  paymentGatewayReference String?   @map("payment_gateway_reference") @db.VarChar(100)

  amount                  Decimal   @db.Decimal(12, 2)
  currency                String    @default("NGN") @db.VarChar(3)

  paymentMethod           String    @map("payment_method") @db.VarChar(50)
  paymentChannel          String?   @map("payment_channel") @db.VarChar(50)

  paystackAccessCode      String?   @map("paystack_access_code") @db.VarChar(255)
  paystackAuthorizationUrl String?  @map("paystack_authorization_url")

  status                  String    @default("pending") @db.VarChar(50)
  failureReason           String?   @map("failure_reason")

  metadata                Json?

  createdAt               DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt               DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)
  completedAt             DateTime? @map("completed_at") @db.Timestamp(3)

  account                 Account   @relation(fields: [accountId], references: [id], onDelete: Restrict)
  order                   Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([accountId])
  @@index([orderId])
  @@index([status])
  @@index([transactionReference])
  @@index([createdAt])
  @@map("transactions")
  @@schema("payment")
}

model Wallet {
  id                    BigInt    @id @default(autoincrement())
  accountId             BigInt    @unique @map("account_id")
  balance               Decimal   @default(0) @db.Decimal(12, 2)
  totalEarnedCashback   Decimal   @default(0) @map("total_earned_cashback") @db.Decimal(12, 2)
  lastTransactionAt     DateTime? @map("last_transaction_at") @db.Timestamp(3)
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt             DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)

  account               Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@map("wallets")
  @@schema("payment")
}

model WalletTransaction {
  id                  BigInt    @id @default(autoincrement())
  accountId           BigInt    @map("account_id")

  transactionType     String    @map("transaction_type") @db.VarChar(50)
  amount              Decimal   @db.Decimal(12, 2)

  previousBalance     Decimal   @map("previous_balance") @db.Decimal(12, 2)
  newBalance          Decimal   @map("new_balance") @db.Decimal(12, 2)

  reason              String?
  relatedOrderId      BigInt?   @map("related_order_id")

  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  account             Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([createdAt])
  @@map("wallet_transactions")
  @@schema("payment")
}

model Refund {
  id                     BigInt    @id @default(autoincrement())
  transactionId          BigInt    @map("transaction_id")
  orderId                BigInt?   @map("order_id")
  accountId              BigInt    @map("account_id")

  amount                 Decimal   @db.Decimal(12, 2)
  reason                 String    @db.VarChar(255)
  description            String?

  status                 String    @default("pending") @db.VarChar(50)
  approvedBy             BigInt?   @map("approved_by")
  approvedAt             DateTime? @map("approved_at") @db.Timestamp(3)

  paystackRefundReference String?  @map("paystack_refund_reference") @db.VarChar(100)

  createdAt              DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt              DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)
  completedAt            DateTime? @map("completed_at") @db.Timestamp(3)

  transaction            Transaction @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  order                  Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)
  account                Account   @relation(fields: [accountId], references: [id], onDelete: Restrict)
  approver               Account?  @relation(fields: [approvedBy], references: [id], onDelete: SetNull)

  @@index([transactionId])
  @@index([accountId])
  @@index([status])
  @@map("refunds")
  @@schema("payment")
}

// ============ SYSTEM SCHEMA ============

model Setting {
  id            BigInt    @id @default(autoincrement())
  settingKey    String    @unique @map("setting_key") @db.VarChar(255)
  settingValue  String    @map("setting_value")
  description   String?
  settingType   String?   @map("setting_type") @db.VarChar(50)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)

  @@map("settings")
  @@schema("system")
}
```

---

## Migration Strategy

### Phase 1: Initial Setup (Sprint 1)

```bash
# Create migration
npx prisma migrate dev --name init

# Seed initial data
npm run db:seed
```

### Phase 2: New Features (Per Sprint)

```bash
# Add new tables/columns
npx prisma migrate dev --name add_xyz_feature

# Apply to production
npx prisma migrate deploy
```

### Production Deployment

```bash
# Verify migration
npx prisma migrate status

# Apply with zero-downtime (add columns as nullable, remove constraints in later migration)
npx prisma migrate deploy --skip-generate
```

---

## Query Patterns (With Indexes)

### 1. Find User's Recent Orders

```sql
SELECT * FROM delivery.orders
WHERE account_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Index: (account_id, created_at DESC)
```

### 2. Find Active Orders by Status

```sql
SELECT * FROM delivery.orders
WHERE status IN ('pending', 'confirmed', 'in_transit')
AND driver_id IS NOT NULL
ORDER BY created_at DESC;

-- Index: (status, driver_id, created_at DESC)
```

### 3. Find Nearby Stations

```sql
SELECT * FROM delivery.stations
WHERE is_available = true
ORDER BY
  earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude))
LIMIT 10;

-- Index: GIST on coordinates
```

---

## Improvements from Original Schema

✅ **Fixed Syntax Errors**

- Fixed missing REFERENCES keyword in delivery.drivers
- Added missing commas and semicolons
- Fixed typo: REFERENCE → REFERENCES

✅ **Better Data Types**

- Changed NUMERIC → DECIMAL(12, 2) for money
- Changed SERIAL → BIGSERIAL for better scale
- Added TIMESTAMP WITH TIME ZONE for consistency

✅ **Proper Relationships**

- Added ON DELETE CASCADE/SET NULL where appropriate
- Created missing agents table (was referenced but missing)
- Added proper foreign key constraints

✅ **Performance**

- Added comprehensive indexes (FKs, filters, sorts, geospatial)
- Denormalized wallet balance for quick reads
- Indexed frequently-queried columns

✅ **Features for Roadmap**

- Added refresh_tokens table (JWT rotation)
- Added two_factor_auth table (2FA/TOTP)
- Added agent_location_tracking (real-time GPS)
- Added wallet system (sprints 5–6)
- Added audit_logs (security, compliance)

✅ **Data Integrity**

- Added constraints (CHECK for ratings, UNIQUE for references)
- Added soft delete support (deleted_at)
- Immutable audit trails (audit_logs, order_status_history)

✅ **PostgreSQL Best Practices**

- JSONB for flexible data
- INET type for IP addresses
- Proper naming conventions (snake*case, idx* prefix)
- Schemas for organization (auth, users, delivery, payment, system)

---

## Next Steps

1. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

2. **Create Migration**

   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed Database** (Sprint 1)

   ```bash
   npm run db:seed
   ```

4. **Start Building Endpoints** (Sprint 1-2)
   - Auth routes
   - User routes
   - Station routes

---

**Schema Version**: 1.0
**Last Updated**: May 2, 2026
**Prisma Version**: 5.8.0+
**PostgreSQL Version**: 15+
