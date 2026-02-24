import { describe, expect, it } from "vitest";
import { validateLedgerEntry } from "../ledger/ledger.validator";

describe("ledger validator", () => {
  it("rejects missing fields", () => {
    const result = validateLedgerEntry({
      id: "1",
      businessId: "",
      date: "",
      type: "IN",
      amount: 0,
      source: "file",
      traceKey: "",
    });
    expect(result.length).toBeGreaterThan(0);
  });
});
