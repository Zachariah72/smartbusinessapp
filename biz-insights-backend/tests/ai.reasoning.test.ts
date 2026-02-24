import { describe, expect, it } from "vitest";
import { confidenceEngine } from "../ai/confidence.engine";

describe("confidence engine", () => {
  it("maps high confidence to trusted", () => {
    expect(confidenceEngine.toRisk(0.9)).toBe("Trusted");
  });
});
