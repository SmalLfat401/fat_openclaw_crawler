"""
Feature Flags - 功能开关配置

统一从 settings 读取（settings 已整合环境变量和 .env 文件）
"""
from app.config.settings import settings


class FeatureFlags:
    """功能开关配置"""

    # 微博用户管理 + 爬虫模块总开关
    WEIBO_USERS_ENABLED = settings.feature_weibo_users

    # 微博情报管理 + 信息提取（始终启用）
    WEIBO_INTEL_ENABLED = True

    # LLM 对接
    LLM_ENABLED = settings.feature_llm

    @classmethod
    def summary(cls) -> dict:
        """返回所有功能开关状态（用于调试）"""
        return {
            "WEIBO_USERS_ENABLED": cls.WEIBO_USERS_ENABLED,
            "WEIBO_INTEL_ENABLED": cls.WEIBO_INTEL_ENABLED,
            "LLM_ENABLED": cls.LLM_ENABLED,
        }


# 全局单例
features = FeatureFlags()
