// This is your Prisma schema file.
// Learn more about it in the docs: https://pris.ly/d/prisma-schema
// All @map directives removed for fresh database creation
// Prisma will auto-convert camelCase to snake_case in PostgreSQL

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
  id              BigInt        @id @default(autoincrement())
  email           String        @unique @db.VarChar(255)
  passwordHash    String        @db.VarChar(255)
  role            UserRole      @default(USER)
  accountStatus   AccountStatus @default(ACTIVE)
  emailVerified   Boolean       @default(false)
  emailVerifiedAt DateTime?     @db.Timestamp(3)

  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String? @db.VarChar(255)

  resetPasswordToken       String?   @db.VarChar(255)
  resetPasswordTokenExpiry DateTime? @db.Timestamp(3)

  referrerId   BigInt?
  referralCode String? @unique @db.VarChar(24)

  lastLogin          DateTime? @db.Timestamp(3)
  lastPasswordChange DateTime? @db.Timestamp(3)
  lastIpAddress      String?   @db.Inet

  createdAt DateTime  @default(now()) @db.Timestamp(3)
  updatedAt DateTime  @updatedAt @db.Timestamp(3)
  deletedAt DateTime? @db.Timestamp(3)

  referrer      Account?  @relation("Referrer", fields: [referrerId], references: [id], onDelete: SetNull)
  referredUsers Account[] @relation("Referrer")

  userProfile               UserProfile?
  userDocuments             UserDocument[]
  twoFactorAuth             TwoFactorAuth?
  deliveryDriver            DeliveryDriver?
  orders                    Order[]
  transactions              Transaction[]
  walletTransactions        WalletTransaction[]
  wallet                    Wallet?
  notifications             OrderNotification[]
  auditLogs                 AuditLog[]
  orderStatusHistoryChanges OrderStatusHistory[] @relation("ChangedBy")
  refundsApproved           Refund[]             @relation("ApprovedBy")

  @@index([email])
  @@index([role])
  @@index([accountStatus])
  @@index([referrerId])
  @@schema("auth")
}

model RefreshToken {
  id        BigInt    @id @default(autoincrement())
  accountId BigInt
  tokenHash String    @unique @db.VarChar(255)
  expiresAt DateTime  @db.Timestamp(3)
  revokedAt DateTime? @db.Timestamp(3)
  createdAt DateTime  @default(now()) @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([expiresAt])
  @@schema("auth")
}

model AuditLog {
  id           BigInt   @id @default(autoincrement())
  accountId    BigInt?
  action       String   @db.VarChar(100)
  resourceType String?  @db.VarChar(100)
  resourceId   String?  @db.VarChar(100)
  status       String   @db.VarChar(20)
  errorMessage String?
  ipAddress    String?  @db.Inet
  userAgent    String?
  metadata     Json?
  createdAt    DateTime @default(now()) @db.Timestamp(3)

  account Account? @relation(fields: [accountId], references: [id], onDelete: SetNull)

  @@index([accountId])
  @@index([action])
  @@index([createdAt])
  @@schema("auth")
}

// ============ USERS SCHEMA ============

model UserProfile {
  id                BigInt    @id @default(autoincrement())
  accountId         BigInt    @unique
  firstName         String    @db.VarChar(100)
  lastName          String    @db.VarChar(100)
  phoneNumber       String?   @db.VarChar(20)
  phoneVerified     Boolean   @default(false)
  profilePictureUrl String?
  profilePictureKey String?   @db.VarChar(255)
  bio               String?
  dateOfBirth       DateTime? @db.Date

  addressStreet     String? @db.VarChar(255)
  addressCity       String? @db.VarChar(100)
  addressState      String? @db.VarChar(100)
  addressCountry    String  @default("Nigeria") @db.VarChar(100)
  addressPostalCode String? @db.VarChar(20)

  defaultDeliveryAddress  Json?
  notificationPreferences Json?

  createdAt DateTime @default(now()) @db.Timestamp(3)
  updatedAt DateTime @updatedAt @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([phoneNumber])
  @@schema("users")
}

model UserDocument {
  id             BigInt       @id @default(autoincrement())
  accountId      BigInt
  documentType   DocumentType
  documentNumber String       @db.VarChar(100)
  documentUrl    String?
  documentKey    String?      @db.VarChar(255)
  frontImageUrl  String?
  frontImageKey  String?      @db.VarChar(255)
  backImageUrl   String?
  backImageKey   String?      @db.VarChar(255)

  verificationStatus VerificationStatus @default(PENDING)
  verifiedBy         BigInt?
  verifiedAt         DateTime?          @db.Timestamp(3)
  rejectionReason    String?

  expiresAt DateTime? @db.Date
  createdAt DateTime  @default(now()) @db.Timestamp(3)
  updatedAt DateTime  @updatedAt @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([documentType, documentNumber])
  @@index([accountId])
  @@index([verificationStatus])
  @@index([documentType])
  @@schema("users")
}

model TwoFactorAuth {
  id             BigInt    @id @default(autoincrement())
  accountId      BigInt    @unique
  totpSecret     String    @db.VarChar(255)
  backupCodes    String[]
  enabledAt      DateTime? @db.Timestamp(3)
  lastVerifiedAt DateTime? @db.Timestamp(3)
  createdAt      DateTime  @default(now()) @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@schema("users")
}

// ============ DELIVERY SCHEMA ============

model Station {
  id                BigInt  @id @default(autoincrement())
  name              String  @db.VarChar(255)
  addressStreet     String  @db.VarChar(255)
  addressCity       String  @db.VarChar(100)
  addressState      String  @db.VarChar(100)
  addressCountry    String  @default("Nigeria") @db.VarChar(100)
  addressPostalCode String? @db.VarChar(20)

  latitude  Decimal @db.Decimal(10, 8)
  longitude Decimal @db.Decimal(11, 8)

  fuelTypes FuelType[]
  prices    Json // { petrol: 600, diesel: 550 }

  openTime  DateTime? @db.Time()
  closeTime DateTime? @db.Time()
  is24h     Boolean   @default(false)

  isAvailable Boolean @default(true)
  isVerified  Boolean @default(false)

  phoneNumber String? @db.VarChar(20)
  managerName String? @db.VarChar(255)

  metadata Json?

  createdAt DateTime @default(now()) @db.Timestamp(3)
  updatedAt DateTime @updatedAt @db.Timestamp(3)

  drivers DeliveryDriver[]
  orders  Order[]

  @@unique([name, addressStreet, addressCity])
  @@index([addressCity])
  @@index([isAvailable])
  @@schema("delivery")
}

model DeliveryDriver {
  id        BigInt @id @default(autoincrement())
  accountId BigInt @unique
  stationId BigInt

  firstName   String @db.VarChar(100)
  lastName    String @db.VarChar(100)
  phoneNumber String @db.VarChar(20)

  licenseNumber   String   @unique @db.VarChar(50)
  licenseExpiry   DateTime @db.Date
  licenseVerified Boolean  @default(false)

  status             DeliveryDriverStatus @default(INACTIVE)
  availabilityStatus AvailabilityStatus   @default(OFFLINE)

  averageRating   Decimal @default(0) @db.Decimal(3, 2)
  totalDeliveries Int     @default(0)

  hireDate   DateTime @db.Date
  employeeId String?  @db.VarChar(50)

  preferredShift String? @db.VarChar(50)

  createdAt DateTime @default(now()) @db.Timestamp(3)
  updatedAt DateTime @updatedAt @db.Timestamp(3)

  account          Account                 @relation(fields: [accountId], references: [id], onDelete: Cascade)
  station          Station                 @relation(fields: [stationId], references: [id], onDelete: Restrict)
  orders           Order[]
  locationTracking AgentLocationTracking[]

  @@index([accountId])
  @@index([stationId])
  @@index([status])
  @@schema("delivery")
}

model AgentLocationTracking {
  id       BigInt  @id @default(autoincrement())
  driverId BigInt
  orderId  BigInt?

  latitude  Decimal      @db.Decimal(10, 8)
  longitude Decimal      @db.Decimal(11, 8)
  accuracy  Decimal?     @db.Decimal(7, 2)
  status    OrderStatus?

  createdAt DateTime @default(now()) @db.Timestamp(3)

  driver DeliveryDriver @relation(fields: [driverId], references: [id], onDelete: Cascade)
  order  Order?         @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([driverId])
  @@index([orderId])
  @@index([createdAt])
  @@schema("delivery")
}

model Order {
  id        BigInt  @id @default(autoincrement())
  accountId BigInt
  driverId  BigInt?
  stationId BigInt

  fuelType       FuelType
  quantityLiters Decimal  @db.Decimal(10, 2)
  unitPrice      Decimal  @db.Decimal(10, 2)
  totalAmount    Decimal  @db.Decimal(12, 2)

  orderReference   String  @unique @db.VarChar(100)
  paymentReference String? @db.VarChar(100)

  deliveryAddressStreet String  @db.VarChar(255)
  deliveryAddressCity   String  @db.VarChar(100)
  deliveryAddressState  String  @db.VarChar(100)
  deliveryLatitude      Decimal @db.Decimal(10, 8)
  deliveryLongitude     Decimal @db.Decimal(11, 8)

  paymentMethod PaymentMethod
  paymentStatus PaymentStatus @default(PENDING)
  paidAt        DateTime?     @db.Timestamp(3)

  status OrderStatus @default(PENDING)

  rating        Int?
  reviewComment String?
  ratedAt       DateTime? @db.Timestamp(3)

  createdAt          DateTime  @default(now()) @db.Timestamp(3)
  updatedAt          DateTime  @updatedAt @db.Timestamp(3)
  completedAt        DateTime? @db.Timestamp(3)
  cancelledAt        DateTime? @db.Timestamp(3)
  cancellationReason String?

  account Account         @relation(fields: [accountId], references: [id], onDelete: Restrict)
  driver  DeliveryDriver? @relation(fields: [driverId], references: [id], onDelete: SetNull)
  station Station         @relation(fields: [stationId], references: [id], onDelete: Restrict)

  statusHistory    OrderStatusHistory[]
  notifications    OrderNotification[]
  transactions     Transaction[]
  locationTracking AgentLocationTracking[]

  @@index([accountId])
  @@index([driverId])
  @@index([stationId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
  @@index([orderReference])
  @@schema("delivery")
}

model OrderStatusHistory {
  id             BigInt       @id @default(autoincrement())
  orderId        BigInt
  previousStatus OrderStatus?
  newStatus      OrderStatus
  changedBy      BigInt?
  reason         String?
  metadata       Json?
  createdAt      DateTime     @default(now()) @db.Timestamp(3)

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  changedByUser Account? @relation("ChangedBy", fields: [changedBy], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([createdAt])
  @@schema("delivery")
}

model OrderNotification {
  id        BigInt @id @default(autoincrement())
  accountId BigInt
  orderId   BigInt

  notificationType NotificationType
  title            String           @db.VarChar(255)
  message          String

  isRead Boolean   @default(false)
  readAt DateTime? @db.Timestamp(3)

  sentViaPush  Boolean @default(false)
  sentViaEmail Boolean @default(false)
  sentViaSms   Boolean @default(false)

  createdAt DateTime @default(now()) @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([orderId])
  @@index([isRead])
  @@schema("delivery")
}

// ============ PAYMENT SCHEMA ============

model Transaction {
  id        BigInt  @id @default(autoincrement())
  accountId BigInt
  orderId   BigInt?

  transactionType         TransactionType
  transactionReference    String          @unique @db.VarChar(100)
  paymentGatewayReference String?         @db.VarChar(100)

  amount   Decimal @db.Decimal(12, 2)
  currency String  @default("NGN") @db.VarChar(3)

  paymentMethod  PaymentMethod
  paymentChannel String?       @db.VarChar(50)

  paystackAccessCode       String? @db.VarChar(255)
  paystackAuthorizationUrl String?

  status        PaymentStatus @default(PENDING)
  failureReason String?

  metadata Json?

  createdAt   DateTime  @default(now()) @db.Timestamp(3)
  updatedAt   DateTime  @updatedAt @db.Timestamp(3)
  completedAt DateTime? @db.Timestamp(3)

  account Account  @relation(fields: [accountId], references: [id], onDelete: Restrict)
  order   Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  refunds Refund[]

  @@index([accountId])
  @@index([orderId])
  @@index([status])
  @@index([transactionReference])
  @@index([createdAt])
  @@schema("payment")
}

model Wallet {
  id                  BigInt    @id @default(autoincrement())
  accountId           BigInt    @unique
  balance             Decimal   @default(0) @db.Decimal(12, 2)
  totalEarnedCashback Decimal   @default(0) @db.Decimal(12, 2)
  lastTransactionAt   DateTime? @db.Timestamp(3)
  createdAt           DateTime  @default(now()) @db.Timestamp(3)
  updatedAt           DateTime  @updatedAt @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@schema("payment")
}

model WalletTransaction {
  id        BigInt @id @default(autoincrement())
  accountId BigInt

  transactionType WalletTransactionType
  amount          Decimal               @db.Decimal(12, 2)

  previousBalance Decimal @db.Decimal(12, 2)
  newBalance      Decimal @db.Decimal(12, 2)

  reason         String?
  relatedOrderId BigInt?

  createdAt DateTime @default(now()) @db.Timestamp(3)

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([createdAt])
  @@schema("payment")
}

model Refund {
  id            BigInt  @id @default(autoincrement())
  transactionId BigInt
  orderId       BigInt?
  accountId     BigInt

  amount      Decimal @db.Decimal(12, 2)
  reason      String  @db.VarChar(255)
  description String?

  status     RefundStatus @default(PENDING)
  approvedBy BigInt?
  approvedAt DateTime?    @db.Timestamp(3)

  paystackRefundReference String? @db.VarChar(100)

  createdAt   DateTime  @default(now()) @db.Timestamp(3)
  updatedAt   DateTime  @updatedAt @db.Timestamp(3)
  completedAt DateTime? @db.Timestamp(3)

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  account     Account     @relation(fields: [accountId], references: [id], onDelete: Restrict)
  approver    Account?    @relation("ApprovedBy", fields: [approvedBy], references: [id], onDelete: SetNull)

  @@index([transactionId])
  @@index([accountId])
  @@index([status])
  @@schema("payment")
}

// ============ SYSTEM SCHEMA ============

model Setting {
  id           BigInt   @id @default(autoincrement())
  settingKey   String   @unique @db.VarChar(255)
  settingValue String
  description  String?
  settingType  String?  @db.VarChar(50)
  createdAt    DateTime @default(now()) @db.Timestamp(3)
  updatedAt    DateTime @updatedAt @db.Timestamp(3)

  @@schema("system")
}
