export interface User {
  id: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
}
