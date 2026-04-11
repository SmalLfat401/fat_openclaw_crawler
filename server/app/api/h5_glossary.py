"""
H5 术语百科接口 - 面向移动端用户提供术语查询功能
合并谷子、Coser、漫展、游戏四个领域的术语
支持滚动懒加载分页
"""
from fastapi import APIRouter, Query
from typing import Optional, List
from pydantic import BaseModel

from app.database.guzi_term_dao import guzi_term_dao
from app.database.coser_term_dao import coser_term_dao
from app.database.convention_term_dao import convention_term_dao
from app.database.game_term_dao import game_term_dao


class H5TermItem(BaseModel):
    """H5 术语项（简化版）"""
    id: str
    term: str
    definition: str
    category: str  # 大分类: guzi/coser/convention/game
    subcategory: Optional[str] = None  # 子分类: 周边类型、交易术语等
    examples: Optional[List[str]] = None


class H5TermStats(BaseModel):
    """H5 术语统计"""
    total: int
    categories: dict  # { guzi: count, coser: count, convention: count, game: count }


class H5TermListResponse(BaseModel):
    """H5 术语列表响应"""
    items: List[H5TermItem]
    total: int  # 当前分类总数量
    page: int  # 当前页码
    page_size: int  # 每页数量
    has_more: bool  # 是否有更多数据
    stats: H5TermStats


router = APIRouter(prefix="/h5/glossary", tags=["H5 术语百科"])


def _get_all_daos():
    """获取所有术语 DAO"""
    return [
        ('guzi', guzi_term_dao),
        ('coser', coser_term_dao),
        ('convention', convention_term_dao),
        ('game', game_term_dao),
    ]


def _term_to_h5_item(term, category: str) -> H5TermItem:
    """将后端术语转换为 H5 格式"""
    definition = term.usage_scenario or term.meaning

    # 处理 example
    examples = None
    if term.example:
        if isinstance(term.example, list):
            examples = term.example
        elif isinstance(term.example, str) and term.example:
            examples = [term.example]

    return H5TermItem(
        id=term.id,
        term=term.term,
        definition=definition,
        category=category,
        subcategory=term.category,
        examples=examples
    )


@router.get("", response_model=H5TermListResponse)
async def get_glossary_list(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    category: Optional[str] = Query(None, description="大分类筛选: guzi/coser/convention/game"),
    search: Optional[str] = Query(None, description="搜索术语或含义")
):
    """
    获取 H5 术语列表（分页懒加载）

    - **page**: 页码，从1开始
    - **page_size**: 每页数量，默认20，最大100
    - **category**: 可选，筛选大分类（guzi/coser/convention/game）
    - **search**: 可选，搜索术语名称或含义
    """
    items: List[H5TermItem] = []
    total = 0
    category_stats = {}

    # 计算分页偏移量
    skip = (page - 1) * page_size

    for cat_key, dao in _get_all_daos():
        # 如果指定了分类，只查询该分类
        if category and category != cat_key:
            category_stats[cat_key] = 0
            continue

        # 获取该分类的术语（带分页）
        terms = dao.find_all(
            skip=skip,
            limit=page_size,
            is_active=True,
            search=search
        )

        # 转换并添加到列表
        for term in terms:
            items.append(_term_to_h5_item(term, cat_key))

        # 获取该分类总数
        cat_total = dao.count(is_active=True, search=search)
        category_stats[cat_key] = cat_total

        # 如果指定了分类，获取总数后直接返回
        if category and category == cat_key:
            total = cat_total
            break

    # 如果没有指定分类，总数为所有分类之和
    if not category:
        total = sum(category_stats.values())

    # 判断是否还有更多数据
    has_more = total > skip + len(items)

    return H5TermListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
        stats=H5TermStats(
            total=total,
            categories=category_stats
        )
    )


@router.get("/stats", response_model=H5TermStats)
async def get_glossary_stats():
    """
    获取 H5 术语统计数据
    """
    category_stats = {}

    for cat_key, dao in _get_all_daos():
        count = dao.count(is_active=True)
        category_stats[cat_key] = count

    total = sum(category_stats.values())

    return H5TermStats(
        total=total,
        categories=category_stats
    )


@router.get("/categories")
async def get_glossary_categories():
    """
    获取 H5 术语分类列表
    """
    categories = []

    for cat_key, dao in _get_all_daos():
        count = dao.count(is_active=True)
        if count > 0:
            categories.append({
                "id": cat_key,
                "name": _get_category_name(cat_key),
                "count": count
            })

    return {"categories": categories}


def _get_category_name(cat_key: str) -> str:
    """获取分类名称"""
    names = {
        'guzi': '谷子',
        'coser': 'Coser',
        'convention': '漫展',
        'game': '游戏',
    }
    return names.get(cat_key, cat_key)
