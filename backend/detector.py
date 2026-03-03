import cv2
import numpy as np
import os
import tempfile
import time
from datetime import datetime
from deepface import DeepFace
from sms_alert import send_alert   # ? Twilio integration

KNOWN_FACES_DIR = "known_faces"
BLACKLIST = ["swiggy", "zomato", "police", "postman"]

# Alert cooldown settings
last_alert_time = 0
ALERT_COOLDOWN = 60  # seconds


# -- Pre-load DeepFace model ------------------------------------------------
print("? Loading DeepFace model... please wait")

try:
    dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        tmp_path = tmp.name
        cv2.imwrite(tmp_path, dummy)

    try:
        DeepFace.represent(tmp_path, model_name="VGG-Face", enforce_detection=False)
    except:
        pass

    os.remove(tmp_path)
    print("? DeepFace model loaded!")

except Exception as e:
    print(f"?? Model preload warning: {e}")


# -- Known face embeddings cache --------------------------------------------
known_embeddings = {}


def clean_name(filename):
    name = filename
    for ext in ['.jpg', '.jpeg', '.png']:
        while name.lower().endswith(ext):
            name = name[:-len(ext)]
    return name.strip()


def build_known_embeddings():
    global known_embeddings
    known_embeddings = {}

    if not os.path.exists(KNOWN_FACES_DIR):
        os.makedirs(KNOWN_FACES_DIR)
        print("?? Created known_faces folder")
        return

    files = [f for f in os.listdir(KNOWN_FACES_DIR)
             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    if not files:
        print("?? No faces in known_faces folder!")
        return

    print(f"?? Building embeddings for {len(files)} file(s)...")

    for face_file in files:
        name = clean_name(face_file)

        if name.lower() in BLACKLIST:
            print(f"?? Skipping blacklisted: {face_file}")
            continue

        face_path = os.path.join(KNOWN_FACES_DIR, face_file)

        try:
            result = DeepFace.represent(
                img_path=face_path,
                model_name="VGG-Face",
                enforce_detection=False
            )

            if result:
                known_embeddings[name] = np.array(result[0]["embedding"])
                print(f"? Loaded: {name}")

        except Exception as e:
            print(f"? Error loading {face_file}: {e}")

    print("?? Recognition ready:", list(known_embeddings.keys()))


build_known_embeddings()


def cosine_similarity(a, b):
    dot = np.dot(a, b)
    normA = np.linalg.norm(a)
    normB = np.linalg.norm(b)

    if normA == 0 or normB == 0:
        return 0.0

    return dot / (normA * normB)


def recognize_face(image):
    if not known_embeddings:
        return "unknown", 0

    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp_path = tmp.name
            cv2.imwrite(tmp_path, image)

        result = DeepFace.represent(
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
            return "unknown", 0

    except Exception as e:
        print(f"? Recognition error: {e}")
        return "unknown", 0

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def detect_uniform_color(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    total = image.shape[0] * image.shape[1]

    orange = cv2.inRange(hsv, np.array([8,150,150]), np.array([20,255,255]))
    red = (cv2.inRange(hsv, np.array([0,150,150]), np.array([5,255,255])) +
           cv2.inRange(hsv, np.array([175,150,150]), np.array([180,255,255])))
    khaki = cv2.inRange(hsv, np.array([18,40,130]), np.array([28,90,190]))

    op = (cv2.countNonZero(orange) / total) * 100
    rp = (cv2.countNonZero(red) / total) * 100
    kp = (cv2.countNonZero(khaki) / total) * 100

    # return label, confidence, and raw percentages for logging
    if op > 25:
        return "swiggy", round(op, 2), {"orange": op, "red": rp, "khaki": kp}
    if rp > 25:
        return "zomato", round(rp, 2), {"orange": op, "red": rp, "khaki": kp}
    if kp > 25:
        return "postman_or_police", round(kp, 2), {"orange": op, "red": rp, "khaki": kp}

    return None, 0, {"orange": op, "red": rp, "khaki": kp}


def analyze_frame(image):
    global last_alert_time

    h, w = image.shape[:2]
    if w > 640:
        image = cv2.resize(image, (640, int(h * 640 / w)))

    # 1️⃣ Check uniform
    uniform_type, confidence, percents = detect_uniform_color(image)
    print(f"🎨 Orange:{percents['orange']:.1f}% | Red:{percents['red']:.1f}% | Khaki:{percents['khaki']:.1f}%")

    if uniform_type:
        print(f"🟨 Uniform detected: {uniform_type} ({confidence}%)")
        label = uniform_type
        alert = True
    else:
        print("🔎 No uniform — checking face...")
        # generate embedding for incoming frame
        tmp_path = None
        incoming_emb = None
        try:
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                tmp_path = tmp.name
                cv2.imwrite(tmp_path, image)
            res = DeepFace.represent(img_path=tmp_path, model_name="VGG-Face", enforce_detection=False)
            if res:
                incoming_emb = np.array(res[0]["embedding"])
        except Exception as e:
            print(f"❌ Embedding error: {e}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

        best_name = None
        best_sim = 0.0
        THRESHOLD = 0.45
        print("🔎 Face scores:")
        if incoming_emb is not None and known_embeddings:
            for name, emb in known_embeddings.items():
                sim = cosine_similarity(incoming_emb, emb)
                print(f"   {name}: {sim:.4f}")
                if sim > best_sim:
                    best_sim = sim
                    best_name = name
        if best_sim >= THRESHOLD:
            confidence = round(best_sim * 100, 2)
            label = f"family_{best_name}"
            alert = False
            print(f"✅ MATCH → {best_name} (score={best_sim:.4f}, {confidence}%)")
        else:
            confidence = round(best_sim * 100, 2)
            label = "unknown"
            alert = True
            print(f"❌ UNKNOWN — best={best_name}:{best_sim:.4f} (need ≥0.45)")

    is_night = datetime.now().hour >= 23 or datetime.now().hour <= 5

    result = {
        "label": label,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat(),
        "alert": alert,
        "high_priority": alert and is_night
    }

    # 2️⃣ Send SMS if needed
    if result["alert"]:
        current_time = time.time()
        if current_time - last_alert_time > ALERT_COOLDOWN:
            try:
                send_alert(label, confidence)
            except Exception as e:
                print(f"⚠️ Alert sending failed: {e}")
            last_alert_time = current_time

    print(f"👤 Result: {label} | alert={alert} | night={is_night}")
    return result


def reload_known_faces():
    """Rebuild the known face embeddings cache and return the available names."""
    build_known_embeddings()
    return list(known_embeddings.keys())
