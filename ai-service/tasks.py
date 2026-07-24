import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import cv2
import numpy as np
import tensorflow as tf
import requests
import datetime
import time
import socketio
import sqlite3
import json

from config import Config

# Try to import Celery (optional dependency)
try:
    from celery import Celery
    celery = Celery('tasks', broker=Config.REDIS_BROKER_URL)
except ImportError:
    celery = None

# AI Setup
model = None
try:
    model = tf.keras.models.load_model(Config.MODEL_PATH)
    print(f"✅ [Tasks] Model loaded from {Config.MODEL_PATH}")
except Exception as e:
    print(f"⚠️ [Tasks] Model load failed: {e}")

# Optional: License plate reader
reader = None
try:
    import easyocr
    reader = easyocr.Reader(['en'])
except ImportError:
    print("⚠️ [Tasks] easyocr not installed — license plate detection disabled")


def classify_severity(confidence):
    """Map confidence to severity per Backend Schema spec"""
    if confidence >= 0.8:
        return "severe"
    elif confidence >= 0.5:
        return "moderate"
    else:
        return "minor"


def get_socket():
    """Create a Socket.IO client connection"""
    sio = socketio.Client()
    try:
        sio.connect(Config.WEBSOCKET_URL)
    except Exception as e:
        print(f"⚠️ Socket.IO connection failed: {e}")
    return sio


def is_cooldown_active():
    """Check if cooldown period is still active"""
    cooldown_file = os.path.join(Config.BASE_DIR, 'cooldown.txt')
    if not os.path.exists(cooldown_file):
        return False
    try:
        with open(cooldown_file, 'r') as f:
            last_time = float(f.read().strip())
            return time.time() - last_time < Config.COOLDOWN_SECONDS
    except Exception:
        return False


def update_cooldown():
    """Update the cooldown timestamp"""
    cooldown_file = os.path.join(Config.BASE_DIR, 'cooldown.txt')
    with open(cooldown_file, 'w') as f:
        f.write(str(time.time()))


def process_frame_task(image_path):
    """Background task to run AI detection and report accident"""
    print(f"⚙️ Processing frame: {image_path}")

    img = cv2.imread(image_path)
    if img is None:
        print("❌ Could not read image.")
        return False

    if model is None:
        print("❌ Model not loaded, skipping detection.")
        return False

    # Preprocess
    resized = cv2.resize(img, (224, 224))
    normalized = resized / 255.0
    batch = np.expand_dims(normalized, axis=0)

    # Inference
    prediction = model.predict(batch, verbose=0)
    confidence = float(prediction[0][0])
    is_accident = confidence > Config.CONFIDENCE_THRESHOLD

    if is_accident:
        if is_cooldown_active():
            print(f"⏳ Cooldown active. Skipping report.")
            _cleanup(image_path)
            return False

        update_cooldown()
        severity = classify_severity(confidence)

        # License Plate Recognition (optional)
        license_plate = "Unknown"
        if reader:
            try:
                results = reader.readtext(img)
                plates = [res[1] for res in results if len(res[1]) >= 5]
                if plates:
                    license_plate = plates[0]
                    print(f"🆔 Detected Plate: {license_plate}")
            except Exception as ocr_err:
                print(f"⚠️ OCR Error: {ocr_err}")

        # Upload image to media server
        media_url = ""
        try:
            with open(image_path, 'rb') as f:
                files = {'frame': f}
                headers = {"X-API-Key": Config.API_SECRET_KEY}
                up_resp = requests.post(Config.UPLOAD_URL, files=files, headers=headers, timeout=5)
                if up_resp.status_code == 200:
                    media_url = up_resp.json().get('url', '')
                    print(f"✅ Image uploaded: {media_url}")
        except Exception as upload_err:
            print(f"⚠️ Image upload failed: {upload_err}")

        # Build payload matching new Accident schema
        payload = {
            "camId": Config.CAM_ID,
            "severity": severity,
            "confidence": confidence,
            "location": Config.LOCATION,
            "coordinates": {
                "lat": Config.CAM_LAT,
                "lng": Config.CAM_LNG
            },
            "licensePlate": license_plate,
            "mediaUrl": media_url
        }

        # Real-time push via Socket.IO
        sio = get_socket()
        if sio.connected:
            sio.emit('accident_detected_raw', payload)
            sio.disconnect()
            print(f"🚀 Real-time event pushed!")

        # Persist to backend
        try:
            headers = {"X-API-Key": Config.API_SECRET_KEY}
            response = requests.post(Config.BACKEND_URL, json=payload, headers=headers, timeout=5)
            if response.status_code == 201:
                print(f"✅ Accident saved to DB!")
            elif response.status_code == 200:
                resp_data = response.json()
                if resp_data.get('deduplicated'):
                    print(f"ℹ️ Duplicate detection — skipped")
        except Exception as e:
            print(f"⚠️ Backend error: {e}")
            # Save to offline DB for later sync
            try:
                conn = sqlite3.connect(Config.DB_FILE)
                c = conn.cursor()
                c.execute("""CREATE TABLE IF NOT EXISTS alerts
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
                c.execute("INSERT INTO alerts (payload) VALUES (?)", (json.dumps(payload),))
                conn.commit()
                conn.close()
                print("💾 Saved to offline DB for later sync")
            except Exception as db_err:
                print(f"❌ Offline DB error: {db_err}")

    _cleanup(image_path)
    return is_accident


def _cleanup(image_path):
    """Remove temporary image file"""
    try:
        if os.path.exists(image_path):
            os.remove(image_path)
    except Exception:
        pass


# Register as Celery task if available
if celery:
    process_frame_task = celery.task(process_frame_task)
