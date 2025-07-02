from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, health
# import easyocr
# import shutil
# import os

app = FastAPI()
# reader = easyocr.Reader(['en'])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(health.router, prefix="/api", tags=["health"])

# @app.post("/ocr")
# async def perform_ocr(file: UploadFile = File(...)):
#     temp_path = f"temp_{file.filename}"
    
#     with open(temp_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
    
#     result = reader.readtext(temp_path)
#     os.remove(temp_path)

#     # Format result as plain text
#     extracted_text = [item[1] for item in result]
#     return {"text": extracted_text}
