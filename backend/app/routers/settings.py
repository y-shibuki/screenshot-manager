from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Setting

router = APIRouter()


class SettingValue(BaseModel):
    value: str


@router.get("/settings/{key}")
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}


@router.put("/settings/{key}")
async def put_setting(key: str, body: SettingValue, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting is None:
        setting = Setting(key=key, value=body.value)
        db.add(setting)
    else:
        setting.value = body.value
    await db.commit()
    return {"key": key, "value": body.value}
