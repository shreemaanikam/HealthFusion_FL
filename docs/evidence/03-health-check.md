# Health Check Verification

**Test:** Execute the liveness probe against the production backend.
**Endpoint/Page:** `GET /api/health`
**Status:** PASS
**HTTP Status:** 200 OK
**Expected:** `{"status": "healthy"}` with sub-components active.
**Actual:** Database, Prediction, and Explainability report ACTIVE.
