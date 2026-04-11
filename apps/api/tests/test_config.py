from pathlib import Path

from app.config import Settings


def test_settings_reads_repo_root_env_file_regardless_of_cwd():
    env_files = Settings.model_config["env_file"]

    assert isinstance(env_files, tuple)
    assert env_files[0] == str(Path(__file__).resolve().parents[3] / ".env")
    assert env_files[1] == ".env"


def test_settings_allow_localhost_and_loopback_cors_regex():
    settings = Settings()

    assert settings.cors_origin_regex == r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"


def test_settings_default_to_repo_local_sqlite_db_when_database_url_unset(monkeypatch):
    monkeypatch.delenv("PROTOCOLS_DATABASE_URL", raising=False)

    settings = Settings(_env_file=None)
    expected_path = (Path(__file__).resolve().parents[1] / "protocols.db").as_posix()

    assert settings.database_url == f"sqlite+aiosqlite:///{expected_path}"
