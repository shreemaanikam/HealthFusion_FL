"""Create a user account directly in the database (bootstrap / admin provisioning).

Public self-registration only creates DOCTOR accounts, so the first
SYSTEM_ADMIN has to be created out-of-band. Run this once against the
production database (DATABASE_URL must be set in the environment):

    python scripts/create_user.py --email admin@example.org --name "Admin" --role SYSTEM_ADMIN

The password is read from the HF_NEW_USER_PASSWORD environment variable, or
prompted for interactively. It is never accepted as a command-line argument
(which would end up in shell history / process listings).
"""

import argparse
import asyncio
import getpass
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from sqlalchemy import select  # noqa: E402

from app.core.database import SessionLocal, init_db  # noqa: E402
from app.core.security import RoleEnum, get_password_hash  # noqa: E402
from app.models.database_models import User  # noqa: E402


async def create_user(email: str, password: str, full_name: str, role: RoleEnum) -> None:
    await init_db()
    async with SessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalars().first():
            raise SystemExit(f"A user with email {email} already exists.")
        db.add(User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=role,
            is_active=True,
        ))
        await db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--role", default="SYSTEM_ADMIN", choices=[r.value for r in RoleEnum])
    args = parser.parse_args()

    password = os.environ.get("HF_NEW_USER_PASSWORD") or getpass.getpass("Password: ")
    if len(password) < 10:
        raise SystemExit("Password must be at least 10 characters.")

    asyncio.run(create_user(args.email, password, args.name, RoleEnum(args.role)))
    print(f"Created {args.role} account for {args.email}.")


if __name__ == "__main__":
    main()
