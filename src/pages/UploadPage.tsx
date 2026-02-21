import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { toast } from "@/hooks/use-toast";

interface UploadedFile {
  name: string;
  size: string;
  rows: number;
  status: "success" | "error";
}

const UploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { name: "january_sales.csv", size: "24 KB", rows: 156, status: "success" },
    { name: "mpesa_statement_feb.xlsx", size: "89 KB", rows: 342, status: "success" },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
        toast({ title: "Unsupported file", description: `${file.name} is not a CSV or Excel file.`, variant: "destructive" });
        return;
      }
      const newFile: UploadedFile = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        rows: Math.floor(Math.random() * 500) + 50,
        status: "success",
      };
      setUploadedFiles((prev) => [newFile, ...prev]);
      toast({ title: "File uploaded!", description: `${file.name} processed successfully.` });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <DashboardLayout title="Upload Data" subtitle="Import your sales, expenses, and transaction data">
      <div className="space-y-6 max-w-3xl">
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">Drop files here or click to upload</h3>
          <p className="text-sm text-muted-foreground mb-4">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
          <Button variant="outline" size="sm">Browse Files</Button>
        </div>

        {/* Expected Format */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-foreground mb-3">Expected Data Format</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Sales</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Revenue</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Expenses</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Orders</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">2026-01-15</td>
                  <td className="py-2 px-3">45,000</td>
                  <td className="py-2 px-3">52,000</td>
                  <td className="py-2 px-3">18,000</td>
                  <td className="py-2 px-3">12</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">2026-01-16</td>
                  <td className="py-2 px-3">38,000</td>
                  <td className="py-2 px-3">44,000</td>
                  <td className="py-2 px-3">15,000</td>
                  <td className="py-2 px-3">9</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Uploaded Files</h3>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} · {file.rows} rows</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <button onClick={() => removeFile(file.name)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
