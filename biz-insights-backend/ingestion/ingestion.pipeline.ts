import { fileParser } from "./file.parser";
import { normalizer } from "./normalizer";
import { classifier } from "./classifier";
import { ingestionRouter } from "./router";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ingestionPipeline = {
  runFromText: async (fileName: string, content: string) => {
    const parsed = await fileParser.parseFromText(fileName, content);
    const normalized = normalizer.normalizeRows(parsed.rows);

    const transactions = normalized
      .map((row, index) => {
        const direction = classifier.classifyDirection(row);
        const amount = direction === "IN" ? row.amountIn : row.amountOut;
        if (direction === "UNKNOWN" || amount <= 0) return null;
        const confidence = classifier.confidenceForTransaction(row);
        return {
          date: row.date,
          type: direction,
          amount,
          source: "file_upload",
          traceKey: `${fileName}|${index + 2}|${direction}|${amount}`,
          reference: row.reference,
          channel: row.channel as "Cash" | "Bank" | "Mobile Transfer",
          transactionCost: 0,
          confidence,
          riskLevel: classifier.entityRisk(confidence),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const products = normalized
      .map((row, index) => {
        if (!row.product && !(row.quantity > 0 && row.unitCost > 0)) return null;
        const confidence = classifier.confidenceForProduct(row);
        return {
          name: row.product || "Unlabeled Product",
          quantity: row.quantity,
          unitCost: row.unitCost,
          supplier: row.supplier || "Unknown",
          sourceFile: fileName,
          rowNumber: index + 2,
          confidence,
          riskLevel: classifier.entityRisk(confidence),
          traceKey: `${fileName}|${index + 2}|product`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const clients = normalized
      .map((row, index) => {
        if (!row.client || row.amountIn <= 0) return null;
        const confidence = classifier.confidenceForClient(row);
        return {
          name: row.client,
          phone: row.phone,
          totalSpent: row.amountIn,
          firstSeen: row.date,
          sourceFile: fileName,
          rowNumber: index + 2,
          confidence,
          riskLevel: classifier.entityRisk(confidence),
          traceKey: `${fileName}|${index + 2}|client`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const suppliers = normalized
      .map((row, index) => {
        if (!row.supplier && row.amountOut <= 0) return null;
        const confidence = classifier.confidenceForSupplier(row);
        return {
          name: row.supplier || "Unknown Supplier",
          lastPrice: row.unitCost > 0 ? row.unitCost : row.amountOut,
          categoryHint: /stock|inventory|restock/i.test(row.rawText) ? "Stock Purchase" : "General",
          sourceFile: fileName,
          rowNumber: index + 2,
          confidence,
          riskLevel: classifier.entityRisk(confidence),
          traceKey: `${fileName}|${index + 2}|supplier`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      id: uid(),
      fileName,
      rowsProcessed: normalized.length,
      rowsSkipped: Math.max(0, parsed.rows.length - normalized.length),
      duplicatesSkipped: 0,
      warnings: [] as string[],
      errors: [] as string[],
      ...ingestionRouter.route({ transactions, products, clients, suppliers }),
    };
  },
};
