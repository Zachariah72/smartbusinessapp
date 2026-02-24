export interface UploadEnvelope {
  businessId: string;
  fileName: string;
  mimeType: string;
  bytes: number;
}

export const uploadHandler = {
  accept: async (input: UploadEnvelope) => ({ accepted: true, input }),
};
