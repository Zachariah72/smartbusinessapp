import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { useBusinessData } from "@/context/BusinessDataContext";
import { formatKES, kpis } from "@/lib/demo-data";

const pipelineSteps = [
  "Upload file",
  "File parser",
  "Data normalizer",
  "Transaction classifier",
  "Business ledger",
  "Domain updaters",
  "Insights + mood recalculation",
];

const UploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [posProvider, setPosProvider] = useState("Generic POS");
  const [posEndpoint, setPosEndpoint] = useState("demo");
  const [posApiKey, setPosApiKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploads,
    metrics,
    stockPurchaseSpend,
    ledgerEntries,
    paymentBreakdown,
    recentSalesRecords,
    routedProducts,
    routedClients,
    routedSuppliers,
    reviewQueue,
    posConnection,
    ingestFiles,
    dismissUpload,
    connectPos,
    disconnectPos,
    syncPosTransactions,
    approveReviewItem,
    rejectReviewItem,
  } = useBusinessData();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "tsv", "txt", "json", "xlsx", "xls", "pdf", "png", "jpg", "jpeg", "webp"].includes(ext ?? "")) {
        toast({ title: "Unsupported file", description: `${file.name} is not a supported data file.`, variant: "destructive" });
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    await ingestFiles(validFiles);
    toast({ title: "Ingestion complete", description: "Upload pipeline ran and ledger-linked metrics were refreshed." });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFileSelect(e.dataTransfer.files);
  };

  const connectPosHandler = () => {
    connectPos({ provider: posProvider, endpoint: posEndpoint });
    toast({ title: "POS connected", description: "You can now run POS sync into the same ledger." });
  };

  return (
    <DashboardLayout title="Upload Data" subtitle="Import your sales, expenses, and transaction data">
      <div className="space-y-6 w-full">
        {/* Upload Zone */}
        <div
          className={`surface-card border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border/80 hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp" multiple className="hidden" onChange={(e) => void handleFileSelect(e.target.files)} />
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">Drop files here or click to upload</h3>
          <p className="text-sm text-muted-foreground mb-4">Supports CSV/TSV/TXT/JSON, Excel, PDF, and images (.csv, .tsv, .txt, .json, .xlsx, .xls, .pdf, .png, .jpg, .jpeg, .webp)</p>
          <Button variant="outline" size="sm">Browse Files</Button>
        </div>

        <div className="surface-card p-6">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Live Auto-Update Snapshot</h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3 text-sm">
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Cash In (Month)</p>
              <p className="text-foreground font-semibold mt-1">{formatKES(metrics.monthCashIn)}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Cash Out (Month)</p>
              <p className="text-foreground font-semibold mt-1">{formatKES(metrics.monthCashOut)}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Ledger Profit</p>
              <p className="text-foreground font-semibold mt-1">{formatKES(metrics.ledgerProfit)}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Orders Added</p>
              <p className="text-foreground font-semibold mt-1">{metrics.totalOrders - kpis.totalOrders}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Stock Purchase Spend</p>
              <p className="text-foreground font-semibold mt-1">{formatKES(stockPurchaseSpend)}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-foreground">Auto-Routed Entities</h3>
          <p className="text-sm text-muted-foreground">
            The engine detects entities from files/images and routes them automatically to transactions, products, clients, and suppliers.
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Transactions Routed</p>
              <p className="text-foreground font-semibold mt-1">{ledgerEntries.length}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Products Detected</p>
              <p className="text-foreground font-semibold mt-1">{routedProducts.length}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Clients Detected</p>
              <p className="text-foreground font-semibold mt-1">{routedClients.length}</p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-muted-foreground">Suppliers Detected</p>
              <p className="text-foreground font-semibold mt-1">{routedSuppliers.length}</p>
            </div>
          </div>
        </div>

        {reviewQueue.some((item) => item.status === "pending") && (
          <div className="surface-card p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-foreground">Review Queue</h3>
            <p className="text-sm text-muted-foreground">Items with lower confidence are queued for quick approval.</p>
            <div className="space-y-2">
              {reviewQueue.filter((item) => item.status === "pending").slice(0, 12).map((item) => (
                <div key={item.id} className="rounded-md border border-border/70 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.kind.toUpperCase()} · {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.riskLevel} · confidence {(item.confidence * 100).toFixed(0)}% · {item.sourceFile} row {item.rowNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => approveReviewItem(item.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => rejectReviewItem(item.id)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="surface-card p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-foreground">Sales Onboard (POS + M-Pesa)</h3>
          <p className="text-sm text-muted-foreground">
            Includes transaction cost, reference code, and payment channel. Channels are standardized to Cash, Bank, or Mobile Transfer.
          </p>

          {paymentBreakdown.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {paymentBreakdown.slice(0, 8).map((item) => (
                <div key={item.key} className="rounded-md border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">{item.key}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{formatKES(item.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fees {formatKES(item.transactionCost)} · {item.count} txns
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No onboard sales records yet. Upload a POS/M-Pesa file or run POS sync.</p>
          )}

          {recentSalesRecords.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Recorded At</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Txn Cost</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Net</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Reference</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Channel</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSalesRecords.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 px-3 text-foreground">{row.date}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.recordedAt ? new Date(row.recordedAt).toLocaleString() : "-"}</td>
                      <td className="py-2 px-3 text-foreground">{formatKES(row.amount)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{formatKES(row.transactionCost)}</td>
                      <td className="py-2 px-3 text-foreground">{formatKES(row.netAmount)}</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono">{row.referenceCode}</td>
                      <td className="py-2 px-3 text-muted-foreground">{String(row.paymentChannel).slice(0, 40)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="surface-card p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-foreground">How It Works</h3>
          <p className="text-sm text-muted-foreground">
            Upload your files. We handle the rest: cash in, cash out, profit, and clarity.
          </p>
          <div className="flex flex-wrap gap-2">
            {pipelineSteps.map((step) => (
              <span key={step} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                {step}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Accepted formats: .csv, .tsv, .txt, .json, .xlsx, .xls, .pdf, .png, .jpg, .jpeg, .webp. OCR runs automatically for images/scanned documents.
          </p>
        </div>

        <div className="surface-card p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-foreground">POS Connection</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="Provider name"
              value={posProvider}
              onChange={(e) => setPosProvider(e.target.value)}
            />
            <Input
              placeholder="Endpoint URL or 'demo'"
              value={posEndpoint}
              onChange={(e) => setPosEndpoint(e.target.value)}
            />
            <Input
              type="password"
              placeholder="API key (optional)"
              value={posApiKey}
              onChange={(e) => setPosApiKey(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={connectPosHandler}>
              {posConnection.connected ? "Update connection" : "Connect POS"}
            </Button>
            <Button size="sm" variant="outline" onClick={disconnectPos} disabled={!posConnection.connected}>
              Disconnect
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void syncPosTransactions(posApiKey)}
              disabled={!posConnection.connected || posConnection.lastSyncStatus === "syncing"}
            >
              {posConnection.lastSyncStatus === "syncing" ? "Syncing..." : "Sync now"}
            </Button>
          </div>

          <div className="rounded-md border border-border/70 p-3 text-sm">
            <p className="text-muted-foreground">Status: <span className="text-foreground">{posConnection.lastSyncStatus}</span></p>
            <p className="text-muted-foreground">Connected: <span className="text-foreground">{posConnection.connected ? "Yes" : "No"}</span></p>
            <p className="text-muted-foreground">Provider: <span className="text-foreground">{posConnection.provider}</span></p>
            <p className="text-muted-foreground">Total synced: <span className="text-foreground">{posConnection.totalSynced}</span></p>
            {posConnection.lastSyncAt && (
              <p className="text-muted-foreground">Last sync: <span className="text-foreground">{new Date(posConnection.lastSyncAt).toLocaleString()}</span></p>
            )}
            {posConnection.lastSyncMessage && (
              <p className="text-xs text-muted-foreground mt-2">{posConnection.lastSyncMessage}</p>
            )}
          </div>
        </div>

        {/* Uploaded Files */}
        {uploads.length > 0 && (
          <div className="surface-card p-6">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Uploaded Files</h3>
            <div className="space-y-3">
              {uploads.map((file) => (
                <div key={file.id} className="p-3 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} · {file.rowsProcessed} rows processed · {file.rowsSkipped} skipped · {file.duplicatesSkipped} duplicates
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {file.status === "processing" && (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                      {file.status === "success" && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      <button onClick={() => dismissUpload(file.id)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {file.errors.length > 0 && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                      <p className="text-xs font-medium text-destructive mb-1">Errors</p>
                      {file.errors.map((error) => (
                        <p key={error} className="text-xs text-destructive/90">{error}</p>
                      ))}
                    </div>
                  )}
                  {file.warnings.length > 0 && (
                    <div className="rounded-md border border-amber-400/40 bg-amber-50 p-2">
                      <p className="text-xs font-medium text-amber-800 mb-1">Processing Notes</p>
                      <p className="text-xs text-amber-800">
                        Some lines were skipped automatically because they looked unreadable or non-transactional.
                      </p>
                    </div>
                  )}
                  {file.suggestions.length > 0 && (
                    <div className="rounded-md border border-border/70 bg-background p-2">
                      <p className="text-xs font-medium text-foreground mb-1">Suggested fixes</p>
                      {file.suggestions.map((suggestion) => (
                        <p key={suggestion} className="text-xs text-muted-foreground">{suggestion}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {ledgerEntries.length > 0 && (
          <div className="surface-card p-6">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Traceability (Latest Ledger Entries)</h3>
            <div className="space-y-2">
              {ledgerEntries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-md border border-border/70 p-3 text-sm flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {entry.type} {formatKES(entry.amount)} on {entry.date}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Source: {entry.source} · File: {entry.reference} · Row: {entry.rowNumber}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {entry.category ?? "Uncategorized"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
