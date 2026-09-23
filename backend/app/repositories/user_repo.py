"""
NEW FILE -- DB access for users, following the same repository pattern
already used in app/repositories/translation_repo.py (unchanged).
"""
from sqlalchemy.orm import Session

from app.models.user import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    full_name: str,
    email: str,
    hashed_password: str,
    role: str,
    school_name: str = "",
    district: str = "",
) -> User:
    user = User(
        full_name=full_name.strip(),
        email=email.lower().strip(),
        hashed_password=hashed_password,
        role=role,
        school_name=(school_name or "").strip(),
        district=(district or "").strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_profile(
    db: Session,
    user: User,
    full_name: str | None = None,
    school_name: str | None = None,
    district: str | None = None,
) -> User:
    if full_name is not None:
        user.full_name = full_name.strip()
    if school_name is not None:
        user.school_name = school_name.strip()
    if district is not None:
        user.district = district.strip()
    db.commit()
    db.refresh(user)
    return user
