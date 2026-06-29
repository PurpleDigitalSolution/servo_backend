// This is your Prisma schema file.
// Learn more about it in the docs: https://pris.ly/d/prisma-schema
// All @map directives removed for fresh database creation

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============

enum UserRole {
  USER
  DRIVER
  ADMIN
  AGENT
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
  EXPIRED
}

enum DocumentType {
  NIN
  BVN
  DRIVERS_LICENSE
  INTL_PASSPORT
}

enum DeliveryDriverStatus {
  ACTIVE
  INACTIVE
  ON_BREAK
  SUSPENDED
}

enum AvailabilityStatus {
  ONLINE
  OFFLINE
  ON_DELIVERY
}

enum OrderStatus {
  PENDING
  CONFIRMED
  ASSIGNED
  IN_TRANSIT
  ARRIVED
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CARD
  WALLET
  TRANSFER
}

enum TransactionType {
  ORDER_PAYMENT
  WALLET_TOPUP
  REFUND
  WITHDRAWAL
}

enum WalletTransactionType {
  CREDIT
  DEBIT
  CASHBACK
  REFUND
}

enum RefundStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
  FAILED
}

enum NotificationType {
  ORDER_PLACED
  ORDER_CONFIRMED
  DRIVER_ASSIGNED
  DRIVER_ARRIVED
  ORDER_COMPLETED
  PAYMENT_RECEIVED
}

enum FuelType {
  PETROL
  DIESEL
}

// ============ AUTH SCHEMA ============

model Account {
  id                      BigInt    @id @default(autoincrement())
  email                   String    @unique @db.VarChar(255)
  passwordHash            String    @db.VarChar(255)
  role                    UserRole  @default(USER)
  accountStatus           AccountStatus @default(ACTIVE)
  emailVerified           Boolean   @default(false)
  emailVerifiedAt         DateTime? @db.Timestamp(3)

  twoFactorEnabled        Boolean   @default(false)
  twoFactorSecret         String?   @db.VarChar(255)

  resetPasswordToken      String?   @db.VarChar(255)
  resetPasswordTokenExpiry DateTime? @db.Timestamp(3)

  referrerId              BigInt?
  referralCode            String?   @unique @db.VarChar(24)

  lastLogin               DateTime? @db.Timestamp(3)
  lastPasswordChange      DateTime? @db.Timestamp(3)
  lastIpAddress           String?   @db.Inet

  createdAt               DateTime  @default(now()) @db.Timestamp(3)
  updatedAt               DateTime  @updatedAt @db.Timestamp(3)
  deletedAt               DateTime? @db.Timestamp(3)

  // Relations
  referrer                Account?  @relation("Referrer", fields: [referrerId], references: [id], onDelete: SetNull)
  referredUsers           Account[] @relation("Referrer")

  userProfile             UserProfile?
  userDocuments           UserDocument[]
  twoFactorAuth           TwoFactorAuth?
  deliveryDriver          DeliveryDriver?
  orders                  Order[]
  transactions            Transaction[]
  walletTransactions      WalletTransaction[]
  wallet                  Wallet?
  notifications           OrderNotification[]
  auditLogs               AuditLog[]
  orderStatusHistoryChanges OrderStatusHistory[] @relation("ChangedBy")
  refundsApproved         Refund[] @relation("ApprovedBy")

  @@index([email])
  @@index([role])
  @@index([accountStatus])
  @@index([referrerId])
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
  documentType    DocumentType @map("document_type")
  documentNumber  String    @map("document_number") @db.VarChar(100)
  documentUrl     String?   @map("document_url")
  documentKey     String?   @map("document_key") @db.VarChar(255)
  frontImageUrl   String?   @map("front_image_url")
  frontImageKey   String?   @map("front_image_key") @db.VarChar(255)
  backImageUrl    String?   @map("back_image_url")
  backImageKey    String?   @map("back_image_key") @db.VarChar(255)

  verificationStatus VerificationStatus @default(PENDING) @map("verification_status")
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

  fuelTypes            FuelType[] @map("fuel_types")
  prices               Json      @db.Json // { petrol: 600, diesel: 550 }

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

  status               DeliveryDriverStatus @default(INACTIVE)
  availabilityStatus   AvailabilityStatus @default(OFFLINE) @map("availability_status")

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
  status     OrderStatus?

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

  fuelType                 FuelType  @map("fuel_type")
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

  paymentMethod            PaymentMethod @map("payment_method")
  paymentStatus            PaymentStatus @default(PENDING) @map("payment_status")
  paidAt                   DateTime? @map("paid_at") @db.Timestamp(3)

  status                   OrderStatus @default(PENDING)

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
  previousStatus OrderStatus? @map("previous_status")
  newStatus     OrderStatus @map("new_status")
  changedBy     BigInt?   @map("changed_by")
  reason        String?
  metadata      Json?
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(3)

  order         Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  changedByUser Account?  @relation("ChangedBy", fields: [changedBy], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([createdAt])
  @@map("order_status_history")
  @@schema("delivery")
}

model OrderNotification {
  id              BigInt    @id @default(autoincrement())
  accountId       BigInt    @map("account_id")
  orderId         BigInt    @map("order_id")

  notificationType NotificationType @map("notification_type")
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

  transactionType         TransactionType @map("transaction_type")
  transactionReference    String    @unique @map("transaction_reference") @db.VarChar(100)
  paymentGatewayReference String?   @map("payment_gateway_reference") @db.VarChar(100)

  amount                  Decimal   @db.Decimal(12, 2)
  currency                String    @default("NGN") @db.VarChar(3)

  paymentMethod           PaymentMethod @map("payment_method")
  paymentChannel          String?   @map("payment_channel") @db.VarChar(50)

  paystackAccessCode      String?   @map("paystack_access_code") @db.VarChar(255)
  paystackAuthorizationUrl String?  @map("paystack_authorization_url")

  status                  PaymentStatus @default(PENDING)
  failureReason           String?   @map("failure_reason")

  metadata                Json?

  createdAt               DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt               DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)
  completedAt             DateTime? @map("completed_at") @db.Timestamp(3)

  account                 Account   @relation(fields: [accountId], references: [id], onDelete: Restrict)
  order                   Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)
  refunds                 Refund[]

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

  transactionType     WalletTransactionType @map("transaction_type")
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

  status                 RefundStatus @default(PENDING)
  approvedBy             BigInt?   @map("approved_by")
  approvedAt             DateTime? @map("approved_at") @db.Timestamp(3)

  paystackRefundReference String?  @map("paystack_refund_reference") @db.VarChar(100)

  createdAt              DateTime  @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt              DateTime  @updatedAt @map("updated_at") @db.Timestamp(3)
  completedAt            DateTime? @map("completed_at") @db.Timestamp(3)

  transaction            Transaction @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  account                Account   @relation(fields: [accountId], references: [id], onDelete: Restrict)
  approver               Account?  @relation("ApprovedBy", fields: [approvedBy], references: [id], onDelete: SetNull)

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
