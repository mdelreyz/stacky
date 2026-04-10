from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_session
from app.jwt import create_access_token, hash_password, set_auth_cookie, verify_password
from app.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
    MeResponse,
    SignupRequest,
    SignupResponse,
    UpdateMeRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse, status_code=201)
@limiter.limit(settings.rate_limit_auth)
async def signup(
    request: Request,
    data: SignupRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> SignupResponse:
    result = await session.execute(select(User).where(User.email == data.email, User.deleted_at.is_(None)))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    try:
        session.add(user)
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    await session.refresh(user)

    access_token = create_access_token(str(user.id))
    set_auth_cookie(response, access_token)
    return SignupResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(user),
    )


@router.post("/login", response_model=LoginResponse)
@limiter.limit(settings.rate_limit_auth)
async def login(
    request: Request,
    data: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> LoginResponse:
    result = await session.execute(select(User).where(User.email == data.email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(str(user.id))
    set_auth_cookie(response, access_token)
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(user),
    )


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse.model_validate(current_user)


@router.patch("/me", response_model=MeResponse)
async def update_me(
    data: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MeResponse:
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)

    try:
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    await session.refresh(current_user)
    return MeResponse.model_validate(current_user)
