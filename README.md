# HealthFusion_FL

**HealthFusion_FL is a privacy-preserving healthcare AI research prototype combining machine-learning prediction, Explainable AI, and federated-learning simulation into a deployed web platform.**

## 🚀 Live Demo

- **Live Frontend (Vercel):** [https://healthfusionflfrontend.vercel.app](https://healthfusionflfrontend.vercel.app)
- **Live Backend (Render):** [https://healthfusion-fl-backend.onrender.com/api/health](https://healthfusion-fl-backend.onrender.com/api/health)

*(Note: The live backend is hosted on a free Render tier and may take 30-60 seconds to cold start if inactive.)*

---

## 🛠️ Architecture & Technology Stack

HealthFusion_FL is designed as a secure, distributed system targeting healthcare compliance paradigms. 

### Frontend / Client (Next.js)
- **Framework:** Next.js 14 (App Router) + React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (Edge-optimized)

### Backend / API (FastAPI)
- **Framework:** FastAPI (Python 3.12)
- **Database:** Supabase PostgreSQL (via Session Pooler) + SQLAlchemy ORM
- **Security:** JWT Authentication + Role-Based Access Control (RBAC)
- **Deployment:** Dockerized on Render

### AI / ML & Federated Learning
- **Prediction Model:** TensorFlow / Keras (Multi-layer perceptron)
- **Explainable AI (XAI):** SHAP (KernelExplainer/TreeExplainer)
- **Federated Learning:** Flower (Flwr) simulation framework
- **Generative Insights:** OpenRouter API (LLM integration)

---

## 🧩 Core Features & Feature Status

To accurately reflect the current state of this research prototype, subsystems are classified by their deployment reality:

- **Authentication & RBAC:** **ACTIVE** (JWT, strict roles: Doctor, Admin, Researcher)
- **PostgreSQL Database:** **ACTIVE** (Supabase Session Pooler)
- **TensorFlow Inference:** **ACTIVE** (Deployed on Render CPU compute)
- **SHAP Explainability:** **ACTIVE** (Local feature contributions computed on the fly)
- **Generative AI Insights:** **ACTIVE / OPTIONAL** (Falls back to deterministic insights if OpenRouter is unavailable)
- **Federated Learning:** **SIMULATION** (Runs locally via Flower to simulate hospital nodes, not actively aggregating live web traffic)
- **Differential Privacy:** **SIMULATION** (Algorithmically modeled but not actively distorting live user gradients)
- **Secure Aggregation:** **PLANNED** (Architectural provision made, not fully implemented)

---

## 🔒 Privacy & Security Mechanisms

1. **Role-Based Access Control:** Clinical predictions require a `DOCTOR` role. System management requires `SYSTEM_ADMIN`.
2. **Data Locality:** By design (in the FL architecture), raw patient data never leaves the hospital node.
3. **Audit Logging:** Immutable audit trails record when predictions are made and by whom.
4. **No Silent Fallbacks:** The production frontend strictly connects to the live backend without falling back to local/demo data (`NEXT_PUBLIC_DEMO_MODE=false`).

---

## 💻 Local Development

### 1. Backend Setup
```bash
git clone https://github.com/shreemaanikam/HealthFusion_FL.git
cd HealthFusion_FL

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Set SQLite or local Postgres in .env
python main.py
```
Backend runs at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd healthfusion-fl-Frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```
Frontend runs at `http://localhost:3000`.

### 3. ML / Federated Pipeline
```bash
# Centralized training
python -m src.ml.train_tensorflow

# Federated Learning simulation
python -m src.federated.runner
```

---

## 🌐 Production Deployment Summary

- **Frontend:** Deployed statically to Vercel. Connects securely to the Render backend. Environment variables hide demo-mode switches.
- **Backend:** Deployed as a Docker web service on Render.
- **Database:** Supabase PostgreSQL handles relational data (Users, Models, Audit Logs, Organizations).
- **CORS:** Strictly limited to the exact Vercel origin. No wildcards or localhost allowed in production.

For exhaustive deployment instructions, see [`docs/deployment.md`](docs/deployment.md).

---

## 📁 Project Structure

```
HealthFusion_FL/
├── healthfusion-fl-Frontend/ # Next.js Vercel Frontend
├── backend/                  # FastAPI Application
├── src/                      # ML, Federated Learning, and Explainability logic
├── docs/                     # Technical specifications and Evidence
├── models/                   # Serialized TensorFlow models
├── data/                     # Local datasets (ignored in git)
├── tests/                    # Backend test suite (pytest)
└── requirements.txt          # Python dependencies
```

---

## 🧪 Testing & Verification

The repository enforces strict continuous integration standards:
- **Backend:** `pytest` suite ensuring robust RBAC and endpoint contracts (60+ tests).
- **Frontend:** Jest suite covering React components and API client integrations (69 tests). TypeScript strictly type-checked.
- **Security:** Static secrets scans and live-CORS enforcement.

---

## ⚠️ Limitations & Responsible-Use Disclaimer

**This is a research prototype, not a certified medical device.**
- **No Medical Diagnosis:** Predictions generated by the system are experimental and must not be used for actual clinical decision-making.
- **No Real Patient Data:** The live system uses synthetic testing data. The underlying model was trained on an anonymized public Kaggle dataset.
- **Not HIPAA Compliant:** While architected with privacy in mind, this specific deployment has not undergone formal compliance auditing or certification.
- **Federated Simulation:** The federated learning aspect is a simulation demonstrating feasibility, not a distributed network of real hospital servers.

---

## 📄 License

This project is intended for academic research and portfolio demonstration. See [LICENSE](LICENSE) (if applicable) for terms of use.
