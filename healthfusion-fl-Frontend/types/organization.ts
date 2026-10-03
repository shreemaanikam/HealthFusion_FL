export interface Organization {
  id: string;
  name: string;
  kind: "hospital" | "research_institute" | "coordinator";
  city: string;
  country: string;
}
