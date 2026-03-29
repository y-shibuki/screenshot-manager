from contextlib import asynccontextmanager
from pathlib import Path

from alembic.config import Config
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from alembic import command

from .config import CACHE_DIR, DB_PATH, DIST_DIR
from .routers import images as images_router
from .routers import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    alembic_cfg = Config(str(Path(__file__).parent.parent / "alembic.ini"))
    command.upgrade(alembic_cfg, "head")
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(settings_router.router, prefix="/api")
app.include_router(images_router.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

if DIST_DIR.exists():

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        return FileResponse(str(DIST_DIR / "index.html"))
