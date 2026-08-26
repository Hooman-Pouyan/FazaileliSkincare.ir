# -*- coding: utf-8 -*-
"""Emit content/testimonials/curated-2026-08-26.json from the transcription passes.

    python3 scripts/content/curate-testimonials.py   (or: pnpm content:testimonials)

The two transcription passes hold 43 records, every one with
`publicationConsent: "unknown"` and `displayQuoteFa: null`. The maintainer
confirmed on 2026-08-26 that consent was obtained for all of them and that the
OCR simply could not see it. That confirmation is recorded per record as
`consentSource`, not by overwriting `unknown` in place — the same discipline
`nameSource` and `authorNote` follow elsewhere: a value someone asserted is
stored together with who asserted it.

TWO THINGS ARE CURATED HERE, AND THEY ARE DIFFERENT QUESTIONS.

1. **Consent** — the maintainer's to give, and given. Settled.

2. **What the business may publish** — not settled by consent. Iranian
   advertising rules cover implied medical results, and a customer's permission
   to be quoted does not make the business's use of a medical claim compliant.
   Records flagged `medical_appearance_claim`, `injectable_reference`,
   `third_party_claim` or `third_party_reference` are therefore HELD, each with
   the reason in the row, for the maintainer to decide one at a time. See `E-3`.

The display quote is trimmed from the transcription: greetings, sign-offs,
emoji and elongated letters removed, the person's own sentence kept, their
meaning unchanged. The full transcription stays beside it, so what was edited is
always visible.
"""

import io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = os.path.join(ROOT, "content", "testimonials")
DEST = os.path.join(SOURCE, "curated-2026-08-26.json")

CONSENT_SOURCE = "owner_confirmation_2026-08-26"

# A flag that makes a record the maintainer's decision rather than mine.
HOLDING_FLAGS = {
    "medical_appearance_claim": "describes a medical or structural change to the skin",
    "injectable_reference": "mentions an injectable procedure",
    "third_party_claim": "makes a claim on behalf of people who did not consent",
    "third_party_reference": "names another person who did not consent",
}

# id -> (role, display quote). Trimmed by hand from the transcription.
CURATED = {
    "testimonial-fa-001": ("client", "خواستم بگم حال پوستم خیلی خوب شده؛ تمیز و انگار آب رفته زیر پوستم."),
    "testimonial-fa-002": ("student", "فوق‌العاده عالی و پربار بود. سپاس از لطف و محبتتان."),
    "testimonial-fa-003": ("student", "ورکشاپ امروز فوق‌العاده پربار بود. ممنونم بابت زحمات و وقتی که در اختیارمان گذاشتید."),
    "testimonial-fa-004": ("client", "تایم‌ماشین که برایم انجام دادید آن‌قدر روی پوستم جواب داده که همکارانم می‌پرسیدند چه کار کرده‌ام."),
    "testimonial-fa-005": ("client", "دیروز پرنسس انجام دادم؛ امروز پوستم یک درجه روشن‌تر و نرم‌تر شده."),
    "testimonial-fa-007": ("client", "دفعهٔ اول بود این خدمات را می‌گرفتم و با تمام دفعات قبل فرق داشت. تفاوت پیش و پس از کار را کاملاً حس کردم."),
    "testimonial-fa-008": ("client", "من که وسواسی هستم، این چند سال خیالم راحت است. شما کوه تجربه و دانش هستید."),
    "testimonial-fa-009": ("client", "دوستانی که یکی دو ماه من را ندیده بودند گفتند پوستت جوان‌تر شده و روی بینی‌ات خیلی تمیزتر است."),
    "testimonial-fa-010": ("client", "آن فیشیال و ماساژش چقدر به من چسبید؛ فکر کنم نیم‌ساعتی خوابم برد."),
    "testimonial-fa-012": ("client", "کاملاً حرفه‌ای، کاردرست و پر از عشق. افتخارم است که مراقبت پوستم را در چنین محیطی انجام می‌دهم."),
    "testimonial-fa-013": ("client", "برای مراقبت از پوست خودم به یک بیوتی‌تراپیست حرفه‌ای نیاز دارم و در این زمینه تا حالا کسی را بهتر ندیده‌ام."),
    "testimonial-fa-014": ("peer", "حرفه‌ای در کار و در اخلاق. به شما افتخار می‌کنم."),
    "testimonial-fa-015": ("peer", "اصالت، دانش، فروتنی، نظم و حرفه‌ای بودن، همه یکجا."),
    "testimonial-fa-016": ("client", "تجربهٔ یک فیشیال بی‌نظیر. انرژی مثبت خودتان و فضایتان فوق‌العاده است."),
    "testimonial-fa-017": ("client", "دو جلسه فیشیال آمدم و صورتم بهتر شده. بی‌صبرانه منتظر جلسه‌های بعدی‌ام."),
    "testimonial-fa-019": ("student", "دیدم نسبت به پوست و هوم‌کر عوض شد. با صبر و حوصله و مشاورهٔ خوبتان با محصولاتی که باید استفاده می‌کردم آشنا شدم."),
    "testimonial-fa-020": ("client", "بدون اغراق بهترین فیشیال را تجربه کردم؛ فضای زیبا، مشاورهٔ کامل، و از همه مهم‌تر آرامشی که گرفتم."),
    "testimonial-fa-022": ("client", "با اطمینان درمان پوستم را با شما شروع کردم و قطعاً ادامه می‌دهم. صبورانه وقت گذاشتید و من را شنیدید."),
    "testimonial-fa-024": ("peer", "نهایت خوش‌انرژی."),
    "testimonial-fa-025": ("client", "در این سه جلسه پوستم آن‌قدر تغییر کرده که باورم نمی‌شود؛ چند وقت است دیگر آرایش نمی‌کنم."),
    "testimonial-fa-027": ("client", "به کلاینت‌ها اهمیت می‌دهید و برای متریال خساست به خرج نمی‌دهید. فهمیدم فالوور زیاد داشتن کیفیت نمی‌آورد."),
    "testimonial-fa-030": ("client", "همیشه بهترین‌ها را برایم انتخاب می‌کنند و خیلی هم وقت می‌گذارند."),
    "testimonial-fa-031": ("peer", "برندهایی که با آن‌ها کار می‌کنید بهترین‌اند، چون با دانش و تجربهٔ چندین‌سالهٔ شما انتخاب می‌شوند."),
    "testimonial-fa-032": ("client", "اول ترسیدم، ولی از بعدازظهر رنگ صورتم باز و صاف شد و منافذ کوچک. صبح که بلند شدم بهتر هم شده بود."),
    "testimonial-fa-035": ("client", "دو سه روز اول پوسته‌ریزی داشتم و نگران بودم، ولی الان فوق‌العاده‌ام. از قبل گفته بودید که همین می‌شود."),
    "testimonial-fa-036": ("client", "عالی‌ترین مشاوره‌ای که داشتم."),
    "testimonial-fa-037": ("client", "با دقت و حوصله بهترین مشاوره را به من دادید."),
    "testimonial-fa-038": ("peer", "یک‌بار ملاقاتتان کردم و همان یک‌بار کافی بود تا منش درست و نیت خوبتان را بفهمم."),
    "testimonial-fa-039": ("client", "از پوستم خیلی راضی‌ام. جلوی آینه می‌روم و کیف می‌کنم."),
    "testimonial-fa-040": ("client", "همان‌طور که گفته بودید دو سه روز پوسته‌ریزی داشتم. الان خوب شده و از پوستم راضی‌ام."),
    "testimonial-fa-041": ("client", "ممنونم که حال پوستم را به بهترین حالت ممکن تغییر دادید."),
    "testimonial-fa-042": ("client", "ماساژ صورتتان و دانشتان در انتخاب محصول، یکی از بهترین لذت‌های دنیاست."),
    "testimonial-fa-043": ("client", "ندیدم کسی برای مشاورهٔ رایگان این‌قدر وقت بگذارد و این‌قدر کامل توضیح بدهد."),
}

# Consent is not the only reason a record does not run. These are editorial:
# warm, real, and not about the work. Recorded rather than silently dropped, so
# the reconciliation still adds up to 43.
EXCLUDED = {
    "testimonial-fa-011": "affectionate aside about the presenter rather than the work",
}

ROLE_LABEL = {
    "client": {"fa": "مراجعه‌کننده", "en": "Client"},
    "student": {"fa": "هنرجو", "en": "Student"},
    "peer": {"fa": "همکار", "en": "Colleague"},
}


def load_records():
    records = []
    for name in sorted(os.listdir(SOURCE)):
        if "pass" not in name or not name.endswith(".json"):
            continue
        with io.open(os.path.join(SOURCE, name), encoding="utf-8") as handle:
            batch = json.load(handle)
        for record in batch["records"]:
            record["_batch"] = batch["batchId"]
            records.append(record)
    return records


def main():
    records = load_records()
    errors, out, seen = [], [], set()

    for record in records:
        identifier = record["id"]
        if identifier in seen:
            errors.append("duplicate id %s" % identifier)
        seen.add(identifier)

        flags = set(record.get("safetyFlags") or [])
        holding = sorted(flags & set(HOLDING_FLAGS))
        curated = CURATED.get(identifier)

        if holding and curated:
            errors.append("%s is held but has a display quote" % identifier)
        excluded = EXCLUDED.get(identifier)
        if not holding and not curated and not excluded:
            errors.append("%s has no display quote and no reason to be held" % identifier)
        if excluded and curated:
            errors.append("%s is excluded but has a display quote" % identifier)

        entry = {
            "id": identifier,
            "batchId": record["_batch"],
            "role": curated[0] if curated else None,
            "roleLabel": ROLE_LABEL[curated[0]] if curated else None,
            "displayQuoteFa": curated[1] if curated else None,
            "transcriptionFa": record.get("transcriptionFa"),
            "safetyFlags": sorted(flags),
            # The maintainer's assertion, attributed rather than assumed.
            "publicationConsent": "granted",
            "consentSource": CONSENT_SOURCE,
            "disposition": "publish" if curated else "hold",
            "holdReason": (
                "; ".join(HOLDING_FLAGS[flag] for flag in holding)
                if holding
                else excluded
            ),
        }
        out.append(entry)

    if errors:
        print("CURATION ERRORS:")
        for error in errors:
            print(" -", error)
        sys.exit(1)

    published = [entry for entry in out if entry["disposition"] == "publish"]
    with io.open(DEST, "w", encoding="utf-8") as handle:
        json.dump(
            {
                "$comment": "Hand-curated from the transcription passes. Consent is the maintainer's confirmation of 2026-08-26, recorded per record. Held records are an advertising-rules question, not a consent question — see E-3.",
                "consentSource": CONSENT_SOURCE,
                "reconciliation": {
                    "transcribed": len(out),
                    "published": len(published),
                    "held": len(out) - len(published),
                },
                "records": out,
            },
            handle,
            ensure_ascii=False,
            indent=2,
        )
        handle.write("\n")

    print(
        "transcribed=%d published=%d held=%d"
        % (len(out), len(published), len(out) - len(published))
    )


if __name__ == "__main__":
    main()
