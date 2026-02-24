export const confidenceEngine = {
  toRisk: (score: number): "Trusted" | "Needs Review" | "Risky" => {
    if (score >= 0.85) return "Trusted";
    if (score >= 0.6) return "Needs Review";
    return "Risky";
  },
};
