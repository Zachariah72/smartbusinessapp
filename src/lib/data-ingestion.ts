export type LedgerType = "IN" | "OUT";

export interface LedgerEntry {
  id: string;
  date: string;
  type: LedgerType;
  amount: number;
  source: "file" | "pos" | "wallet" | "bank";
  reference: string;
  fileId: string;
  rowNumber: number;
  traceKey: string;
  category?: string;
  transactionCost?: number;
  referenceCode?: string;
  paymentMode?: string;
  paymentChannel?: string;
}

export interface NormalizedTransaction {
  id: string;
  date: string;
  recordedAt: string;
  cashIn: number;
  cashOut: number;
  orders: number;
  source: "file_upload";
  fileId: string;
  rowNumber: number;
  reference: string;
  description?: string;
  category?: string;
  traceKey: string;
  transactionCost: number;
  referenceCode: string;
  paymentMode: string;
  paymentChannel: string;
}

export interface ParseErrorItem {
  rowNumber: number;
  message: string;
}

export interface ParseWarningItem {
  rowNumber: number;
  message: string;
}

export type EntityRisk = "Trusted" | "Needs Review" | "Risky";

interface RoutedEntityBase {
  id: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: EntityRisk;
  traceKey: string;
}

export interface RoutedProduct extends RoutedEntityBase {
  name: string;
  quantity: number;
  unitCost: number;
  supplier: string;
}

export interface RoutedClient extends RoutedEntityBase {
  name: string;
  phone: string;
  totalSpent: number;
  firstSeen: string;
}

export interface RoutedSupplier extends RoutedEntityBase {
  name: string;
  lastPrice: number;
  categoryHint: string;
}

export interface IngestionOutcome {
  normalizedTransactions: NormalizedTransaction[];
  ledgerEntries: LedgerEntry[];
  products: RoutedProduct[];
  clients: RoutedClient[];
  suppliers: RoutedSupplier[];
  duplicatesSkipped: number;
  invalidRows: ParseErrorItem[];
  warnings: ParseWarningItem[];
  suggestions: string[];
}

type RowValue = string | number | null | undefined;
type RawRecord = Record<string, RowValue>;

const REQUIRED_SIGNAL_GROUPS = {
  date: ["date", "transaction date", "value date"],
  cashIn: ["cash in", "cash_in", "amount in", "sales", "revenue", "credit", "received from", "inflow"],
  cashOut: ["cash out", "cash_out", "amount out", "expense", "expenses", "cost", "debit", "paid to", "outflow"],
  orders: ["orders", "order count", "qty orders", "transactions"],
  description: ["description", "details", "narration", "transaction type", "type", "notes"],
  category: ["category", "expense category", "tag"],
  transactionCost: ["transaction cost", "charges", "charge", "fee", "cost"],
  referenceCode: ["reference code", "reference", "mpesa code", "receipt no", "transaction id", "trans id", "code"],
  paymentMode: ["mode of payment", "payment mode", "payment method", "method", "mode"],
  paymentChannel: ["payment channel", "channel", "account type", "mpesa type"],
  productName: ["product", "item", "product name", "stock item", "goods"],
  quantity: ["qty", "quantity", "units", "pieces"],
  unitCost: ["unit price", "unit cost", "price", "cost per unit", "buying price"],
  clientName: ["customer", "client", "buyer", "paid by", "received from"],
  supplierName: ["supplier", "vendor", "paid to", "merchant"],
  phone: ["phone", "mobile", "msisdn", "contact"],
} as const;

const SAFE_CURRENCY_CHARS = /[^0-9.-]/g;
const MPESA_INBOUND_HINTS = ["received from", "customer payment", "deposit", "cash sale"];
const MPESA_OUTBOUND_HINTS = ["paid to", "withdraw", "withdrawal", "airtime", "send money", "supplier", "rent", "utility", "stock purchase", "inventory", "restock"];
const MPESA_REF_REGEX = /\b[A-Z0-9]{8,12}\b/;
const OUTBOUND_KEYWORDS = ["paid", "expense", "cost", "rent", "withdraw", "debit", "send", "purchase", "transport", "airtime", "out"];
const INBOUND_KEYWORDS = ["sale", "sold", "received", "income", "credit", "payment", "in"];
const MONEY_KEYWORDS = ["kes", "ksh", "mpesa", "m-pesa", "paybill", "pochi", "till", "paid", "received", "sale", "sold", "expense", "credit", "debit", "fee", "charge"];
const PDF_NOISE_PATTERNS = [
  "%pdf", "obj", "endobj", "stream", "endstream", "xref", "trailer", "startxref",
  "/font", "/length", "/type", "/id", "/root", "flatedecode", "fontbbox", "italicangle", "capheight",
];
const OCR_ABBREVIATIONS: Record<string, string> = {
  "amt": "amount",
  "amnt": "amount",
  "pd": "paid",
  "pd to": "paid to",
  "rcvd": "received",
  "rcv": "received",
  "bal": "balance",
  "cr": "credit",
  "dr": "debit",
  "dep": "deposit",
  "mpesa": "m-pesa",
  "m pesa": "m-pesa",
  "till no": "till",
  "pb": "paybill",
};

const normalizeHeader = (header: string) =>
  header
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseAmount = (value: RowValue): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const cleaned = raw.replace(SAFE_CURRENCY_CHARS, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDateIso = (value: RowValue): string | null => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const date = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const parseCsvText = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      currentCell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      currentRow.push(currentCell.trim());
      currentCell = "";
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);

  return rows;
};

const parseSpreadsheetXmlText = (xmlText: string): string[][] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const rowNodes = Array.from(doc.querySelectorAll("Row, row"));
  return rowNodes.map((rowNode) => {
    const cells = Array.from(rowNode.querySelectorAll("Cell, c"));
    return cells.map((cell) => {
      const dataNode = cell.querySelector("Data, v, is t") ?? cell;
      return (dataNode.textContent ?? "").trim();
    });
  }).filter((row) => row.some((cell) => cell.length > 0));
};

const findColumn = (headers: string[], aliases: readonly string[]) => {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const aliasNorm = normalizeHeader(alias);
    const exactIdx = normalizedHeaders.findIndex((h) => h === aliasNorm);
    if (exactIdx >= 0) return exactIdx;
  }
  for (const alias of aliases) {
    const aliasNorm = normalizeHeader(alias);
    const containsIdx = normalizedHeaders.findIndex((h) => h.includes(aliasNorm) || aliasNorm.includes(h));
    if (containsIdx >= 0) return containsIdx;
  }
  return -1;
};

const suggestColumns = (headers: string[], aliases: readonly string[]) => {
  const suggestions = headers.filter((header) => {
    const normalized = normalizeHeader(header);
    return aliases.some((alias) => {
      const aliasNorm = normalizeHeader(alias);
      return normalized.includes(aliasNorm) || aliasNorm.includes(normalized);
    });
  });
  return suggestions;
};

const fileKindFromName = (fileName: string): "csv" | "xlsx" | "xls" | "pdf" | "image" | "text" | "unknown" => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "tsv" || ext === "txt" || ext === "json") return "text";
  if (ext === "xlsx") return "xlsx";
  if (ext === "xls") return "xls";
  if (ext === "pdf") return "pdf";
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") return "image";
  return "unknown";
};

const buildTraceKey = (date: string, cashIn: number, cashOut: number, orders: number, fileId: string, rowNumber: number) =>
  [date, cashIn.toFixed(2), cashOut.toFixed(2), orders, fileId, rowNumber].join("|");

const toSafeText = (value: RowValue) => String(value ?? "").trim();

const getModeFromText = (text: string) => {
  const value = text.toLowerCase();
  if (!value) return "Unknown";
  if (value.includes("mpesa") || value.includes("m-pesa") || value.includes("mobile money") || value.includes("pochi") || value.includes("paybill") || value.includes("till")) return "Mobile Transfer";
  if (value.includes("card") || value.includes("bank") || value.includes("cheque")) return "Bank";
  if (value.includes("cash")) return "Cash";
  return "Unknown";
};

const inferMpesaChannel = (raw: string) => {
  const value = raw.toLowerCase();
  if (value.includes("pochi")) return "Mobile Transfer";
  if (value.includes("paybill")) return "Mobile Transfer";
  if (value.includes("till") || value.includes("buy goods")) return "Mobile Transfer";
  if (value.includes("mpesa") || value.includes("m-pesa") || value.includes("wallet")) return "Mobile Transfer";
  if (value.includes("bank") || value.includes("card") || value.includes("cheque")) return "Bank";
  if (value.includes("cash")) return "Cash";
  return "";
};

const inferPaymentChannel = (paymentMode: string, paymentChannel: string, description: string) => {
  const explicit = inferMpesaChannel(paymentChannel);
  if (explicit) return explicit;
  const modeGuess = inferMpesaChannel(paymentMode);
  if (modeGuess) return modeGuess;
  const descriptionGuess = inferMpesaChannel(description);
  if (descriptionGuess) return descriptionGuess;
  if (paymentMode && paymentMode !== "Unknown") return paymentMode;
  return "Unknown";
};

const guessDirectionFromText = (text: string) => {
  const value = text.toLowerCase();
  if (OUTBOUND_KEYWORDS.some((word) => value.includes(word))) return "out";
  if (INBOUND_KEYWORDS.some((word) => value.includes(word))) return "in";
  return "in";
};

const clampConfidence = (value: number) => Math.max(0, Math.min(1, Number(value.toFixed(2))));

const confidenceToRisk = (confidence: number): EntityRisk => {
  if (confidence >= 0.85) return "Trusted";
  if (confidence >= 0.6) return "Needs Review";
  return "Risky";
};

const extractNamedEntity = (text: string, prefixes: string[]) => {
  const lower = text.toLowerCase();
  for (const prefix of prefixes) {
    const idx = lower.indexOf(prefix);
    if (idx < 0) continue;
    const candidate = text.slice(idx + prefix.length).split(/[,.]| on | at /i)[0]?.trim() ?? "";
    if (candidate && candidate.length >= 3) return candidate;
  }
  return "";
};

const normalizePersonOrBusiness = (value: string) => {
  const clean = value.replace(/[^\w\s.&'-]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (/^(kes|ksh|cash|bank|mobile|transfer)$/i.test(clean)) return "";
  return clean.slice(0, 80);
};

const normalizePhone = (value: string) => {
  const only = value.replace(/[^\d+]/g, "");
  if (/^\+?\d{9,15}$/.test(only)) return only;
  return "";
};

type XlsxGlobal = {
  read: (data: ArrayBuffer, options: { type: "array" }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
  utils: {
    sheet_to_json: (sheet: unknown, options: { header: 1; raw: false; defval: string }) => Array<Array<string | number>>;
  };
};

type TesseractGlobal = {
  recognize: (
    input: Blob | File | string,
    language: string,
    options?: Record<string, unknown>,
  ) => Promise<{ data?: { text?: string } }>;
};

declare global {
  interface Window {
    XLSX?: XlsxGlobal;
    Tesseract?: TesseractGlobal;
  }
}

const SCRIPT_CACHE = new Map<string, Promise<void>>();
const importRuntime = (specifier: string) => (new Function("s", "return import(s)")(specifier)) as Promise<unknown>;

const loadScript = (url: string) => {
  const cached = SCRIPT_CACHE.get(url);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });

  SCRIPT_CACHE.set(url, promise);
  return promise;
};

const amountMatches = (text: string) => {
  const matches = text.match(/(?:kes|ksh)?\s*[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?|[-+]?\d+(?:\.\d+)?/gi) ?? [];
  return matches
    .map((token) => {
      const normalized = token.replace(/(kes|ksh)/gi, "").replace(/,/g, "").trim();
      const value = Number(normalized);
      return Number.isFinite(value) ? value : null;
    })
    .filter((v): v is number => v !== null);
};

const readableAsciiRatio = (line: string) => {
  if (!line) return 0;
  let readable = 0;
  for (const char of line) {
    const code = char.charCodeAt(0);
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) readable += 1;
  }
  return readable / line.length;
};

const isMostlyReadable = (line: string) => {
  if (!line) return false;
  if (readableAsciiRatio(line) < 0.8) return false;
  if (/\b\d{7,}\s+\d{4,}\s+n\b/i.test(line)) return false;
  return true;
};

const isPdfNoiseLine = (line: string) => {
  const lower = line.toLowerCase();
  if (/^\d{6,}\s+\d{4,}\s+n$/.test(lower.trim())) return true;
  if (/^%pdf-\d\.\d/.test(lower.trim())) return true;
  if (/^\d+\s+\d+\s+obj$/.test(lower.trim())) return true;
  return PDF_NOISE_PATTERNS.some((token) => lower.includes(token));
};

const hasTransactionSignal = (line: string) => {
  const lower = line.toLowerCase();
  if (MONEY_KEYWORDS.some((keyword) => lower.includes(keyword))) return true;
  if (MPESA_REF_REGEX.test(line)) return true;
  if (/(kes|ksh)\s*\d/.test(lower)) return true;
  return false;
};

const determineCategory = (row: RawRecord, categoryIdx: number, description: string) => {
  if (categoryIdx >= 0) {
    const value = row[Object.keys(row)[categoryIdx]];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  const d = description.toLowerCase();
  if (d.includes("stock") || d.includes("inventory") || d.includes("restock")) return "Stock Purchase";
  if (d.includes("rent")) return "Rent";
  if (d.includes("utility") || d.includes("electric")) return "Utilities";
  return undefined;
};

const classifyFromDescription = (description: string, currentIn: number, currentOut: number) => {
  if (currentIn > 0 || currentOut > 0) return { cashIn: currentIn, cashOut: currentOut };
  const lower = description.toLowerCase();
  if (MPESA_INBOUND_HINTS.some((hint) => lower.includes(hint))) {
    return { cashIn: Math.abs(currentIn || currentOut), cashOut: 0 };
  }
  if (MPESA_OUTBOUND_HINTS.some((hint) => lower.includes(hint))) {
    return { cashIn: 0, cashOut: Math.abs(currentIn || currentOut) };
  }
  return { cashIn: currentIn, cashOut: currentOut };
};

export async function parseFileRows(file: File): Promise<{ headers: string[]; rows: RawRecord[] }> {
  const fileKind = fileKindFromName(file.name);
  if (fileKind === "unknown") {
    throw new Error(`Unsupported file type for ${file.name}. Use .csv, .tsv, .txt, .json, .xlsx, .xls, .pdf, .png, .jpg, .jpeg, or .webp.`);
  }

  let matrix: string[][] = [];
  let fallbackText = "";
  if (fileKind === "csv" || fileKind === "text") {
    const text = await file.text();
    if (!text.trim()) throw new Error(`${file.name} is empty.`);
    fallbackText = text;
    matrix = text.trim().startsWith("{") || text.trim().startsWith("[")
      ? matrixFromJsonText(text)
      : parseCsvText(text);
    if (matrix.length < 2) matrix = matrixFromExtractedText(text);
  } else if (fileKind === "xlsx" || fileKind === "xls") {
    const text = await file.text();
    if (!text.trim()) throw new Error(`${file.name} is empty.`);
    const looksLikeXml = text.includes("<Workbook") || text.includes("<worksheet") || text.includes("<?xml");
    matrix = looksLikeXml
      ? parseSpreadsheetXmlText(text)
      : await parseBinaryExcelWorkbook(file);
  } else if (fileKind === "pdf") {
    const extracted = await extractTextFromPdf(file);
    fallbackText = extracted;
    matrix = matrixFromExtractedText(extracted);
  } else if (fileKind === "image") {
    const extracted = await extractTextFromImage(file);
    fallbackText = extracted;
    matrix = matrixFromExtractedText(extracted);
  }

  if (matrix.length < 2) {
    const looseMatrix = matrixFromLooseTransactionText(fallbackText, { allowAmountOnly: fileKind === "image" });
    if (looseMatrix.length >= 2) matrix = looseMatrix;
  }
  if (isLowStructureMatrix(matrix)) {
    const looseMatrix = matrixFromLooseTransactionText(fallbackText, { allowAmountOnly: fileKind === "image" });
    if (looseMatrix.length >= 2) matrix = looseMatrix;
  }

  if (matrix.length < 2) {
    throw new Error(`${file.name} has no data rows.`);
  }

  const headers = matrix[0].map((h) => h.trim());
  const rows = matrix.slice(1)
    .map((cells) => {
      const record: RawRecord = {};
      headers.forEach((header, idx) => {
        record[header] = cells[idx] ?? "";
      });
      return record;
    })
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim().length > 0));

  if (rows.length === 0) {
    throw new Error(`${file.name} has only empty rows.`);
  }

  return { headers, rows };
}

function matrixFromJsonText(text: string): string[][] {
  try {
    const data = JSON.parse(text) as unknown;
    const rows = Array.isArray(data)
      ? data
      : Array.isArray((data as { transactions?: unknown[] })?.transactions)
        ? (data as { transactions: unknown[] }).transactions
        : [];
    if (rows.length === 0) return [];
    const objects = rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
    if (objects.length === 0) return [];
    const headers = [...new Set(objects.flatMap((item) => Object.keys(item)))];
    const body = objects.map((item) => headers.map((header) => String(item[header] ?? "")));
    return [headers, ...body];
  } catch {
    return [];
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  const directText = await extractPdfTextWithPdfJs(file);
  if (directText.trim()) return directText;

  const ocrText = await extractPdfTextWithOcr(file);
  if (ocrText.trim()) return ocrText;

  throw new Error(`Could not extract readable text from ${file.name}.`);
}

async function extractTextFromImage(file: File): Promise<string> {
  const ocrEndpoint = localStorage.getItem("bia.ocr-endpoint")?.trim();
  if (ocrEndpoint) {
    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(ocrEndpoint, {
        method: "POST",
        body: form,
      });
      if (response.ok) {
        const payload = await response.json();
        const text = typeof payload?.text === "string"
          ? payload.text
          : typeof payload?.data?.text === "string"
            ? payload.data.text
            : "";
        if (text.trim()) return text;
      }
    } catch {
      // Fall back to local OCR below.
    }
  }

  const localOcr = await runTesseractOcrWithPreprocessing(file);
  if (!localOcr.trim()) {
    throw new Error(`OCR returned no text for ${file.name}.`);
  }
  return localOcr;
}

async function parseBinaryExcelWorkbook(file: File): Promise<string[][]> {
  if (!window.XLSX) {
    try {
      const xlsxModule = await importRuntime("xlsx") as {
        read: XlsxGlobal["read"];
        utils: XlsxGlobal["utils"];
      };
      window.XLSX = {
        read: xlsxModule.read,
        utils: {
          sheet_to_json: xlsxModule.utils.sheet_to_json,
        },
      };
    } catch {
      await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
    }
  }
  if (!window.XLSX) {
    throw new Error("Excel parser failed to load. Install `xlsx` and retry.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  return rows.map((row) => row.map((cell) => String(cell ?? "").trim()));
}

async function extractPdfTextWithPdfJs(file: File): Promise<string> {
  try {
    const pdfjs = await importRuntime("pdfjs-dist");
    (pdfjs as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions ||= {};
    if (!(pdfjs as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions?.workerSrc) {
      (pdfjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
    }

    const buffer = await file.arrayBuffer();
    const doc = await (pdfjs as { getDocument: (data: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (pageNo: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }> }> } })
      .getDocument({ data: buffer }).promise;
    const parts: string[] = [];
    for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
      const page = await doc.getPage(pageNo);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str ?? "").join(" ").replace(/\s+/g, " ").trim();
      if (text) parts.push(text);
    }
    return parts.join("\n");
  } catch {
    try {
      const pdfjs = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs");
      (pdfjs as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions ||= {};
      (pdfjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
      const buffer = await file.arrayBuffer();
      const doc = await (pdfjs as { getDocument: (data: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (pageNo: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }> }> } })
        .getDocument({ data: buffer }).promise;
      const parts: string[] = [];
      for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
        const page = await doc.getPage(pageNo);
        const content = await page.getTextContent();
        const text = content.items.map((item) => item.str ?? "").join(" ").replace(/\s+/g, " ").trim();
        if (text) parts.push(text);
      }
      return parts.join("\n");
    } catch {
      return "";
    }
  }
}

async function extractPdfTextWithOcr(file: File): Promise<string> {
  try {
    const pdfjs = await importRuntime("pdfjs-dist");
    (pdfjs as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions ||= {};
    if (!(pdfjs as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions?.workerSrc) {
      (pdfjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
    }
    const buffer = await file.arrayBuffer();
    const doc = await (pdfjs as { getDocument: (data: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (pageNo: number) => Promise<{ getViewport: (options: { scale: number }) => { width: number; height: number }; render: (input: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> }> } })
      .getDocument({ data: buffer }).promise;

    const pageCount = Math.min(doc.numPages, 3);
    const segments: string[] = [];

    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
      const page = await doc.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1.7 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!blob) continue;
      const ocr = await runTesseractOcrWithPreprocessing(blob);
      if (ocr.trim()) segments.push(ocr.trim());
    }

    return segments.join("\n");
  } catch {
    try {
      const pdfjs = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs");
      (pdfjs as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions ||= {};
      (pdfjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
      const buffer = await file.arrayBuffer();
      const doc = await (pdfjs as { getDocument: (data: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (pageNo: number) => Promise<{ getViewport: (options: { scale: number }) => { width: number; height: number }; render: (input: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> }> } })
        .getDocument({ data: buffer }).promise;
      const pageCount = Math.min(doc.numPages, 3);
      const segments: string[] = [];
      for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
        const page = await doc.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1.7 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
        if (!blob) continue;
        const ocr = await runTesseractOcrWithPreprocessing(blob);
        if (ocr.trim()) segments.push(ocr.trim());
      }
      return segments.join("\n");
    } catch {
      return "";
    }
  }
}

async function runTesseractOcr(input: Blob, options?: Record<string, unknown>): Promise<string> {
  if (!window.Tesseract) {
    try {
      const tesseract = await importRuntime("tesseract.js") as {
        recognize: TesseractGlobal["recognize"];
      };
      window.Tesseract = {
        recognize: tesseract.recognize,
      };
    } catch {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
      } catch {
        throw new Error("OCR engine failed to load. Install `tesseract.js` and retry.");
      }
    }
  }
  if (!window.Tesseract) return "";
  const result = await window.Tesseract.recognize(input, "eng", options);
  return result?.data?.text ?? "";
}

async function runTesseractOcrWithPreprocessing(input: Blob): Promise<string> {
  const variants = await buildOcrVariants(input);
  const psmModes = [6, 11, 4];
  const textBlocks: string[] = [];

  for (const variant of variants) {
    for (const psm of psmModes) {
      const text = normalizeOcrText(await runTesseractOcr(variant, { tessedit_pageseg_mode: psm }));
      if (text.length > 0) textBlocks.push(text);
    }
  }

  return mergeOcrBlocks(textBlocks);
}

function normalizeOcrText(text: string): string {
  let normalized = text
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  for (const [abbr, full] of Object.entries(OCR_ABBREVIATIONS)) {
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(new RegExp(`\\b${escaped}\\b`, "gi"), full);
  }
  return normalized;
}

async function preprocessImageForOcr(input: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(input);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return input;

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
    const value = contrasted > 145 ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  return blob ?? input;
}

async function buildOcrVariants(input: Blob): Promise<Blob[]> {
  const variants: Blob[] = [input];
  const base = await preprocessImageForOcr(input);
  variants.push(base);
  const upscaled = await upscaleImage(base, 2);
  variants.push(upscaled);
  const soft = await preprocessImageForOcrSoft(input);
  variants.push(soft);
  return variants;
}

async function preprocessImageForOcrSoft(input: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(input);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return input;

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  return blob ?? input;
}

async function upscaleImage(input: Blob, scale: number): Promise<Blob> {
  const bitmap = await createImageBitmap(input);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bitmap.width * scale);
  canvas.height = Math.ceil(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return input;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  return blob ?? input;
}

function mergeOcrBlocks(blocks: string[]): string {
  if (blocks.length === 0) return "";
  const map = new Map<string, number>();
  blocks
    .flatMap((block) => block.split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const normalized = line.replace(/\s+/g, " ");
      map.set(normalized, (map.get(normalized) ?? 0) + 1);
    });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([line]) => line)
    .join("\n");
}

function matrixFromExtractedText(text: string): string[][] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.includes(",")) return parseCsvText(trimmed);

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const matrix = lines
    .map((line) => {
      if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
      if (line.includes("|")) return line.split("|").map((cell) => cell.trim()).filter(Boolean);
      return line.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean);
    })
    .filter((row) => row.length > 0);

  if (matrix.length < 2) return [];
  return matrix;
}

function isLowStructureMatrix(matrix: string[][]): boolean {
  if (matrix.length < 2) return true;
  const headerSize = matrix[0]?.length ?? 0;
  if (headerSize <= 1) return true;
  const sample = matrix.slice(1, 12);
  if (sample.length === 0) return true;
  const rowsWithManyCells = sample.filter((row) => row.length >= 3).length;
  return rowsWithManyCells <= Math.floor(sample.length * 0.3);
}

function matrixFromLooseTransactionText(text: string, options?: { allowAmountOnly?: boolean }): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows: string[][] = [];
  let lastContext = "";
  for (const line of lines) {
    if (!isMostlyReadable(line)) continue;
    if (isPdfNoiseLine(line)) continue;
    if (/\b\d{7,}\b/.test(line) && !/(kes|ksh|mpesa|m-pesa|paid|received|sale|expense|bank|cash|transfer)/i.test(line)) continue;

    const amounts = amountMatches(line);
    const allowAmountOnly = options?.allowAmountOnly === true;
    const hasLetters = /[A-Za-z]/.test(line);
    const strongSignal = hasTransactionSignal(line);
    const contextSignal = hasTransactionSignal(lastContext) || /sale|sold|paid|received|payment|expense|cash|bank|transfer|mpesa|m-pesa|till|paybill|pochi/i.test(lastContext);

    if (hasLetters && amounts.length === 0 && line.length >= 3) {
      lastContext = line;
      continue;
    }
    if (!strongSignal && !(allowAmountOnly && contextSignal && amounts.some((v) => Math.abs(v) >= 20))) continue;
    if (amounts.length === 0) continue;

    const filteredAmounts = amounts
      .map((v) => Math.abs(v))
      .filter((v) => v > 0 && v < 10_000_000);
    if (filteredAmounts.length === 0) continue;

    const amount = Math.max(...filteredAmounts);
    if (amount < 20 && !/(kes|ksh)/i.test(line) && !allowAmountOnly) continue;
    if (!strongSignal && !contextSignal && amount < 100) continue;

    const descriptionText = hasLetters ? line : lastContext || line;
    const direction = guessDirectionFromText(`${descriptionText} ${line}`);
    const cashIn = direction === "in" ? amount : 0;
    const cashOut = direction === "out" ? amount : 0;
    const reference = descriptionText.match(MPESA_REF_REGEX)?.[0] ?? line.match(MPESA_REF_REGEX)?.[0] ?? "";
    const mode = getModeFromText(`${descriptionText} ${line}`);
    const channel = inferPaymentChannel(mode, line, `${descriptionText} ${line}`);
    const category = inferCategoryFromDescription(descriptionText);
    const fee = (() => {
      const lower = `${descriptionText} ${line}`.toLowerCase();
      if (!lower.includes("fee") && !lower.includes("charge")) return 0;
      const smallest = Math.min(...filteredAmounts);
      return smallest === amount ? 0 : smallest;
    })();

    rows.push([
      "",
      String(cashIn),
      String(cashOut),
      descriptionText,
      "0",
      category,
      String(fee),
      reference,
      mode,
      channel,
    ]);
  }

  if (rows.length === 0) return [];

  return [
    ["date", "cash_in", "cash_out", "description", "orders", "category", "transaction_cost", "reference_code", "payment_mode", "payment_channel"],
    ...rows,
  ];
}

function inferCategoryFromDescription(description: string): string {
  const lower = description.toLowerCase();
  if (/stock|inventory|restock|supplier|wholesale/.test(lower)) return "Stock Purchase";
  if (/rent|house|shop rent/.test(lower)) return "Rent";
  if (/token|power|electric|water|utility/.test(lower)) return "Utilities";
  if (/transport|fuel|fare/.test(lower)) return "Transport";
  if (/sale|sold|customer|receipt|m-pesa|till|paybill|pochi/.test(lower)) return "Sales";
  return "Unstructured";
}

export function runIngestionPipeline(
  fileName: string,
  headers: string[],
  rows: RawRecord[],
  existingTraceKeys: Set<string>,
): IngestionOutcome {
  const dateIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.date);
  const inIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.cashIn);
  const outIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.cashOut);
  const ordersIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.orders);
  const descriptionIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.description);
  const categoryIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.category);
  const transactionCostIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.transactionCost);
  const referenceCodeIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.referenceCode);
  const paymentModeIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.paymentMode);
  const paymentChannelIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.paymentChannel);
  const productNameIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.productName);
  const quantityIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.quantity);
  const unitCostIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.unitCost);
  const clientNameIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.clientName);
  const supplierNameIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.supplierName);
  const phoneIdx = findColumn(headers, REQUIRED_SIGNAL_GROUPS.phone);

  const suggestions: string[] = [];
  if (dateIdx < 0) {
    suggestions.push(`Missing date column. Try headers like: ${REQUIRED_SIGNAL_GROUPS.date.join(", ")}.`);
  }
  if (inIdx < 0 && outIdx < 0) {
    const inSuggestions = suggestColumns(headers, REQUIRED_SIGNAL_GROUPS.cashIn);
    const outSuggestions = suggestColumns(headers, REQUIRED_SIGNAL_GROUPS.cashOut);
    const suggested = [...new Set([...inSuggestions, ...outSuggestions])];
    if (suggested.length > 0) {
      suggestions.push(`Could not confidently map cash columns. Closest matches: ${suggested.join(", ")}.`);
    } else {
      suggestions.push("Could not find cash columns. Use Sales/Revenue/Amount In and Expenses/Cost/Amount Out.");
    }
  }

  const normalizedTransactions: NormalizedTransaction[] = [];
  const ledgerEntries: LedgerEntry[] = [];
  const products: RoutedProduct[] = [];
  const clients: RoutedClient[] = [];
  const suppliers: RoutedSupplier[] = [];
  const invalidRows: ParseErrorItem[] = [];
  const warnings: ParseWarningItem[] = [];
  let duplicatesSkipped = 0;
  const now = new Date();
  const autoDate = now.toISOString().slice(0, 10);

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowValues = Object.values(row);
    const rawText = rowValues.map((value) => String(value ?? "").trim()).filter(Boolean).join(" ");

    const rawDate = dateIdx >= 0 ? rowValues[dateIdx] : undefined;
    const parsedDate = toDateIso(rawDate);
    const date = parsedDate ?? autoDate;
    if (!parsedDate) {
      warnings.push({ rowNumber, message: "Missing/invalid date; assigned upload date automatically." });
    }

    let cashIn = inIdx >= 0 ? Math.abs(parseAmount(rowValues[inIdx])) : 0;
    let cashOut = outIdx >= 0 ? Math.abs(parseAmount(rowValues[outIdx])) : 0;
    const orders = ordersIdx >= 0 ? Math.max(0, Math.round(parseAmount(rowValues[ordersIdx]))) : 0;
    const description = descriptionIdx >= 0 ? String(rowValues[descriptionIdx] ?? "").trim() : "";
    const transactionCost = transactionCostIdx >= 0 ? Math.abs(parseAmount(rowValues[transactionCostIdx])) : 0;
    const rawPaymentMode = paymentModeIdx >= 0 ? toSafeText(rowValues[paymentModeIdx]) : "";
    const rawPaymentChannel = paymentChannelIdx >= 0 ? toSafeText(rowValues[paymentChannelIdx]) : "";
    const paymentChannel = inferPaymentChannel(
      getModeFromText(rawPaymentMode || rawPaymentChannel || description),
      rawPaymentChannel,
      `${description} ${rawPaymentMode}`,
    );
    const paymentMode = paymentChannel;
    const explicitReference = referenceCodeIdx >= 0 ? toSafeText(rowValues[referenceCodeIdx]) : "";
    const refFromDescription = (description.match(MPESA_REF_REGEX)?.[0] ?? "").trim();
    const referenceCode = explicitReference || refFromDescription || "N/A";

    if (cashIn > 0 && cashOut > 0) {
      warnings.push({ rowNumber, message: "Both cash_in and cash_out detected; keeping both values." });
    }

    if (cashIn === 0 && cashOut === 0 && description) {
      const classified = classifyFromDescription(description, cashIn, cashOut);
      cashIn = Math.abs(classified.cashIn);
      cashOut = Math.abs(classified.cashOut);
    }

    if (cashIn === 0 && cashOut === 0 && orders === 0) {
      warnings.push({ rowNumber, message: "Skipped row with no usable financial signal." });
      return;
    }

    const traceKey = buildTraceKey(date, cashIn, cashOut, orders, fileName, rowNumber);
    if (existingTraceKeys.has(traceKey)) {
      duplicatesSkipped += 1;
      return;
    }
    existingTraceKeys.add(traceKey);

    const category = determineCategory(row, categoryIdx, description);
    const inferredClient = normalizePersonOrBusiness(
      (clientNameIdx >= 0 ? toSafeText(rowValues[clientNameIdx]) : "")
      || extractNamedEntity(rawText, ["received from ", "payment from ", "customer ", "client "]),
    );
    const inferredSupplier = normalizePersonOrBusiness(
      (supplierNameIdx >= 0 ? toSafeText(rowValues[supplierNameIdx]) : "")
      || extractNamedEntity(rawText, ["paid to ", "supplier ", "vendor ", "merchant "]),
    );
    const inferredProduct = normalizePersonOrBusiness(
      (productNameIdx >= 0 ? toSafeText(rowValues[productNameIdx]) : "")
      || extractNamedEntity(rawText, ["product ", "item ", "goods "]),
    );
    const quantity = quantityIdx >= 0 ? Math.max(0, Math.round(parseAmount(rowValues[quantityIdx]))) : 0;
    const unitCost = unitCostIdx >= 0 ? Math.max(0, parseAmount(rowValues[unitCostIdx])) : 0;
    const phone = normalizePhone(phoneIdx >= 0 ? toSafeText(rowValues[phoneIdx]) : "");
    const inferredFromDescription = normalizePersonOrBusiness(description);

    const normalized: NormalizedTransaction = {
      id: `${fileName}-${rowNumber}`,
      date,
      recordedAt: new Date(now.getTime() + index * 1000).toISOString(),
      cashIn,
      cashOut,
      orders,
      source: "file_upload",
      fileId: fileName,
      rowNumber,
      reference: fileName,
      description,
      category,
      traceKey,
      transactionCost,
      referenceCode,
      paymentMode,
      paymentChannel,
    };

    normalizedTransactions.push(normalized);

    if (cashIn > 0) {
      ledgerEntries.push({
        id: `${normalized.id}-in`,
        date,
        type: "IN",
        amount: cashIn,
        source: "file",
        reference: fileName,
        fileId: fileName,
        rowNumber,
        traceKey: `${traceKey}:IN`,
        category,
        transactionCost,
        referenceCode,
        paymentMode,
        paymentChannel,
      });
    }

    if (cashOut > 0) {
      ledgerEntries.push({
        id: `${normalized.id}-out`,
        date,
        type: "OUT",
        amount: cashOut,
        source: "file",
        reference: fileName,
        fileId: fileName,
        rowNumber,
        traceKey: `${traceKey}:OUT`,
        category,
        transactionCost,
        referenceCode,
        paymentMode,
        paymentChannel,
      });
    }

    if (inferredProduct && (quantity > 0 || unitCost > 0 || /stock|inventory|restock|product|item|goods/i.test(rawText))) {
      const confidence = clampConfidence(
        0.45
        + (quantity > 0 ? 0.2 : 0)
        + (unitCost > 0 ? 0.2 : 0)
        + (/stock|inventory|restock|product|item|goods/i.test(rawText) ? 0.15 : 0),
      );
      products.push({
        id: `${fileName}-product-${rowNumber}`,
        sourceFile: fileName,
        rowNumber,
        confidence,
        riskLevel: confidenceToRisk(confidence),
        traceKey: `${traceKey}:PRODUCT`,
        name: inferredProduct,
        quantity,
        unitCost,
        supplier: inferredSupplier || "Unknown",
      });
    }

    if (inferredClient && cashIn > 0) {
      const confidence = clampConfidence(
        0.5
        + (phone ? 0.25 : 0)
        + (referenceCode !== "N/A" ? 0.1 : 0)
        + (/received from|customer|client|payment from/i.test(rawText) ? 0.15 : 0),
      );
      clients.push({
        id: `${fileName}-client-${rowNumber}`,
        sourceFile: fileName,
        rowNumber,
        confidence,
        riskLevel: confidenceToRisk(confidence),
        traceKey: `${traceKey}:CLIENT`,
        name: inferredClient,
        phone,
        totalSpent: cashIn,
        firstSeen: date,
      });
    } else if (!inferredClient && cashIn > 0 && inferredFromDescription && /customer|client|buyer|received|payment/i.test(rawText)) {
      const confidence = clampConfidence(0.6);
      clients.push({
        id: `${fileName}-client-${rowNumber}`,
        sourceFile: fileName,
        rowNumber,
        confidence,
        riskLevel: confidenceToRisk(confidence),
        traceKey: `${traceKey}:CLIENT`,
        name: inferredFromDescription,
        phone,
        totalSpent: cashIn,
        firstSeen: date,
      });
    }

    if (inferredSupplier && (cashOut > 0 || /supplier|vendor|wholesale|restock|stock/i.test(rawText))) {
      const inferredPrice = unitCost > 0 ? unitCost : (cashOut > 0 ? cashOut : 0);
      const confidence = clampConfidence(
        0.45
        + (cashOut > 0 ? 0.2 : 0)
        + (unitCost > 0 ? 0.15 : 0)
        + (/supplier|vendor|wholesale|restock|stock|paid to/i.test(rawText) ? 0.2 : 0),
      );
      suppliers.push({
        id: `${fileName}-supplier-${rowNumber}`,
        sourceFile: fileName,
        rowNumber,
        confidence,
        riskLevel: confidenceToRisk(confidence),
        traceKey: `${traceKey}:SUPPLIER`,
        name: inferredSupplier,
        lastPrice: inferredPrice,
        categoryHint: category ?? inferCategoryFromDescription(rawText),
      });
    }
  });

  return {
    normalizedTransactions,
    ledgerEntries,
    products,
    clients,
    suppliers,
    duplicatesSkipped,
    invalidRows,
    warnings,
    suggestions,
  };
}
