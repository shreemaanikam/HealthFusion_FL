import type { PrivacyCenterSnapshot } from "@/types/privacy";

export const demoPrivacySnapshot: PrivacyCenterSnapshot = {
  rawDataSharing: "off",
  federatedExchange: "on",
  source: "demo",
  controls: [
    {
      id: "encryption",
      label: "Encryption in transit",
      description: "TLS 1.3 between hospital connectors and the aggregation server.",
      status: "active",
    },
    {
      id: "secure-agg",
      label: "Secure aggregation",
      description: "Cryptographic aggregation so the coordinator never sees a single hospital's raw update.",
      status: "planned",
    },
    {
      id: "diff-privacy",
      label: "Differential privacy",
      description: "Calibrated noise added to local gradients before they leave the hospital boundary.",
      status: "simulation",
    },
    {
      id: "audit-log",
      label: "Audit logging",
      description: "Every federated round, hospital connection, and prediction is written to an append-only log.",
      status: "active",
    },
    {
      id: "access-control",
      label: "Role-based access control",
      description: "Doctor, Hospital Administrator, Researcher, and System Administrator each see a different slice of the platform.",
      status: "simulation",
    },
  ],
};
