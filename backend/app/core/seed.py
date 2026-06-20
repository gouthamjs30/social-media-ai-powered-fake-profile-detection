from app.models.user import User
from app.core.security import get_password_hash

DEMO_USERS = [
    {
        "username": "admin",
        "email": "admin@mayajal.io",
        "password": "admin123",
        "full_name": "Admin User",
        "role": "admin",
    },
    {
        "username": "investigator",
        "email": "inv@mayajal.io",
        "password": "inv123",
        "full_name": "Lead Investigator",
        "role": "investigator",
    },
    {
        "username": "user",
        "email": "user@mayajal.io",
        "password": "user123",
        "full_name": "Demo User",
        "role": "user",
    },
]

async def seed_demo_data():
    for profile in DEMO_USERS:
        existing = await User.find_one(User.username == profile["username"])
        if existing:
            continue

        user = User(
            username=profile["username"],
            email=profile["email"],
            hashed_password=get_password_hash(profile["password"]),
            full_name=profile["full_name"],
            role=profile["role"],
        )
        await user.insert()
