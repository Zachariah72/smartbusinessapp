import type { NormalizedRow } from "./normalizer";

const score = (n: number) => Math.max(0, Math.min(1, Number(n.toFixed(2))));

export const classifier = {
  classifyDirection: (row: NormalizedRow): "IN" | "OUT" | "UNKNOWN" => {
    if (row.amountIn > 0 && row.amountOut === 0) return "IN";
    if (row.amountOut > 0 && row.amountIn === 0) return "OUT";

    const lower = row.rawText.toLowerCase();
    if (/(received from|payment received|you received|credit)/.test(lower)) return "IN";
    if (/(paid to|you sent|cash paid|debit|expense)/.test(lower)) return "OUT";
    return "UNKNOWN";
  },
  entityRisk: (confidence: number): "Trusted" | "Needs Review" | "Risky" => {
    if (confidence >= 0.85) return "Trusted";
    if (confidence >= 0.6) return "Needs Review";
    return "Risky";
  },
  confidenceForTransaction: (row: NormalizedRow): number => {
    let conf = 0.45;
    if (row.amountIn > 0 || row.amountOut > 0) conf += 0.25;
    if (row.reference !== "N/A") conf += 0.1;
    if (row.channel) conf += 0.1;
    if (row.date) conf += 0.1;
    return score(conf);
  },
  confidenceForProduct: (row: NormalizedRow): number => {
    let conf = 0.35;
    if (row.product) conf += 0.25;
    if (row.quantity > 0) conf += 0.2;
    if (row.unitCost > 0) conf += 0.2;
    return score(conf);
  },
  confidenceForClient: (row: NormalizedRow): number => {
    let conf = 0.35;
    if (row.client) conf += 0.25;
    if (row.phone) conf += 0.15;
    if (row.amountIn > 0) conf += 0.2;
    return score(conf);
  },
  confidenceForSupplier: (row: NormalizedRow): number => {
    let conf = 0.35;
    if (row.supplier) conf += 0.25;
    if (row.amountOut > 0 || row.unitCost > 0) conf += 0.2;
    if (/supplier|vendor|restock|stock/i.test(row.rawText)) conf += 0.15;
    return score(conf);
  },
};
