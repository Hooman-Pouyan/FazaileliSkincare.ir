import { getTranslations } from "next-intl/server";
import { formatIranianPhone } from "@/lib/auth/phone";
import { updateProfileFormAction } from "../account.actions";
import type { ProfileView } from "../account.reads";

/**
 * Name and preferred language — the only two things a customer may change here.
 *
 * **The phone is shown and not editable.** It is the account's identity and the
 * thing its verification rests on; moving it belongs to `AUTH5` with
 * re-verification attached, and a profile form that could change it would be an
 * account takeover with a save button. Shown rather than hidden, because a
 * customer needs to know which number their orders will be called about.
 *
 * A plain form posting to a Server Action, so it works with JavaScript off.
 */
export async function ProfileForm({
  profile,
}: {
  readonly profile: ProfileView;
}) {
  const t = await getTranslations("account");

  return (
    <section className="flex flex-col gap-6">
      <h2 className="m-0 text-h3 font-bold">{t("profile.title")}</h2>

      <form action={updateProfileFormAction} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("profile.firstName")}
            </span>
            <input
              name="firstName"
              defaultValue={profile.firstName ?? ""}
              required
              maxLength={80}
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("profile.lastName")}
            </span>
            <input
              name="lastName"
              defaultValue={profile.lastName ?? ""}
              required
              maxLength={80}
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-small text-stone-text">
            {t("profile.locale")}
          </span>
          <select
            name="preferredLocaleCode"
            defaultValue={profile.preferredLocaleCode ?? "fa"}
            className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 border-t border-[var(--hairline-soft)] pt-5">
          <span className="text-small text-stone-text">
            {t("profile.phoneLabel")}
          </span>
          <span className="flex flex-wrap items-baseline gap-3">
            <span dir="ltr" className="text-lede tabular-nums">
              {profile.phone ? formatIranianPhone(profile.phone) : "—"}
            </span>
            {profile.phoneVerified && (
              <span className="text-micro text-firouzeh-text">
                {t("profile.phoneVerified")}
              </span>
            )}
          </span>
          <p className="m-0 text-small leading-fa text-stone-text">
            {t("profile.phoneLocked")}
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center self-start bg-ink px-6 text-small font-medium text-sand"
        >
          {t("profile.save")}
        </button>
      </form>
    </section>
  );
}
