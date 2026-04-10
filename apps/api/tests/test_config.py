from pathlib import Path

from app.config import Settings


def test_settings_reads_repo_root_env_file_regardless_of_cwd():
    env_files = Settings.model_config["env_file"]

    assert isinstance(env_files, tuple)
    assert env_files[0] == str(Path(__file__).resolve().parents[3] / ".env")
    assert env_files[1] == ".env"
