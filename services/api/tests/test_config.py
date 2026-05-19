from pathlib import Path

from app.core.config import default_env_files


def test_default_env_files_include_repo_root_env() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    env_files = {Path(path) for path in default_env_files()}

    assert repo_root.joinpath(".env") in env_files
    assert repo_root.joinpath(".env.local") in env_files
