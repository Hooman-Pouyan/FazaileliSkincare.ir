import { getTranslations } from "next-intl/server";
import { formatIranianPhone } from "@/lib/auth/phone";
import {
  deleteAddressFormAction,
  saveAddressFormAction,
  setDefaultAddressFormAction,
} from "../account.actions";
import type { AddressView, CityOption, ProvinceOption } from "../account.reads";

/**
 * The address book — list, add, remove, choose a default.
 *
 * **Everything is a form posting to a Server Action**, so the whole surface
 * works with JavaScript off. There is no client state and no dialog: an "add"
 * form that only appears after a click is a form a reader without JavaScript
 * never reaches, and this page has few enough fields that showing it costs
 * nothing.
 *
 * **One city select, grouped by province, and no province field.** A city
 * belongs to exactly one province, so the province is derived server-side.
 * That removes the dependent-dropdown problem rather than solving it — a
 * province/city pair needs JavaScript to stay in step, and a mismatched pair is
 * a parcel filed under the wrong province.
 *
 * The seeded city list is one row per province (`12.4`), so the select says so
 * rather than looking broken.
 */
export async function AddressBook({
  addresses,
  provinces,
  cities,
}: {
  readonly addresses: readonly AddressView[];
  readonly provinces: readonly ProvinceOption[];
  readonly cities: readonly CityOption[];
}) {
  const t = await getTranslations("account");
  const byProvince = new Map<string, CityOption[]>();
  for (const city of cities) {
    const bucket = byProvince.get(city.provinceCode) ?? [];
    bucket.push(city);
    byProvince.set(city.provinceCode, bucket);
  }

  return (
    <section className="flex flex-col gap-6">
      <h2 className="m-0 text-h3 font-bold">{t("addresses.title")}</h2>

      {addresses.length === 0 ? (
        <p className="m-0 text-body text-stone-text">{t("addresses.empty")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {addresses.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--hairline-soft)] pb-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-baseline gap-3">
                  <span className="text-body font-medium">
                    {entry.recipientName}
                  </span>
                  {entry.isDefault && (
                    <span className="text-micro text-gold-text">
                      {t("addresses.isDefault")}
                    </span>
                  )}
                </span>
                <span className="text-small leading-fa text-stone-text">
                  {entry.provinceName} · {entry.cityName} · {entry.line}
                </span>
                <span
                  dir="ltr"
                  className="text-small tabular-nums text-stone-text"
                >
                  {entry.postalCode} ·{" "}
                  {formatIranianPhone(entry.recipientPhone)}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!entry.isDefault && (
                  <form action={setDefaultAddressFormAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center px-2 text-small text-firouzeh-text"
                    >
                      {t("addresses.setDefault")}
                    </button>
                  </form>
                )}
                <form action={deleteAddressFormAction}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center px-2 text-small text-stone-text hover:text-ink"
                  >
                    {t("addresses.remove")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={saveAddressFormAction}
        className="flex flex-col gap-5 rounded-[var(--radius-surface)] bg-linen p-6"
      >
        <h3 className="m-0 text-body font-medium">{t("addresses.add")}</h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("addresses.recipientName")}
            </span>
            <input
              name="recipientName"
              required
              maxLength={120}
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("addresses.recipientPhone")}
            </span>
            <input
              name="recipientPhone"
              required
              dir="ltr"
              inputMode="tel"
              placeholder="+989120000000"
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body tabular-nums"
            />
            <span className="text-micro leading-fa text-stone-text">
              {t("addresses.recipientHint")}
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("addresses.city")}
            </span>
            <select
              name="cityCode"
              required
              defaultValue=""
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body"
            >
              <option value="" disabled>
                {t("addresses.chooseCity")}
              </option>
              {provinces.map((province) => (
                <optgroup key={province.code} label={province.name}>
                  {(byProvince.get(province.code) ?? []).map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="text-micro leading-fa text-stone-text">
              {t("addresses.cityIncomplete")}
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("addresses.postalCode")}
            </span>
            <input
              name="postalCode"
              required
              dir="ltr"
              inputMode="numeric"
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body tabular-nums"
            />
            <span className="text-micro text-stone-text">
              {t("addresses.postalHint")}
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-small text-stone-text">
            {t("addresses.line")}
          </span>
          <textarea
            name="line"
            required
            rows={2}
            maxLength={400}
            className="border border-[var(--hairline-soft)] bg-ground px-3 py-2 text-body leading-fa"
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="isDefault"
            className="size-4 accent-[color:var(--ink)]"
          />
          <span className="text-small text-stone-text">
            {t("addresses.makeDefault")}
          </span>
        </label>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center self-start bg-ink px-6 text-small font-medium text-sand"
        >
          {t("addresses.save")}
        </button>
      </form>
    </section>
  );
}
