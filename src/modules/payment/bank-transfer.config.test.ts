import { describe, expect, it } from "vitest";
import { bankAccount } from "./bank-transfer.config";

const complete = {
  BANK_TRANSFER_HOLDER: "مهدیه فاضلی",
  BANK_TRANSFER_BANK: "بانک ملت",
  BANK_TRANSFER_CARD: "6104-3378-1234-5678",
  BANK_TRANSFER_IBAN: "IR820540102680020817909002",
};

describe("bankAccount", () => {
  it("reads a complete account and normalises the card", () => {
    expect(bankAccount(complete)).toMatchObject({
      holder: "مهدیه فاضلی",
      card: "6104337812345678",
      iban: "IR820540102680020817909002",
    });
  });

  it("is absent when nothing is configured", () => {
    // The state this ships in. The screen must say so, not invent an account.
    expect(bankAccount({})).toBeNull();
  });

  it("is absent when only part is configured", () => {
    // Half a card number on a payment instruction is worse than none.
    const { BANK_TRANSFER_CARD: _card, ...partial } = complete;
    expect(bankAccount(partial)).toBeNull();
  });

  it("refuses a card that is not sixteen digits", () => {
    expect(
      bankAccount({ ...complete, BANK_TRANSFER_CARD: "12345" }),
    ).toBeNull();
  });

  it("refuses an IBAN that is not IR plus twenty-four digits", () => {
    expect(
      bankAccount({ ...complete, BANK_TRANSFER_IBAN: "GB29NWBK" }),
    ).toBeNull();
  });

  it("works without the optional IBAN", () => {
    const { BANK_TRANSFER_IBAN: _iban, ...noIban } = complete;
    expect(bankAccount(noIban)).toMatchObject({ card: "6104337812345678" });
  });
});
