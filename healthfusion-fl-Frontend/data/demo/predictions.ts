import type {
  GlobalFeatureImportance,
  AssessmentInput,
  AssessmentResult,
  AssessmentHistoryItem,
  FeatureContribution,
  RiskLevel,
} from "@/types/prediction";

function buildContributions(input: AssessmentInput): FeatureContribution[] {
  const contributions: FeatureContribution[] = [
    {
      feature: "hba1c_level",
      label: "HbA1c level",
      value: `${input.hba1cLevel.toFixed(1)}%`,
      contribution: input.hba1cLevel >= 6.5 ? 0.31 : input.hba1cLevel >= 5.7 ? 0.14 : -0.09,
      direction: input.hba1cLevel >= 5.7 ? "increases_risk" : "decreases_risk",
    },
    {
      feature: "blood_glucose_level",
      label: "Blood glucose",
      value: `${input.bloodGlucoseLevel} mg/dL`,
      contribution: input.bloodGlucoseLevel >= 160 ? 0.24 : input.bloodGlucoseLevel >= 120 ? 0.08 : -0.07,
      direction: input.bloodGlucoseLevel >= 120 ? "increases_risk" : "decreases_risk",
    },
    {
      feature: "bmi",
      label: "BMI",
      value: input.bmi.toFixed(1),
      contribution: input.bmi >= 30 ? 0.17 : input.bmi >= 25 ? 0.06 : -0.05,
      direction: input.bmi >= 25 ? "increases_risk" : "decreases_risk",
    },
    {
      feature: "age",
      label: "Age",
      value: `${input.age} yrs`,
      contribution: input.age >= 55 ? 0.13 : input.age >= 40 ? 0.04 : -0.06,
      direction: input.age >= 40 ? "increases_risk" : "decreases_risk",
    },
    {
      feature: "hypertension",
      label: "Hypertension",
      value: input.hypertension ? "Present" : "Absent",
      contribution: input.hypertension ? 0.11 : -0.03,
      direction: input.hypertension ? "increases_risk" : "decreases_risk",
    },
    {
      feature: "heart_disease",
      label: "Heart disease",
      value: input.heartDisease ? "Present" : "Absent",
      contribution: input.heartDisease ? 0.09 : -0.02,
      direction: input.heartDisease ? "increases_risk" : "decreases_risk",
    },
    {
      feature: "smoking_history",
      label: "Smoking history",
      value: input.smokingHistory.replace("_", " "),
      contribution: input.smokingHistory === "current" ? 0.06 : input.smokingHistory === "former" ? 0.02 : -0.03,
      direction: input.smokingHistory === "current" ? "increases_risk" : "decreases_risk",
    },
  ];
  return contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

export function scoreDemoAssessment(input: AssessmentInput): AssessmentResult {
  const contributions = buildContributions(input);
  const rawScore = contributions.reduce((sum, c) => sum + c.contribution, 0.42);
  const probability = Math.min(0.97, Math.max(0.02, rawScore));
  const riskLevel: RiskLevel = probability >= 0.6 ? "high" : probability >= 0.3 ? "moderate" : "low";

  return {
    id: `ax-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patientRef: `PT-${Math.floor(Math.random() * 90000 + 10000)}`,
    input,
    riskLevel,
    probability,
    confidence: 0.86,
    modelVersion: "Adaptive Federated Model v4.2.1",
    featureContributions: contributions,
    status: "completed",
    source: "demo",
  };
}

const sampleInput: AssessmentInput = {
  gender: "female",
  age: 58,
  hypertension: true,
  heartDisease: false,
  smokingHistory: "former",
  bmi: 31.4,
  hba1cLevel: 7.1,
  bloodGlucoseLevel: 172,
};

export const demoAssessmentResult: AssessmentResult = {
  ...scoreDemoAssessment(sampleInput),
  id: "ax-100234",
  patientRef: "PT-40218",
};

export const demoAssessmentHistory: AssessmentHistoryItem[] = [
  { id: "ax-100234", createdAt: demoAssessmentResult.createdAt, patientRef: "PT-40218", modelVersion: "v4.2.1", riskLevel: "high", confidence: 0.86, status: "completed" },
  { id: "ax-100211", createdAt: new Date(Date.now() - 3 * 3600e3).toISOString(), patientRef: "PT-40190", modelVersion: "v4.2.1", riskLevel: "moderate", confidence: 0.81, status: "completed" },
  { id: "ax-100198", createdAt: new Date(Date.now() - 27 * 3600e3).toISOString(), patientRef: "PT-40155", modelVersion: "v4.2.0", riskLevel: "low", confidence: 0.9, status: "completed" },
  { id: "ax-100177", createdAt: new Date(Date.now() - 52 * 3600e3).toISOString(), patientRef: "PT-40098", modelVersion: "v4.2.0", riskLevel: "moderate", confidence: 0.77, status: "completed" },
  { id: "ax-100156", createdAt: new Date(Date.now() - 80 * 3600e3).toISOString(), patientRef: "PT-40041", modelVersion: "v4.1.9", riskLevel: "low", confidence: 0.88, status: "completed" },
  { id: "ax-100142", createdAt: new Date(Date.now() - 101 * 3600e3).toISOString(), patientRef: "PT-39980", modelVersion: "v4.1.9", riskLevel: "high", confidence: 0.71, status: "failed" },
];

export const demoGlobalFeatureImportance: GlobalFeatureImportance[] = [
  { label: "HbA1c level", weight: 0.27 },
  { label: "Blood glucose", weight: 0.22 },
  { label: "BMI", weight: 0.17 },
  { label: "Age", weight: 0.13 },
  { label: "Hypertension", weight: 0.11 },
  { label: "Heart disease", weight: 0.06 },
  { label: "Smoking history", weight: 0.04 },
];
