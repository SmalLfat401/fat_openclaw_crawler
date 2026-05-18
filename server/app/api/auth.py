"""
Authentication API endpoints.

前端提交规则（密码混淆算法）：
  1. 密码末尾补空格到 4 的倍数长度
  2. 每 4 个字符为一组，分别做 MD5 哈希
  3. 第 1、2 组互换位置后拼接，即为提交值

后端验证时，对写死的明文密码执行同样的混淆算法，再与提交值比较。

账号密码以数组形式写在代码中，格式: [username, password]
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
import hashlib


router = APIRouter()

# 管理员账号列表 [username, password]
# 可添加多个账号，格式保持一致
ADMINS: List[List[str]] = [
    ["15802539468", "caomingyu1018"],
]


def _obfuscate(plain: str) -> str:
    """
    对明文密码应用混淆算法，返回混淆后的字符串。
    与前端 obfuscatePassword() 逻辑完全对称。
    """
    padded = plain.ljust(((len(plain) + 3) // 4) * 4)
    groups = [padded[i : i + 4] for i in range(0, len(padded), 4)]
    if len(groups) >= 2:
        groups[0], groups[1] = groups[1], groups[0]
    return "".join(hashlib.md5(g.encode()).hexdigest() for g in groups)


# 预计算所有账号的混淆密码（启动时做一次，避免每次请求重复计算）
_ADMIN_OBFUSCATED: Dict[str, str] = {
    cred[0]: _obfuscate(cred[1]) for cred in ADMINS
}


@router.post("/auth/login")
async def login(username: str, password: str) -> Dict[str, Any]:
    """
    验证账号密码（密码须经前端混淆后提交）。
    验证成功后返回登录时间和用户名，前端自行管理 session（localStorage）。
    """
    obfuscated_stored = _ADMIN_OBFUSCATED.get(username)

    if not obfuscated_stored or obfuscated_stored != password:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    return {
        "success": True,
        "username": username,
        "login_at": datetime.now().isoformat(),
        "message": "登录成功",
    }
