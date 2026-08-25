import { pgEnum } from "drizzle-orm/pg-core";

export const textDirectionEnum = pgEnum("text_direction", ["rtl", "ltr"]);
export const roleEnum = pgEnum("role", [
  "customer",
  "student",
  "practitioner",
  "staff",
  "admin",
]);
export const priceVisibilityEnum = pgEnum("price_visibility", [
  "public",
  "on_request",
]);
export const customerGroupEnum = pgEnum("customer_group", [
  "public",
  "student",
  "professional",
]);
export const productReviewStateEnum = pgEnum("product_review_state", [
  "draft",
  "verified",
  "approved",
]);
export const mediaRoleEnum = pgEnum("media_role", [
  "primary",
  "gallery",
  "package",
  "texture",
  "unknown",
]);
export const mediaProvenanceEnum = pgEnum("media_provenance", [
  "supplier_draft",
  "brand_owned",
]);
export const mediaRightsEnum = pgEnum("media_rights", [
  "unknown",
  "approved_supplier",
  "brand_owned",
]);
export const sizeUnitEnum = pgEnum("size_unit", [
  "ml",
  "g",
  "unit",
  "sheet",
  "capsule",
  "kit",
  "pair",
]);
export const priceBatchStatusEnum = pgEnum("price_batch_status", [
  "draft",
  "committed",
  "cancelled",
]);
export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "initial_load",
  "receipt",
  "manual_adjustment",
  "sale",
  "return",
  "refund_restock",
  "damage",
  "correction",
]);
export const cartStatusEnum = pgEnum("cart_status", [
  "active",
  "converted",
  "expired",
  "abandoned",
]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "active",
  "consumed",
  "released",
  "expired",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "awaiting_payment",
  "awaiting_transfer",
  "payment_review",
  "paid",
  "fulfilled",
  "completed",
  "cancelled",
  "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "gateway",
  "bank_transfer",
  "cash_on_pickup",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "submitted",
  "funds_received",
  "settlement_review",
  "settled",
  "failed",
  "refunded",
]);
export const bankTransferClaimStatusEnum = pgEnum(
  "bank_transfer_claim_status",
  ["submitted", "accepted", "rejected"],
);
export const shippingMethodEnum = pgEnum("shipping_method", [
  "post",
  "courier",
  "pickup",
]);
export const shipmentStatusEnum = pgEnum("shipment_status", [
  "pending",
  "ready",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
]);
export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "sent",
  "failed",
  "dead",
]);
