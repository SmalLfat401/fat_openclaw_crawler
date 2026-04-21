"""
Configuration settings for the crawler application.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""

    # FastAPI Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Feature Flags（统一由 FEATURE_WEIBO_USERS 控制微博+爬虫整套模块）
    feature_weibo_users: bool = True
    feature_llm: bool = True

    # Playwright Settings
    playwright_browser_type: str = "chromium"
    playwright_headless: bool = True
    playwright_timeout: int = 30000

    # Crawler Settings
    default_user_agent: str = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    max_concurrent_tasks: int = 5

    # LLM API（用于 AI 助写功能）
    # 支持 DeepSeek / OpenAI 等兼容 OpenAI Chat Completion 协议的模型服务商
    # 申请 DeepSeek: https://platform.deepseek.com/
    # 申请 OpenAI: https://platform.openai.com/
    llm_api_key: str = "sk-eaefde6568f549e98f020c11669aa849"
    llm_model: str = "deepseek-chat"
    llm_base_url: str = "https://api.deepseek.com"

    # OpenClaw API (Optional)
    openclaw_api_url: Optional[str] = None
    openclaw_api_key: Optional[str] = None

    # MongoDB Settings
    # 使用哪个环境：local / production（决定下面 host/port/user/password 的取值）
    mongodb_env: str = "production"

    # MongoDB 本地环境配置
    local_mongodb_host: str = "localhost"
    local_mongodb_port: int = 27017
    local_mongodb_db: str = "guozi_cai"
    local_mongodb_user: Optional[str] = None
    local_mongodb_password: Optional[str] = None

    # MongoDB 线上环境配置
    prod_mongodb_host: str = "172.16.8.53"
    prod_mongodb_port: int = 27017
    prod_mongodb_db: str = "guozi_cai"
    prod_mongodb_user: Optional[str] = "hentre"
    prod_mongodb_password: Optional[str] = "Hentre2026!"

    mongodb_max_pool_size: int = 50
    mongodb_min_pool_size: int = 5
    mongodb_max_idle_time_ms: int = 1800000

    @property
    def mongodb_host(self) -> str:
        return self.local_mongodb_host if self.mongodb_env == "local" else self.prod_mongodb_host

    @property
    def mongodb_port(self) -> int:
        return self.local_mongodb_port if self.mongodb_env == "local" else self.prod_mongodb_port

    @property
    def mongodb_db(self) -> str:
        return self.local_mongodb_db if self.mongodb_env == "local" else self.prod_mongodb_db

    @property
    def mongodb_user(self) -> Optional[str]:
        return self.local_mongodb_user if self.mongodb_env == "local" else self.prod_mongodb_user

    @property
    def mongodb_password(self) -> Optional[str]:
        return self.local_mongodb_password if self.mongodb_env == "local" else self.prod_mongodb_password

    def get_mongodb_connection_string(self) -> str:
        """Get MongoDB connection string."""
        from urllib.parse import quote_plus
        if self.mongodb_user and self.mongodb_password:
            encoded_user = quote_plus(self.mongodb_user)
            encoded_password = quote_plus(self.mongodb_password)
            return f"mongodb://{encoded_user}:{encoded_password}@{self.mongodb_host}:{self.mongodb_port}/{self.mongodb_db}?authSource=admin"
        else:
            return f"mongodb://{self.mongodb_host}:{self.mongodb_port}/{self.mongodb_db}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create a singleton instance
settings = Settings()
