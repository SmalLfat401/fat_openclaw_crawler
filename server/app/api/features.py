"""
API routes for feature flags.
"""
from fastapi import APIRouter
from app.config.features import features


router = APIRouter()


@router.get("/features")
async def get_features():
    """
    获取功能开关状态

    前端在初始化时调用此接口，根据返回的配置决定各功能的显示/隐藏
    """
    return {
        "success": True,
        "data": features.summary()
    }
