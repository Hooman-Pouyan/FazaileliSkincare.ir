# Paperwork playbook — what to start now, in what order

**For:** Mahdieh Fazaieli institute (registered company) · **Date:** 2026-08-24
**Purpose:** the non-technical track, runnable in parallel with development. Nothing here needs a developer.

> **The premise.** Code is not what will delay this launch. Approvals are. Every week you spend on paperwork now is a week the site isn't sitting finished and unable to take money. Start step 1 this week.
>
> **And the good news:** because we're building **direct bank transfer as a first-class payment method** (see ADR-002), you can launch and take real orders *before* any of this completes. The paperwork upgrades you from a working shop to a smoother one — it is no longer a hard gate. That changes this from a blocker into a background task.

---

## The sequence, and why it's this order

```
  ① Company documents        →  you already have these; just gather them
        ↓
  ② Business licence         →  مجوز کسب‌وکار اینترنتی, via the national permits portal
     (if your activity needs one)
        ↓
  ③ Domain + hosting live    →  a real site on an Iranian host, with the
                                required pages visible
        ↓
  ④ eNamad  ⇄  ZarinPal      →  these two interlock; see the note below
        ↓
  ⑤ Tax / سامانه مودیان      →  once you're issuing invoices
```

**The interlock at step ④ is the part people get stuck on.** Some ZarinPal tiers ask for eNamad; eNamad's own checklist mentions an active payment gateway. The practical resolution is that ZarinPal's entry-level gateway can generally be opened first and upgraded later — but **do not take my word for the current rule.** Open a ZarinPal support ticket in week one and ask them plainly: *"I have a registered company and no eNamad yet. What is the fastest path to an active gateway, and what do you need from me?"* Their answer, this month, beats any guide including this one.

---

## Step 1 · Gather the company file — this week

For a **شخصیت حقوقی** (registered company) you will be asked for, repeatedly, across every one of the steps below:

- [ ] آگهی تأسیس / روزنامه رسمی — the official gazette announcement of incorporation
- [ ] اساسنامه — the company bylaws
- [ ] Latest آگهی تغییرات for **address**, **board members**, and **scope of activity**
- [ ] شناسه ملی شرکت and کد اقتصادی
- [ ] The manager's کارت ملی and شناسنامه
- [ ] A **company bank account** (see the warning in step 4b)
- [ ] Any صنفی or professional licence the institute already holds
- [ ] Mahdieh's teaching credential (مدرس رسمی فنی و حرفه‌ای) — not required for these steps, but it belongs in the same folder for the website's credentials section

**Do this once, scan everything at good quality, put it in one folder.** You will upload the same six files four times. Doing it properly now saves a week of hunting later.

---

## Step 2 · Business licence — start immediately if it applies

Online businesses in Iran are generally expected to hold a **مجوز کسب‌وکار** obtained through the national permits portal (درگاه ملی مجوزهای کشور). Whether your specific activity — retail of cosmetic products plus a training institute — requires one, and which صنف it falls under, is worth **one phone call to your accountant or a اتحادیه کسب‌وکارهای مجازی** rather than guessing.

Ask them exactly: *"For an institute that sells imported cosmetic products online and runs training workshops, which permit category applies, and do I need it before eNamad?"*

If it applies, it has the longest lead time of anything on this page. Start it first.

---

## Step 3 · Get a real site live on an Iranian host

eNamad will not certify a domain that doesn't resolve to a working Iranian-hosted site with the required content visible. That means the **landing page has to ship before the shop**, which is exactly what the Phase 1 plan does.

The site must show, before you apply:

- [ ] Full business name and address, matching the company documents exactly
- [ ] A landline phone number — **this trips people up**; a mobile number alone is often not accepted
- [ ] Working contact email on the domain (`info@fazaieli.ir`, not a Gmail address)
- [ ] قوانین و مقررات — terms of service
- [ ] حریم خصوصی — privacy policy
- [ ] شرایط مرجوعی و بازگشت وجه — returns and refunds policy
- [ ] Clear pricing and shipping information

Domain registration must be **in the company's name** at IRNIC, and the eNamad process verifies technical control of the domain via an emailed code, so you need working email on it.

> These pages are yours to write, not mine to invent — they're legal commitments about your returns window, your delivery times and your data handling. I can draft them from your answers, but the terms have to be decisions you actually make.

---

## Step 4a · eNamad (نماد اعتماد الکترونیکی)

**Cost:** around **175,000 تومان for two years.** **Automated processing:** under a business day; document review is what actually takes time.

1. Go to **enamad.ir** and log in via **«ورود از طریق دولت من»** — the government identity system. Identity is verified through my.gov.ir, phone, national ID, birth date and registered postal code, so make sure the manager's civil-registry details are current.
2. **«ایجاد کسب‌وکار جدید»** → enter company details, domain, business name.
3. **Verify domain control** — a code is emailed to your domain address.
4. Choose activity classification and sales method (مستقیم / غیرمستقیم / هردو).
5. Confirm contact details and business hours.
6. Upload the company file from step 1.
7. Accept the commitments, pay, receive the code.
8. **Place the code in the site footer** — a five-minute developer task; tell me when you have it.

Star ratings reflect security and responsiveness standards. One star is plenty to launch; don't let chasing more of them hold anything up.

---

## Step 4b · Payment — two tracks in parallel

### Track A — bank transfer, live from day one

This is what lets you launch without waiting for anyone. Concretely, you need:

- [ ] A **company bank account** (حساب تجاری), with its **شبا** and card number
- [ ] Access to online statements for that account, so orders can be matched daily
- [ ] A person who checks it — this is the one recurring operational cost of launching this way

> ⚠️ **Use the company account, not a personal one.** Sustained card-to-card volume into a personal account is a well-known tax flag in Iran, and it will complicate step 5 rather than avoid it. Ask your accountant to confirm the right account type before the first order, not after the hundredth.

**How the site will make this workable:** each order gets a slightly unique expected amount (a few hundred toman added), so a transfer matches exactly one order in your bank statement at a glance. The customer submits their tracking number and the last four digits of their card. **A customer-uploaded receipt image is a claim, not proof — only a staff member matching the actual bank statement confirms an order.** Stock stays reserved, not sold, until then.

### Track B — ZarinPal, started the same week

1. Register at zarinpal.com with the company details.
2. Complete identity verification (احراز هویت).
3. Create a gateway for `fazaieli.ir`.
4. **Open a support ticket asking the interlock question above.**
5. Add the merchant ID to the site when it lands — a ten-minute change, because the gateway sits behind an interface.

Once ZarinPal is live and settled, ask about a **direct bank PSP** (سداد / به‌پرداخت / سامان). Lower fees, more credibility, more paperwork — a good problem for month four, not month one.

---

## Step 5 · Tax and electronic invoicing (سامانه مودیان)

Iran's Taxpayer System requires many businesses to issue **electronic invoices** through it, with real penalties for non-compliance, and the scope has been widening year by year.

**You have a registered company, so you should assume this applies until your accountant tells you otherwise.** The question to ask them, specifically:

> *"For our company, are we currently obliged to issue صورتحساب الکترونیکی through سامانه مودیان? If so, from what date, and do we need a معتمد مالیاتی or can we submit directly?"*

**Why the answer matters before the first order rather than after:** if it applies, invoice numbering, the شناسه یکتا on each invoice, and the customer data captured at checkout all have to be right from order number one. Retrofitting compliant invoicing onto a live order table is genuinely painful. Getting a "no, not yet" is also a perfectly good outcome — it just needs to be a known answer rather than an assumption.

---

## Deferred, but don't forget

- **IRC codes** (کد IRC) and **authenticity labels** (برچسب اصالت) for the imported products. You've set this aside for now — noted. When you come back to it: for imported Japanese and Korean skincare, counterfeiting is the category's single biggest customer objection, and a verifiable code on the product page turns your biggest objection into your strongest differentiator. The product page will be built with slots for it so nothing needs a schema change later.
- **ساماندهی** — check whether it applies once the site publishes content.
- **SMS provider** — Kavenegar or SMS.ir need a company registration and an approved sender line. Lead time of days, not weeks, but start it before Phase 2.

---

## The one-page version

| When | Do this | Blocked by |
|---|---|---|
| **This week** | Gather the company file · ask the accountant the two questions (permit category, tax obligation) · open the company bank account if it doesn't exist | Nothing |
| **This week** | Register at ZarinPal, open the support ticket | Company file |
| **Weeks 1–3** | Business licence, if it applies | Accountant's answer |
| **When the landing page ships** | Apply for eNamad | Live site + required pages |
| **Before the first order** | Confirm the tax answer; company account ready for transfers | Accountant |
| **Month 3–4** | Bank PSP, IRC codes, extra eNamad stars | Everything above |

**The two phone calls that unblock the most: your accountant, and ZarinPal support.** Both can happen tomorrow, and between them they resolve most of what's genuinely uncertain on this page.

> I'm a developer, not your accountant or lawyer. Everything here is drawn from public guidance and should be confirmed with someone who carries professional responsibility for the answer — particularly steps 2 and 5, where the rules change and penalties are real.
