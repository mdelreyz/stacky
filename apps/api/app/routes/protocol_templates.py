import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.protocol_template import ProtocolTemplate
from app.models.user import User
from app.schemas.protocol_template import (
    AdoptTemplateResponse,
    ProtocolTemplateListItem,
    ProtocolTemplateResponse,
)
from app.services.template_adoption import adopt_template

router = APIRouter(prefix="/protocol-templates", tags=["protocol-templates"])


@router.get("", response_model=list[ProtocolTemplateListItem])
async def list_templates(
    category: str | None = None,
    featured_only: bool = False,
    session: AsyncSession = Depends(get_session),
):
    """List all protocol templates. No auth required — templates are public."""
    query = select(ProtocolTemplate).order_by(
        ProtocolTemplate.is_featured.desc(),
        ProtocolTemplate.sort_order,
        ProtocolTemplate.name,
    )
    if category:
        query = query.where(ProtocolTemplate.category == category)
    if featured_only:
        query = query.where(ProtocolTemplate.is_featured.is_(True))

    result = await session.execute(query)
    templates = result.scalars().all()
    return [
        ProtocolTemplateListItem(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            difficulty=t.difficulty,
            icon=t.icon,
            is_featured=t.is_featured,
            items_count=len(t.items or []),
            tags=t.tags,
            adoption_count=t.adoption_count,
        )
        for t in templates
    ]


@router.get("/{template_id}", response_model=ProtocolTemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific template with full item details. No auth required."""
    result = await session.execute(
        select(ProtocolTemplate).where(ProtocolTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return ProtocolTemplateResponse.model_validate(template)


@router.post("/{template_id}/adopt", response_model=AdoptTemplateResponse)
async def adopt_protocol_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Adopt a template — creates user items for missing catalog items and assembles a protocol."""
    result = await session.execute(
        select(ProtocolTemplate).where(ProtocolTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    adoption_result = await adopt_template(session, current_user.id, template)
    return AdoptTemplateResponse(**adoption_result)
