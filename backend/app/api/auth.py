from fastapi import APIRouter, HTTPException, status
from app.models.user import User, UserCreate, LoginRequest, TokenResponse, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserCreate):
    existing = await User.find_one(User.username == data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    await user.insert()
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    user = await User.find_one(User.username == data.username)
    if not user:
        user = await User.find_one(User.email == data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = create_access_token({"sub": user.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    )
