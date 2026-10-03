import type { UserRole } from "@/types/user";

export interface NavItem {
  label: string;
  href: string;
  roles: UserRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const all: UserRole[] = ["doctor", "hospital_admin", "researcher", "system_admin"];

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Command Center", href: "/dashboard", roles: all }],
  },
  {
    label: "Patient Care",
    items: [
      { label: "New Assessment", href: "/assessment", roles: ["doctor"] },
      { label: "Assessment History", href: "/assessment/history", roles: ["doctor"] },
    ],
  },
  {
    label: "AI Intelligence",
    items: [
      { label: "Explainability", href: "/explainability", roles: ["doctor", "researcher"] },
      { label: "Clinical Insights", href: "/insights", roles: ["doctor"] },
      { label: "Model Registry", href: "/models", roles: ["hospital_admin", "researcher", "system_admin"] },
      { label: "Model Comparison", href: "/models/comparison", roles: ["researcher", "system_admin"] },
    ],
  },
  {
    label: "Federated Network",
    items: [
      { label: "Network Map", href: "/federated", roles: ["hospital_admin", "researcher", "system_admin"] },
      { label: "Federated Rounds", href: "/federated/rounds", roles: ["hospital_admin", "researcher", "system_admin"] },
    ],
  },
  {
    label: "Trust & Privacy",
    items: [
      { label: "Privacy Center", href: "/privacy-center", roles: ["hospital_admin", "system_admin"] },
      { label: "Audit Timeline", href: "/audit", roles: ["hospital_admin", "system_admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { label: "System Health", href: "/system", roles: ["researcher", "system_admin"] },
      { label: "Settings", href: "/settings", roles: all },
      { label: "Notifications", href: "/notifications", roles: all },
      { label: "Help", href: "/help", roles: all },
    ],
  },
];
