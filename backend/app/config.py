from pathlib import Path

DB_PATH = Path.home() / ".local" / "share" / "my-app" / "app.db"
CACHE_DIR = Path.home() / ".cache" / "my-app" / "thumbs"
HOST = "127.0.0.1"
PORT = 5001
DIST_DIR = Path(__file__).parent.parent.parent / "dist"
