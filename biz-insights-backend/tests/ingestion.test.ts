import { describe, expect, it } from "vitest";
import { classifier } from "../ingestion/classifier";

describe("ingestion classifier", () => {
  it("detects cash out", () => {
    expect(classifier.classifyDirection({
      date: "2026-02-24",
      amountIn: 0,
      amountOut: 200,
      description: "Paid to supplier",
      reference: "N/A",
      channel: "Cash",
      product: "",
      quantity: 0,
      unitCost: 0,
      client: "",
      supplier: "Supplier A",
      phone: "",
      rawText: "Paid to supplier",
    })).toBe("OUT");
  });
});
