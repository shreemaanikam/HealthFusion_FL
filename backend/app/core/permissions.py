"""
Authorization policy for HealthFusion_FL.

Single source of truth for which roles may call which protected API family.
The matrix mirrors the role scoping the frontend already uses for navigation
(components/layout/nav-config.ts), but the backend is the real enforcement point:
hiding a link in the UI is not security.

Enforced centrally in app/main.py via router-level dependencies, so any route
later added to one of these routers is protected automatically.
"""

from app.core.security import RoleEnum

R = RoleEnum

# Audit trail: administrators only.
AUDIT_READERS = (R.HOSPITAL_ADMIN, R.SYSTEM_ADMIN)

# Federated network, model registry: operators and researchers.
NETWORK_READERS = (R.HOSPITAL_ADMIN, R.RESEARCHER, R.SYSTEM_ADMIN)

# Privacy controls and posture: administrators only.
PRIVACY_READERS = (R.HOSPITAL_ADMIN, R.SYSTEM_ADMIN)

# Roles that may create accounts with an elevated role.
USER_PROVISIONERS = (R.SYSTEM_ADMIN,)

# Role that anyone may self-register as (least privilege).
SELF_REGISTER_ROLE = R.DOCTOR
