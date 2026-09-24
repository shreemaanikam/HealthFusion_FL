#!/usr/bin/env python3
"""
HealthFusion_FL — Main Entry Point

Explainable Adaptive Federated Healthcare Intelligence Framework

Usage:
    # Start the backend API server
    python main.py

    # Or use uvicorn directly
    cd backend && uvicorn app.main:app --reload --port 8000
"""

import sys
import os

# Add project root and backend to path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, "backend"))


def main() -> None:
    """Start the HealthFusion_FL backend server."""
    import uvicorn
    from dotenv import load_dotenv

    load_dotenv()

    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    print("=" * 60)
    print("HealthFusion_FL — Starting Backend Server")
    print("=" * 60)
    print(f"  Host:  {host}")
    print(f"  Port:  {port}")
    print(f"  Debug: {debug}")
    print(f"  Docs:  http://{host}:{port}/docs")
    print("=" * 60)

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info",
        app_dir=os.path.join(project_root, "backend"),
    )


if __name__ == "__main__":
    main()
