/** Possible operational statuses matching the backend's privacy control statuses. */
export type FeatureStatus = "active" | "simulation" | "demo" | "planned";

/** A single privacy control as returned by GET /api/privacy/config */
export interface PrivacyControl {
  id: string;
  label: string;
  description: string;
  /** Backend values: "active" | "simulation" | "planned" | "off" | "on" */
  status: FeatureStatus | "off" | "on";
  details?: string;
  /** Differential privacy epsilon value */
  epsilon?: number;
  /** Differential privacy delta value */
  delta?: number;
}

/**
 * GET /api/privacy/status response (after snake→camelCase).
 * Backend PrivacyStatusResponse:
 *   data_locality, differential_privacy, secure_aggregation, audit_logging
 */
export interface PrivacyStatus {
  dataLocality: string;
  differentialPrivacy: string;
  secureAggregation: string;
  auditLogging: string;
  /** Raw data sharing toggle */
  rawDataSharing?: "off";
  /** Federated exchange toggle */
  federatedExchange?: "on";
}

/**
 * GET /api/privacy/config response (after snake→camelCase).
 */
export interface PrivacyConfig {
  controls: PrivacyControl[];
  dataHandling?: {
    rawDataSharing: string;
    federatedExchange: string;
    modelEncryption: string;
  };
}

export interface PrivacyCenterSnapshot {
  dataLocality?: string;
  differentialPrivacy?: string;
  secureAggregation?: string;
  auditLogging?: string;
  rawDataSharing?: "off";
  federatedExchange?: "on";
  controls: PrivacyControl[];
  dataHandling?: {
    rawDataSharing: string;
    federatedExchange: string;
    modelEncryption: string;
  };
  source: "demo" | "live";
}
