import type { RiskLevel } from "../database/repositories/store.repository";

export interface TransactionCandidate {
  date: string;
  type: "IN" | "OUT";
  amount: number;
  source: string;
  traceKey: string;
  reference: string;
  channel: "Cash" | "Bank" | "Mobile Transfer";
  transactionCost: number;
  confidence: number;
  riskLevel: RiskLevel;
}

export interface ProductCandidate {
  name: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: RiskLevel;
  traceKey: string;
}

export interface ClientCandidate {
  name: string;
  phone: string;
  totalSpent: number;
  firstSeen: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: RiskLevel;
  traceKey: string;
}

export interface SupplierCandidate {
  name: string;
  lastPrice: number;
  categoryHint: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: RiskLevel;
  traceKey: string;
}

export interface IngestionRouteResult {
  trusted: {
    transactions: TransactionCandidate[];
    products: ProductCandidate[];
    clients: ClientCandidate[];
    suppliers: SupplierCandidate[];
  };
  review: {
    products: ProductCandidate[];
    clients: ClientCandidate[];
    suppliers: SupplierCandidate[];
  };
}

const split = <T extends { riskLevel: RiskLevel }>(items: T[]) => {
  const trusted = items.filter((item) => item.riskLevel === "Trusted");
  const review = items.filter((item) => item.riskLevel !== "Trusted");
  return { trusted, review };
};

export const ingestionRouter = {
  route: (payload: {
    transactions: TransactionCandidate[];
    products: ProductCandidate[];
    clients: ClientCandidate[];
    suppliers: SupplierCandidate[];
  }): IngestionRouteResult => {
    const product = split(payload.products);
    const client = split(payload.clients);
    const supplier = split(payload.suppliers);

    return {
      trusted: {
        transactions: payload.transactions,
        products: product.trusted,
        clients: client.trusted,
        suppliers: supplier.trusted,
      },
      review: {
        products: product.review,
        clients: client.review,
        suppliers: supplier.review,
      },
    };
  },
};
