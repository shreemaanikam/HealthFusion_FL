"use client";

import { PageHeader } from "@/components/layout/PageHeader";

const faqs = [
  { 
    q: "New Assessment (Unseen Inference)", 
    a: "The New Assessment tool processes your inputs against the frozen production model. The model does NOT retrain or fit on new data you submit. It applies the exact same preprocessing used during training (scaling, encoding) and performs a forward pass to generate a prediction." 
  },
  { 
    q: "Is this a real medical diagnosis?", 
    a: "No. This system provides model-predicted risk for decision support only. It is not a medical diagnosis, is not FDA-approved, and must not be used to replace professional clinical judgment." 
  },
  { 
    q: "Patient vs Technical Explainability", 
    a: "Explainability translates the model's complex mathematical weights into human-readable insights. The 'Patient View' provides a plain-language summary of positive and negative health factors. The 'Technical View' displays exact interventional SHAP values for the specific prediction and global importance metrics." 
  },
  { 
    q: "Clinical Insights", 
    a: "Clinical Insights combine the model's statistical risk output with generative AI context to provide follow-up recommendations and patient education. Always verify these AI-generated insights." 
  },
  { 
    q: "Assessment History", 
    a: "Your previous assessments are stored securely in the database and scoped specifically to your authenticated user account. You can revisit past predictions and their corresponding explanations." 
  },
  { 
    q: "Federated Learning & Privacy Status", 
    a: "The system is designed for privacy-preserving federated learning across multiple hospitals. Currently, the federated network is running in SIMULATION mode. True multi-party secure aggregation is PLANNED. However, data locality is strictly enforced in the LIVE environment." 
  },
  { 
    q: "User Roles (RBAC)", 
    a: "Access is strictly controlled by Role-Based Access Control (RBAC). DOCTOR users can perform assessments. HOSPITAL_ADMIN users manage their hospital node. RESEARCHER users view model analytics and cross-validation reports. SYSTEM_ADMIN users oversee the entire platform." 
  },
  { 
    q: "LIVE vs SIMULATION Mode", 
    a: "When running in LIVE mode, the frontend connects to the real deployed backend, authenticates users securely via JWT, and performs real ML inference. When in SIMULATION mode, the frontend runs independently using mock data." 
  }
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader eyebrow="System" title="Help & Documentation" description="Documentation for the deployed HealthFusion_FL system." />
      <div className="mx-auto max-w-3xl divide-y divide-line px-6 py-8">
        {faqs.map((f) => (
          <div key={f.q} className="py-6">
            <h2 className="font-display text-base font-semibold text-ink">{f.q}</h2>
            <p className="mt-2 text-sm text-slate leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
