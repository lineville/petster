"""Docker-compose alternative: run PostgreSQL locally for development."""

import subprocess
import sys


def start_postgres():
    """Start a PostgreSQL container for local dev."""
    cmd = [
        "docker", "run",
        "--name", "petster-postgres",
        "-e", "POSTGRES_USER=petster",
        "-e", "POSTGRES_PASSWORD=petster",
        "-e", "POSTGRES_DB=petster",
        "-p", "5432:5432",
        "-d",
        "postgres:16-alpine",
    ]
    print("Starting PostgreSQL container...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("✅  PostgreSQL running on localhost:5432")
    else:
        # Container might already exist
        subprocess.run(
            ["docker", "start", "petster-postgres"],
            capture_output=True,
            text=True,
        )
        print("✅  PostgreSQL container started (already existed)")


if __name__ == "__main__":
    start_postgres()
