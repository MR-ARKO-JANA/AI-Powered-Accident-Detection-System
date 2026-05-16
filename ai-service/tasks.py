import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' 
import cv2
import numpy as np
import tensorflow as tf
from celery import Celery
import easyocr
import requests
import datetime
import time
import socketio
import sqlite3
import json

from config import Config

# Celery Setup
celery = Celery('tasks', broker=Config.REDIS_BROKER_URL)

# AI Setup
model = tf.keras.models.load_model(Config.MODEL_PATH)
reader = easyocr.Reader(['en'])

# Socket.io Client (Created inside task to avoid thread issues)
def get_socket():
    sio = socketio.Client()
    try:
        sio.connect(Config.WEBSOCKET_URL)
    except Exception as e:
        print(f"⚠️ Task Socket.io connection failed: {e}")
    return sio

# We use Redis or DB to handle cooldown state since Celery workers are stateless
# For simplicity in this upgrade, we'll write the last report time to a small local file
def is_cooldown_active():
    cooldown_file = 'cooldown.txt'
    if not os.path.exists(cooldown_file):
        return False
    with open(cooldown_file, 'r') as f:
        try:
            last_time = float(f.read().strip())
            if time.time() - last_time < Config.COOLDOWN_SECONDS:
                return True
        except:
            pass
    return False

def update_cooldown():
    with open('cooldown.txt', 'w') as f:
        f.write(str(time.time()))

@celery.task
def process_frame_task(image_path):
    """Background task to run AI detection and report accident"""
    print(f"⚙️ Celery picked up task for: {image_path}")
    
    img = cv2.imread(image_path)
    if img is None:
        print("❌ Could not read image.")
        return

    # Resize for prediction
    resized_img = cv2.resize(img, (224, 224))
    normalized_img = resized_img / 255.0
    batch_img = np.expand_dims(normalized_img, axis=0)

    prediction = model.predict(batch_img)
    confidence = float(prediction[0][0])
    is_accident = confidence > 0.3

    if is_accident:
        if is_cooldown_active():
            print(f"⏳ Cooldown active. Skipping report for {image_path}")
            os.remove(image_path)
            return

        update_cooldown()

        # License Plate Recognition
        license_plate = "Unknown"
        try:
            print("🔍 Running License Plate Recognition...")
            results = reader.readtext(img)
            plates = [res[1] for res in results if len(res[1]) >= 5]
            if plates:
                license_plate = plates[0]
                print(f"🆔 Detected Plate: {license_plate}")
        except Exception as ocr_err:
            print(f"⚠️ OCR Error: {ocr_err}")

        # Upload image to local simulated cloud storage
        media_url = ""
        try:
            print("☁️ Uploading image to media server...")
            with open(image_path, 'rb') as f:
                files = {'frame': f}
                up_resp = requests.post(Config.UPLOAD_URL, files=files, timeout=5)
                if up_resp.status_code == 200:
                    media_url = up_resp.json().get('url', '')
                    print(f"✅ Image uploaded: {media_url}")
        except Exception as upload_err:
            print(f"⚠️ Image upload failed: {upload_err}")

        payload = {
            "camId": Config.CAM_ID,
            "severity": "High" if confidence > 0.8 else "Low",
            "location": Config.LOCATION,
            "time": datetime.datetime.now().strftime("%I:%M %p"),
            "coordinates": {
                "lat": 22.5726,
                "lng": 88.3639
            },
            "licensePlate": license_plate,
            "mediaUrl": media_url
        }

        sio = get_socket()
        if sio.connected:
            sio.emit('accident_detected_raw', payload)
            sio.disconnect()
            print(f"🚀 Pushed real-time event via Celery!")

        try:
            response = requests.post(Config.BACKEND_URL, json=payload, timeout=3)
            if response.status_code == 201:
                print(f"✅ Accident saved to DB from Celery!")
        except Exception as e:
            print(f"⚠️ Network error reporting to backend: {e}")
            # Save to offline DB
            conn = sqlite3.connect(Config.DB_FILE)
            c = conn.cursor()
            c.execute("INSERT INTO alerts (payload) VALUES (?)", (json.dumps(payload),))
            conn.commit()
            conn.close()

    # Clean up the temp image
    try:
        os.remove(image_path)
    except:
        pass
    
    return is_accident
