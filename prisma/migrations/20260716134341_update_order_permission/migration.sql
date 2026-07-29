/*
  Warnings:

  - The values [CREATE_ORDER] on the enum `Permission` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Permission_new" AS ENUM ('USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE', 'USER_SUSPEND', 'ROLE_CREATE', 'ROLE_READ', 'ROLE_UPDATE', 'ROLE_DELETE', 'ROLE_ASSIGN', 'STATION_CREATE', 'STATION_READ', 'STATION_UPDATE', 'STATION_DELETE', 'ORDER_CREATE', 'ORDER_READ', 'ORDER_UPDATE', 'ORDER_CANCEL', 'ORDER_APPROVE', 'PAYMENT_READ', 'PAYMENT_VERIFY', 'PAYMENT_REFUND', 'DASHBOARD_READ', 'SETTINGS_UPDATE');
ALTER TYPE "Permission" RENAME TO "Permission_old";
ALTER TYPE "Permission_new" RENAME TO "Permission";
DROP TYPE "public"."Permission_old";
COMMIT;
