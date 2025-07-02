from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import schemas, user
from app.api import deps
from passlib.context import CryptContext
from app.core import security

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


router = APIRouter()

@router.post("/register", response_model=schemas.AuthResponse)
def register(credentials: schemas.RegisterCredentials, db: Session = Depends(deps.get_db)):
    existing_user = db.query(user.User).filter(user.User.email == credentials.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = get_password_hash(credentials.password)

    new_user = user.User(
        email=credentials.email,
        first_name=credentials.firstName,
        last_name=credentials.lastName,
        currency="AUD",
        hashed_password=hashed_password  # save hashed password, NOT plain text
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = security.create_access_token(data={"sub": new_user.email})

    user_model = schemas.UserSchema.model_validate(new_user)

    return schemas.AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_model
    )

@router.post("/login", response_model=schemas.AuthResponse)
def login(credentials: schemas.LoginCredentials, db: Session = Depends(deps.get_db)):
    # Find the user by email
    user_in_db = db.query(user.User).filter(user.User.email == credentials.email).first()
    if not user_in_db:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    # Verify password hash
    if not verify_password(credentials.password, user_in_db.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    access_token = security.create_access_token(data={"sub": user_in_db.email})

    user_model = schemas.UserSchema.model_validate(user_in_db)

    return schemas.AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_model
    )

@router.get("/me", response_model=schemas.UserSchema)
def get_me(current_user: user.User = Depends(deps.get_current_user)):
    return current_user
