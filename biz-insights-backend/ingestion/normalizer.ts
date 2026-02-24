const normalizeHeader = (value: string) => value.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();

const aliases: Record<string, string[]> = {
  date: ["date", "transaction date", "value date"],
  amountIn: ["cash in", "amount in", "revenue", "sales", "received", "credit"],
  amountOut: ["cash out", "amount out", "expense", "cost", "debit", "paid"],
  description: ["description", "details", "narration", "type"],
  reference: ["reference", "reference code", "transaction id", "mpesa code"],
  channel: ["channel", "payment mode", "payment method", "mode of payment"],
  product: ["product", "item", "product name"],
  quantity: ["qty", "quantity", "units"],
  unitCost: ["unit price", "unit cost", "buying price", "price"],
  client: ["client", "customer", "buyer", "received from"],
  supplier: ["supplier", "vendor", "paid to", "merchant"],
  phone: ["phone", "mobile", "contact"],
};

const findHeader = (headers: string[], key: keyof typeof aliases) => {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases[key]) {
    const aliasNorm = normalizeHeader(alias);
    const idx = normalized.findIndex((h) => h === aliasNorm || h.includes(aliasNorm) || aliasNorm.includes(h));
    if (idx >= 0) return headers[idx];
  }
  return "";
};

const amount = (raw: string) => {
  const parsed = Number(String(raw ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
};

export interface NormalizedRow {
  date: string;
  amountIn: number;
  amountOut: number;
  description: string;
  reference: string;
  channel: string;
  product: string;
  quantity: number;
  unitCost: number;
  client: string;
  supplier: string;
  phone: string;
  rawText: string;
}

const channelOf = (value: string) => {
  const lower = value.toLowerCase();
  if (/cash/.test(lower)) return "Cash";
  if (/bank|card|cheque/.test(lower)) return "Bank";
  if (/mpesa|m-pesa|mobile|transfer|paybill|pochi|till|wallet/.test(lower)) return "Mobile Transfer";
  return "Mobile Transfer";
};

export const normalizer = {
  normalizeRows: (rows: Array<Record<string, string>>): NormalizedRow[] => {
    if (rows.length === 0) return [];
    const headers = Object.keys(rows[0]);

    const dateH = findHeader(headers, "date");
    const inH = findHeader(headers, "amountIn");
    const outH = findHeader(headers, "amountOut");
    const descH = findHeader(headers, "description");
    const refH = findHeader(headers, "reference");
    const chH = findHeader(headers, "channel");
    const pH = findHeader(headers, "product");
    const qH = findHeader(headers, "quantity");
    const uH = findHeader(headers, "unitCost");
    const cH = findHeader(headers, "client");
    const sH = findHeader(headers, "supplier");
    const phoneH = findHeader(headers, "phone");

    return rows.map((row) => {
      const rawText = Object.values(row).join(" ").trim();
      return {
        date: row[dateH] || new Date().toISOString().slice(0, 10),
        amountIn: amount(row[inH] || ""),
        amountOut: amount(row[outH] || ""),
        description: row[descH] || rawText,
        reference: row[refH] || "N/A",
        channel: channelOf(row[chH] || rawText),
        product: row[pH] || "",
        quantity: Math.round(amount(row[qH] || "")),
        unitCost: amount(row[uH] || ""),
        client: row[cH] || "",
        supplier: row[sH] || "",
        phone: row[phoneH] || "",
        rawText,
      };
    });
  },
};
