import { extname } from "node:path";

export interface ParsedDocument {
  headers: string[];
  rows: Array<Record<string, string>>;
  rawText: string;
}

const parseDelimited = (text: string, delimiter: "," | "\t") => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
};

const rowsFromLooseText = (text: string) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const headers = ["description"];
  const rows = lines.map((line) => ({ description: line }));
  return { headers, rows };
};

const parseJson = (text: string): ParsedDocument => {
  const parsed = JSON.parse(text) as unknown;
  const array = Array.isArray(parsed)
    ? parsed
    : (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown[] }).rows))
      ? (parsed as { rows: unknown[] }).rows
      : [];

  const objects = array.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object");
  if (objects.length === 0) return { headers: [], rows: [], rawText: text };

  const headers = [...new Set(objects.flatMap((row) => Object.keys(row)))];
  const rows = objects.map((row) => {
    const normalized: Record<string, string> = {};
    headers.forEach((header) => {
      normalized[header] = String(row[header] ?? "").trim();
    });
    return normalized;
  });

  return { headers, rows, rawText: text };
};

const importRuntime = (specifier: string) => (new Function("s", "return import(s)")(specifier)) as Promise<unknown>;

export const fileParser = {
  parseFromText: async (fileName: string, content: string): Promise<ParsedDocument> => {
    const ext = extname(fileName).toLowerCase();
    if (ext === ".json") return parseJson(content);
    if (ext === ".tsv" || ext === ".txt") {
      const parsed = parseDelimited(content, "\t");
      if (parsed.rows.length > 0) return { ...parsed, rawText: content };
      return { ...rowsFromLooseText(content), rawText: content };
    }
    if (ext === ".csv") {
      const parsed = parseDelimited(content, ",");
      if (parsed.rows.length > 0) return { ...parsed, rawText: content };
      return { ...rowsFromLooseText(content), rawText: content };
    }
    if (ext === ".xlsx" || ext === ".xls") {
      try {
        const xlsx = await importRuntime("xlsx") as {
          read: (input: string, options: { type: "binary" }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
          utils: {
            sheet_to_json: (sheet: unknown, options: { defval: string }) => Array<Record<string, unknown>>;
          };
        };
        const wb = xlsx.read(content, { type: "binary" });
        const first = wb.SheetNames[0];
        if (!first) return { headers: [], rows: [], rawText: content };
        const records = xlsx.utils.sheet_to_json(wb.Sheets[first], { defval: "" });
        const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
        const rows = records.map((r) => {
          const row: Record<string, string> = {};
          headers.forEach((h) => {
            row[h] = String(r[h] ?? "").trim();
          });
          return row;
        });
        return { headers, rows, rawText: content };
      } catch {
        return { ...rowsFromLooseText(content), rawText: content };
      }
    }
    return { ...rowsFromLooseText(content), rawText: content };
  },
};
