# Role-Based Access Control Verification

**Test:** Verify protected endpoints reject unprivileged tokens.
**Endpoint/Page:** `GET /api/users/me` and `POST /api/federated/train`
**Status:** PASS
**HTTP Status:** 200 OK (for /me) / 403 Forbidden (for admin routes)
**Expected:** A `DOCTOR` role can access prediction but is forbidden from triggering system-wide federation.
**Actual:** RBAC guards successfully enforce policies on live infrastructure.
