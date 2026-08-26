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

/**
 * Editorial content — the four tables every surface reads copy from.
 * `docs/system-design/content/content-spine.md`, decisions `C-11`–`C-15`.
 */
export const contentBlockKindEnum = pgEnum("content_block_kind", [
  "faq",
  "editorial",
  "gallery",
  "campaign",
  /**
   * A quote with an attribution. Added for the Landing's proof beat.
   *
   * It carries **preview** quotes only — clearly fictional ones, so the rail
   * can be judged full (`CONTENT-03`). A real testimonial is not editorial
   * copy: it is a person's words about their own skin, with a consent state, a
   * source and a right to withdraw. That is a domain entity and it gets its own
   * table when there is consent to model. See the packet 6 review log.
   */
  "testimonial",
]);
export const contentSurfaceEnum = pgEnum("content_surface", [
  "shop.hub",
  "shop.listing",
  "pdp",
  "landing",
  "booking",
  "academy",
]);
export const contentScopeKindEnum = pgEnum("content_scope_kind", [
  "concern",
  "brand",
  "category",
]);
export const contentReviewStateEnum = pgEnum("content_review_state", [
  "draft",
  "reviewed",
  "approved",
]);

/**
 * Who chose a `product_pair` row.
 *
 * `development` is a pairing a seeder invented so the surface can be judged;
 * `owner` is one Mahdieh chose. The PDP renders both identically — the
 * distinction is for whoever promotes this catalogue to production, who needs
 * to find every invented suggestion without reading a seed script.
 */
export const pairSourceEnum = pgEnum("pair_source", ["development", "owner"]);

/**
 * A return's progress — `COM-D11`, which keeps returns, refunds and restocking
 * as three separate decisions rather than one status ladder.
 *
 * `received` is distinct from `resolved` on purpose: the goods arriving and the
 * money going back are different events, often days apart, and collapsing them
 * is how a customer gets refunded for a parcel nobody opened.
 */
export const returnStatusEnum = pgEnum("return_status", [
  "requested",
  "approved",
  "rejected",
  "received",
  "resolved",
  "cancelled",
]);

/**
 * What happens to the goods, decided per line rather than per return.
 *
 * `restock` is the only value that touches inventory, and it is deliberately
 * not the default: skincare that has left the building does not automatically
 * go back on a shelf, and `COM-D11` makes restocking its own decision.
 */
export const returnDispositionEnum = pgEnum("return_disposition", [
  "pending",
  "restock",
  "discard",
  "quarantine",
]);

/**
 * A refund's own lifecycle, separate from the return that caused it.
 *
 * `COM-D6` keeps order state and payment state apart; this is the same rule one
 * level down. A return can be resolved while its refund is still in flight, and
 * a refund can fail without reopening the return.
 */
export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
