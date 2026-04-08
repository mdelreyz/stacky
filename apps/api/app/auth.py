import uuid

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.jwt import COOKIE_NAME, decode_access_token, is_token_revoked
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    token: str | None = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if await is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await session.execute(
        select(User).where(User.id == uuid.UUID(user_id), User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user
