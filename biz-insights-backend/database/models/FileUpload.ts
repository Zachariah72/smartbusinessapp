export interface FileUploadModel {
  id: string;
  businessId: string;
  fileName: string;
  status: "processing" | "success" | "error";
}
