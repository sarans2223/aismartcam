import cv2
import numpy as np
import os
import tempfile
import time
from datetime import datetime


# Lazy DeepFace loader
_deepface = None

def get_deepface():
    global _deepface
    if _deepface is None:
        try:
            from deepface import DeepFace
            _deepface = DeepFace
        except Exception as e:
            print(f"❌ DeepFace import failed: {e}")
            _deepface = None
    return _deepface


KNOWN_FACES_DIR = "known_faces"
BLACKLIST = ["swiggy", "zomato", "police", "postman"]

last_alert_time = 0
ALERT_COOLDOWN = 60  # seconds

known_embeddings = {}


# ─────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────

def clean_name(filename):
    name = filename
    for ext in ['.jpg', '.jpeg', '.png']:
        while name.lower().endswith(ext):
            name = name[:-len(ext)]
    return name.strip()


def cosine_similarity(a, b):
    dot = np.dot(a, b)
    normA = np.linalg.norm(a)
    normB = np.linalg.norm(b)

    if normA == 0 or normB == 0:
        return 0.0

    return dot / (normA * normB)


# ─────────────────────────────────────────────
# Build Known Face Embeddings
# ─────────────────────────────────────────────

def build_known_embeddings():
    global known_embeddings
    known_embeddings = {}

    if not os.path.exists(KNOWN_FACES_DIR):
        os.makedirs(KNOWN_FACES_DIR)
        print("📁 Created known_faces folder")
        return

    files = [f for f in os.listdir(KNOWN_FACES_DIR)
             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    if not files:
        print("⚠️ No faces in known_faces folder!")
        return

    print(f"👥 Building embeddings for {len(files)} file(s)...")

    df = get_deepface()
    if df is None:
        print("❌ DeepFace unavailable")
        return

    for face_file in files:
        name = clean_name(face_file)

        if name.lower() in BLACKLIST:
            continue

        face_path = os.path.join(KNOWN_FACES_DIR, face_file)

        try:
            result = df.represent(
                img_path=face_path,
                model_name="VGG-Face",
                enforce_detection=False
            )

            if result:
                known_embeddings[name] = np.array(result[0]["embedding"])
                print(f"✅ Loaded: {name}")

        except Exception as e:
            print(f"❌ Error loading {face_file}: {e}")

    print("🎯 Ready:", list(known_embeddings.keys()))


# Build embeddings at startup
build_known_embeddings()


# ─────────────────────────────────────────────
# Uniform Detection
# ─────────────────────────────────────────────

def detect_uniform_color(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    total = image.shape[0] * image.shape[1]

    orange = cv2.inRange(hsv, np.array([8,150,150]), np.array([20,255,255]))
    red = (
        cv2.inRange(hsv, np.array([0,150,150]), np.array([5,255,255])) +
        cv2.inRange(hsv, np.array([175,150,150]), np.array([180,255,255]))
    )
    khaki = cv2.inRange(hsv, np.array([18,40,130]), np.array([28,90,190]))

    op = (cv2.countNonZero(orange) / total) * 100
    rp = (cv2.countNonZero(red) / total) * 100
    kp = (cv2.countNonZero(khaki) / total) * 100

    if op > 25:
        return "swiggy", round(op, 2)
    if rp > 25:
        return "zomato", round(rp, 2)
    if kp > 25:
        return "postman_or_police", round(kp, 2)

    return None, 0


# ─────────────────────────────────────────────
# Face Recognition
# ─────────────────────────────────────────────

def recognize_face(image):
    if not known_embeddings:
        return "unknown", 0

    df = get_deepface()
    if df is None:
        return "unknown", 0

    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp_path = tmp.name
            cv2.imwrite(tmp_path, image)

        result = df.represent(
            img_path=tmp_path,
            model_name="VGG-Face",
            enforce_detection=False
        )

        if not result:
            return "unknown", 0

        incoming_emb = np.array(result[0]["embedding"])

        best_name = None
        best_similarity = 0.0

        for name, known_emb in known_embeddings.items():
            sim = cosine_similarity(incoming_emb, known_emb)
            if sim > best_similarity:
                best_similarity = sim
                best_name = name

        THRESHOLD = 0.45

        if best_similarity >= THRESHOLD:
            confidence = round(best_similarity * 100, 2)
            return f"family_{best_name}", confidence
        else:
            return "unknown", round(best_similarity * 100, 2)

    except Exception as e:
        print(f"❌ Recognition error: {e}")
        return "unknown", 0

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ─────────────────────────────────────────────
# Main Detection Pipeline
# ─────────────────────────────────────────────

def analyze_frame(image):
    global last_alert_time

    h, w = image.shape[:2]
    if w > 640:
        image = cv2.resize(image, (640, int(h * 640 / w)))

    # 1️⃣ Uniform check
    uniform_type, confidence = detect_uniform_color(image)

    if uniform_type:
        label = uniform_type
        alert = True
    else:
        identity, confidence = recognize_face(image)
        label = identity
        alert = not identity.startswith("family_")

    is_night = datetime.now().hour >= 23 or datetime.now().hour <= 5

    result = {
        "label": label,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat(),
        "alert": alert,
        "high_priority": alert and is_night
    }

    # 2️⃣ SMS Alert with cooldown
    if result["alert"]:
        current_time = time.time()
        if current_time - last_alert_time > ALERT_COOLDOWN:
            try:
                from sms_alert import send_alert
                send_alert(label, confidence)
            except Exception as e:
                print(f"⚠️ SMS failed: {e}")
            last_alert_time = current_time

    print(f"👤 Result: {label} | alert={alert} | night={is_night}")
    return result


def reload_known_faces():
    build_known_embeddings()
    return list(known_embeddings.keys())