"""
阿里妈妈淘口令生成适配器

- 淘口令: taobao.tbk.tpwd.create

将搜索返回的原始 click_url 转换为 "【xxx】₤abc123₤" 格式的淘口令。

Ref: https://open.taobao.com/doc.htm?docId=1124&docType=1
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import logging

from app.integrations.alimama.top_client import TopClient

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
#  数据结构定义
# ──────────────────────────────────────────────

@dataclass
class LinkResult:
    """单条推广链接生成结果"""
    original_url: str
    tkl: Optional[str]
    generated_at: datetime
    error: Optional[str] = None


@dataclass
class BatchLinkResult:
    """批量生成结果"""
    results: List[LinkResult]
    success_count: int = 0
    fail_count: int = 0


# ──────────────────────────────────────────────
#  淘口令生成
# ──────────────────────────────────────────────

def _generate_tkl(
    client: TopClient,
    click_url: str,
    title: str,
    image_url: Optional[str] = None,
) -> Optional[str]:
    """
    调用 taobao.tbk.tpwd.create 生成淘口令。

    Args:
        client:     TopClient 实例
        click_url:  推广链接
        title:      商品标题（用于口令文案）
        image_url:  商品图片URL（可选）

    Returns:
        淘口令字符串（如 "【xxx】₤abc123₤"），失败返回 None
    """
    # 标准化 URL
    url = click_url
    if url.startswith("//"):
        url = "https:" + url

    params: Dict[str, Any] = {
        "url": url,
        "text": title[:50],  # 口令文案最多50字
    }
    if image_url:
        params["logo"] = image_url

    try:
        data = client.request("taobao.tbk.tpwd.create", biz_params=params)
    except Exception as e:
        logger.warning(f"[LinkGen] 淘口令生成失败: {e}")
        return None

    # 解析响应
    resp = data.get("tbk_tpwd_create_response") or {}
    tpwd_data = resp.get("data") or {}

    password = tpwd_data.get("password_string")
    if password:
        logger.debug(f"[LinkGen] 淘口令生成成功: {password[:20]}...")
        return password

    if "error_response" in data:
        err = data["error_response"]
        logger.warning(f"[LinkGen] 淘口令API错误: {err.get('msg')} {err.get('sub_msg')}")
    return None


# ──────────────────────────────────────────────
#  批量生成接口
# ──────────────────────────────────────────────

def generate_promotion_links(
    client: TopClient,
    items: List[Dict[str, Any]],
) -> BatchLinkResult:
    """
    批量为商品生成淘口令。

    Args:
        client:   TopClient 实例（需包含 app_key, app_secret, adzone_id）
        items:    商品列表，每个 item 需包含 click_url 和 title
                 支持的 item 格式：
                   {"click_url": "...", "title": "...", "pict_url": "..."}
                 也兼容 search.py 返回的 NormalizedProduct 格式。

    Returns:
        BatchLinkResult: 包含每条记录的 LinkResult 列表，以及成功/失败计数
    """
    now = datetime.now(timezone.utc)
    results: List[LinkResult] = []

    for item in items:
        click_url = item.get("click_url") or item.get("url") or ""
        title = item.get("title", "")
        image_url = item.get("pict_url") or item.get("image_url") or ""

        if not click_url:
            result = LinkResult(
                original_url="",
                tkl=None,
                generated_at=now,
                error="click_url 为空",
            )
            results.append(result)
            continue

        tkl = _generate_tkl(client, click_url, title, image_url or None)

        error = None if tkl else "淘口令"

        results.append(LinkResult(
            original_url=click_url,
            tkl=tkl,
            generated_at=now,
            error=error,
        ))

    success_count = sum(1 for r in results if r.tkl)
    fail_count = len(results) - success_count

    return BatchLinkResult(
        results=results,
        success_count=success_count,
        fail_count=fail_count,
    )


# ──────────────────────────────────────────────
#  便捷封装：单个商品
# ───────��──────────────────────────────────────

def generate_single_link(
    client: TopClient,
    click_url: str,
    title: str,
    image_url: Optional[str] = None,
) -> LinkResult:
    """
    为单个商品生成淘口令。
    """
    result = generate_promotion_links(
        client,
        items=[{"click_url": click_url, "title": title, "pict_url": image_url}],
    )
    return result.results[0]
