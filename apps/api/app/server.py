"""Server startup with automatic free-port detection.

Tries the configured port first. If it's already in use, probes upward
until a free port is found. The actual port is written to ``<repo>/.api-port``
so the frontend can discover it at runtime.
"""

import socket
import sys
from pathlib import Path

import uvicorn

from app.config import settings

_REPO_ROOT = Path(__file__).resolve().parents[3]
_PORT_FILE = _REPO_ROOT / ".api-port"
_MAX_PROBE = 10  # try up to 10 consecutive ports


def _is_port_free(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex((host, port)) != 0


def find_free_port(host: str, start_port: int) -> int:
    for offset in range(_MAX_PROBE):
        port = start_port + offset
        if _is_port_free(host, port):
            return port
    # All probed ports busy — let uvicorn fail with a clear message
    return start_port


def write_port_file(port: int) -> None:
    _PORT_FILE.write_text(str(port))


def main() -> None:
    host = settings.host
    preferred = settings.port

    port = find_free_port("127.0.0.1", preferred)
    if port != preferred:
        print(f"Port {preferred} is busy — using {port} instead")

    write_port_file(port)
    print(f"Protocols API starting on http://127.0.0.1:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload="--reload" in sys.argv,
    )


if __name__ == "__main__":
    main()
