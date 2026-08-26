import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  address,
  bankTransferClaim,
  customerOrder,
  iranCity,
  iranProvince,
  orderLine,
  payment,
  person,
} from "@/lib/db/schema";
import { formatToman, type Rials } from "@/lib/money";
import type { Viewer } from "./account.ownership";

/**
 * Everything the account surface reads — `Phase D`.
 *
 * **Every query is owner-scoped in its `where`, not filtered afterwards.** A
 * read that fetches then checks is a read that returns somebody else's row the
 * day the check is refactored out. There is no function here that takes an
 * order id without also taking the viewer.
 *
 * Province and city are joined to their reference rows rather than stored as
 * labels on the address, so a renamed city is one update. An *order* keeps its
 * own frozen labels in `addressSnapshot`, because an order must not change when
 * the reference does.
 */

function money(amount: Rials | null, localeCode: string) {
  if (amount === null) return null;
  return {
    amountRials: amount,
    label: formatToman(amount, localeCode === "fa" ? "fa" : "en"),
  };
}

export type ProfileView = Readonly<{
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  phone: string | null;
  phoneVerified: boolean;
  preferredLocaleCode: string | null;
  /** True when the email is the phone-derived placeholder, not a real address. */
  emailIsPlaceholder: boolean;
}>;

export async function getProfile(viewer: Viewer): Promise<ProfileView | null> {
  const rows = await db
    .select({
      firstName: person.firstName,
      lastName: person.lastName,
      displayName: person.displayName,
      phone: person.phone,
      phoneVerified: person.phoneVerified,
      preferredLocaleCode: person.preferredLocaleCode,
      emailIsPlaceholder: person.emailIsPlaceholder,
    })
    .from(person)
    .where(eq(person.id, viewer.personId))
    .limit(1);
  return rows[0] ?? null;
}

export type AddressView = Readonly<{
  id: string;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  postalCode: string;
  line: string;
  isDefault: boolean;
}>;

export async function listAddresses(
  viewer: Viewer,
): Promise<readonly AddressView[]> {
  return db
    .select({
      id: address.id,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      provinceCode: address.provinceCode,
      provinceName: iranProvince.nameFa,
      cityCode: address.cityCode,
      cityName: iranCity.nameFa,
      postalCode: address.postalCode,
      line: address.line,
      isDefault: address.isDefault,
    })
    .from(address)
    .innerJoin(iranProvince, eq(iranProvince.code, address.provinceCode))
    .innerJoin(iranCity, eq(iranCity.code, address.cityCode))
    .where(eq(address.personId, viewer.personId))
    .orderBy(desc(address.isDefault), asc(address.createdAt));
}

export type ProvinceOption = Readonly<{ code: string; name: string }>;
export type CityOption = Readonly<{
  code: string;
  provinceCode: string;
  name: string;
}>;

/** The address form's options. Reference data, so not owner-scoped. */
export async function getLocationOptions(): Promise<{
  provinces: readonly ProvinceOption[];
  cities: readonly CityOption[];
}> {
  const [provinces, cities] = await Promise.all([
    db
      .select({ code: iranProvince.code, name: iranProvince.nameFa })
      .from(iranProvince)
      .orderBy(asc(iranProvince.sortOrder), asc(iranProvince.code)),
    db
      .select({
        code: iranCity.code,
        provinceCode: iranCity.provinceCode,
        name: iranCity.nameFa,
      })
      .from(iranCity)
      .orderBy(asc(iranCity.provinceCode), asc(iranCity.sortOrder)),
  ]);
  return { provinces, cities };
}

export type OrderSummaryView = Readonly<{
  id: string;
  orderNumber: string;
  status: string;
  placedAt: Date | null;
  total: { amountRials: Rials; label: string } | null;
  itemCount: number;
}>;

export async function listOrders(
  viewer: Viewer,
  localeCode: string,
): Promise<readonly OrderSummaryView[]> {
  const rows = await db
    .select({
      id: customerOrder.id,
      orderNumber: customerOrder.orderNumber,
      status: customerOrder.status,
      placedAt: customerOrder.placedAt,
      totalRials: customerOrder.totalRials,
    })
    .from(customerOrder)
    .where(eq(customerOrder.personId, viewer.personId))
    .orderBy(desc(customerOrder.createdAt));

  if (rows.length === 0) return [];

  // One query for the counts rather than one per order.
  const counts = new Map<string, number>();
  for (const row of await db
    .select({ orderId: orderLine.orderId, quantity: orderLine.quantity })
    .from(orderLine)) {
    counts.set(row.orderId, (counts.get(row.orderId) ?? 0) + row.quantity);
  }

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    placedAt: row.placedAt,
    total: money(row.totalRials, localeCode),
    itemCount: counts.get(row.id) ?? 0,
  }));
}

export type OrderLineView = Readonly<{
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPrice: { amountRials: Rials; label: string } | null;
  lineTotal: { amountRials: Rials; label: string } | null;
}>;

export type OrderDetailView = Readonly<{
  id: string;
  orderNumber: string;
  status: string;
  placedAt: Date | null;
  lines: readonly OrderLineView[];
  subtotal: { amountRials: Rials; label: string } | null;
  shipping: { amountRials: Rials; label: string } | null;
  discount: { amountRials: Rials; label: string } | null;
  total: { amountRials: Rials; label: string } | null;
  addressSnapshot: unknown;
  payments: readonly Readonly<{
    id: string;
    method: string;
    status: string;
    amount: { amountRials: Rials; label: string } | null;
    createdAt: Date;
    transferTrackingNumber: string | null;
  }>[];
}>;

/**
 * One order, and it **is** the invoice.
 *
 * The lines are `order_line`'s snapshots — the product name, variant, SKU and
 * unit price as they were at purchase. Nothing here joins the catalogue, which
 * is the point: a price change or a rename must not rewrite an invoice
 * somebody has already been sent.
 *
 * `orderId` and the viewer travel together, and the viewer is in the `where`.
 */
export async function getOrder(
  viewer: Viewer,
  orderId: string,
  localeCode: string,
): Promise<OrderDetailView | null> {
  const rows = await db
    .select({
      id: customerOrder.id,
      orderNumber: customerOrder.orderNumber,
      status: customerOrder.status,
      placedAt: customerOrder.placedAt,
      subtotalRials: customerOrder.subtotalRials,
      shippingRials: customerOrder.shippingRials,
      discountRials: customerOrder.discountRials,
      totalRials: customerOrder.totalRials,
      addressSnapshot: customerOrder.addressSnapshot,
    })
    .from(customerOrder)
    .where(
      and(
        eq(customerOrder.id, orderId),
        eq(customerOrder.personId, viewer.personId),
      ),
    )
    .limit(1);

  const order = rows[0];
  if (!order) return null;

  const [lines, payments] = await Promise.all([
    db
      .select({
        productName: orderLine.productNameSnapshot,
        variantName: orderLine.variantNameSnapshot,
        sku: orderLine.skuSnapshot,
        quantity: orderLine.quantity,
        unitPriceRials: orderLine.unitPriceRials,
        lineTotalRials: orderLine.lineTotalRials,
      })
      .from(orderLine)
      .where(eq(orderLine.orderId, order.id)),
    db
      .select({
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amountRials: payment.amountRials,
        createdAt: payment.createdAt,
        trackingNumber: bankTransferClaim.trackingNumber,
      })
      .from(payment)
      .leftJoin(bankTransferClaim, eq(bankTransferClaim.paymentId, payment.id))
      .where(eq(payment.orderId, order.id))
      .orderBy(desc(payment.createdAt)),
  ]);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt,
    lines: lines.map((line) => ({
      productName: line.productName,
      variantName: line.variantName,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: money(line.unitPriceRials, localeCode),
      lineTotal: money(line.lineTotalRials, localeCode),
    })),
    subtotal: money(order.subtotalRials, localeCode),
    shipping: money(order.shippingRials, localeCode),
    discount: money(order.discountRials, localeCode),
    total: money(order.totalRials, localeCode),
    addressSnapshot: order.addressSnapshot,
    payments: payments.map((entry) => ({
      id: entry.id,
      method: entry.method,
      status: entry.status,
      amount: money(entry.amountRials, localeCode),
      createdAt: entry.createdAt,
      transferTrackingNumber: entry.trackingNumber,
    })),
  };
}
