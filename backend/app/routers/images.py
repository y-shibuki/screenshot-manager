import hashlib
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from PIL import Image
from pydantic import BaseModel
from send2trash import send2trash

from ..config import CACHE_DIR

router = APIRouter()

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}


class DeleteRequest(BaseModel):
    path: str


@router.get("/images")
async def list_images(folder_path: str = Query(...)):
    folder = Path(folder_path)
    if not folder.exists() or not folder.is_dir():
        raise HTTPException(status_code=400, detail="Invalid folder path")

    images = []
    for f in folder.iterdir():
        if f.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue
        stat = f.stat()
        images.append(
            {
                "path": str(f),
                "name": f.name,
                "modified_at": stat.st_mtime,
                "size": stat.st_size,
                "thumb_url": f"/api/images/thumb{f}",
                "full_url": f"/api/images/full{f}",
            }
        )

    images.sort(key=lambda x: x["modified_at"], reverse=True)
    return {"images": images}


@router.delete("/images")
async def delete_image(body: DeleteRequest):
    path = Path(body.path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        send2trash(str(path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True}


@router.get("/images/thumb/{path:path}")
async def get_thumbnail(path: str):
    source = Path(f"/{path}")
    if not source.exists():
        raise HTTPException(status_code=404, detail="File not found")

    cache_key = hashlib.sha256(str(source).encode()).hexdigest()
    cache_path = CACHE_DIR / f"{cache_key}.jpg"

    if not cache_path.exists() or cache_path.stat().st_mtime < source.stat().st_mtime:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        img = Image.open(source)
        img.thumbnail((300, 300))
        if img.mode != "RGB":
            if img.mode in ("RGBA", "LA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[-1])
                img = bg
            else:
                img = img.convert("RGB")
        img.save(str(cache_path), "JPEG", quality=80)

    return FileResponse(str(cache_path), media_type="image/jpeg")


@router.get("/images/full/{path:path}")
async def get_full_image(path: str):
    source = Path(f"/{path}")
    if not source.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(source))
