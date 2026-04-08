from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.jwt import create_access_token, hash_password, set_auth_cookie, verify_password
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
    MeResponse,
    SignupRequest,
    SignupResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse, status_code=201)
async def signup(
    request: Request,
    data: SignupRequest,
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
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
    body = SignupResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(user),
    )
    response = JSONResponse(content=body.model_dump(mode="json"), status_code=201)
    set_auth_cookie(response, access_token)
    return response


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    data: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    result = await session.execute(select(User).where(User.email == data.email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(str(user.id))
    body = LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(user),
    )
    response = JSONResponse(content=body.model_dump(mode="json"), status_code=200)
    set_auth_cookie(response, access_token)
    return response


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse.model_validate(current_user)
