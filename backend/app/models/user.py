from beanie import Document
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    user = "user"
    investigator = "investigator"
    admin = "admin"
    organization = "organization"

class User(Document):
    username: str
    email: EmailStr
    hashed_password: str
    role: UserRole = UserRole.user
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.user

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
