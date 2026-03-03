from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import os
import shutil
from datetime import datetime
from detector import analyze_frame, reload_known_faces
from firebase_config import initialize_firebase

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = initialize_firebase()

@app.get("/")
def root():
    return {"status": "Sentinel AI Backend Running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """Receive image frame from frontend webcam and run detection."""
    contents = await file.read()
    nparr    = np.frombuffer(contents, np.uint8)
    image    = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return {"error": "Invalid image"}
    result = analyze_frame(image)
    if result["label"] != "error":
        db.collection("alerts").add({
            "label":         result["label"],
            "confidence":    result["confidence"],
            "timestamp":     result["timestamp"],
            "alert":         result["alert"],
            "high_priority": result.get("high_priority", False)
        })
    return result

@app.get("/alerts")
def get_alerts():
    docs = db.collection("alerts").order_by(
        "timestamp", direction="DESCENDING").limit(20).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

@app.get("/logs")
def get_logs():
    docs = db.collection("alerts").order_by(
        "timestamp", direction="DESCENDING").limit(50).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

@app.post("/register-face")
async def register_face(name: str, file: UploadFile = File(...)):
    """Save face photo and rebuild embeddings immediately."""
    os.makedirs("known_faces", exist_ok=True)
    file_path = f"known_faces/{name}.jpg"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    reload_known_faces()
    return {"message": f"Face registered for {name}"}
