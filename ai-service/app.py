import cv2
import numpy as np
import tensorflow as tf
import os  # Added for path handling 
from flask import Flask, request, jsonify  # Added for the AI API [cite: 46, 49]
from flask_cors import CORS # Recommended for handling cross-origin requests from React [cite: 66]

app = Flask(__name__)
CORS(app)  # Enable CORS so React frontend can call this API

# Build absolute path to model so the server can run from any directory
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'accident_model.h5')
model = tf.keras.models.load_model(model_path)

import requests
import datetime
import time
import socketio
import sqlite3
import threading
import json

# Socket.io Client Setup
sio = socketio.Client()

@sio.event
def connect():
    print("🔌 Connected to Node.js WebSocket Server")

@sio.event
def disconnect():
    print("❌ Disconnected from Node.js WebSocket Server")

try:
    sio.connect('http://localhost:5000')
except Exception as e:
    print(f"⚠️ Socket.io connection failed: {e}")

# Cooldown to prevent spamming alerts (e.g., 30 seconds)
last_report_time = 0
COOLDOWN_SECONDS = 30
BACKEND_URL = "http://localhost:5000/api/accidents"

# --- OFFLINE QUEUING SETUP ---
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'offline_alerts.db')

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS alerts
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  payload TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

def recovery_daemon():
    """Background thread to flush queued offline alerts when connection returns."""
    while True:
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, payload FROM alerts")
            rows = c.fetchall()
            
            if rows:
                print(f"🔄 Recovery Daemon found {len(rows)} offline alerts. Attempting flush...")
                for row in rows:
                    alert_id, payload_str = row
                    payload = json.loads(payload_str)
                    
                    try:
                        resp = requests.post(BACKEND_URL, json=payload, timeout=3)
                        if resp.status_code == 201:
                            c.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
                            conn.commit()
                            print(f"✅ Offline alert {alert_id} successfully flushed to backend.")
                    except Exception as req_err:
                        break # Still offline, break loop to try again later
            conn.close()
        except Exception as e:
            print(f"⚠️ Recovery Daemon Error: {e}")
        
        time.sleep(5) # Check every 5 seconds

# Start the daemon
daemon = threading.Thread(target=recovery_daemon, daemon=True)
daemon.start()
# -----------------------------

def report_accident_to_backend(confidence):
    """Sends accident details to the Node.js backend API and emits via Socket.io"""
    global last_report_time
    current_time = time.time()
    
    if current_time - last_report_time < COOLDOWN_SECONDS:
        print(f"⏳ Cooldown active. Skipping report. (Next in {int(COOLDOWN_SECONDS - (current_time - last_report_time))}s)")
        return

    payload = {
        "severity": "High" if confidence > 0.8 else "Low",
        "location": "Main Intersection (AI Detection)",
        "time": datetime.datetime.now().strftime("%I:%M %p"),
        "coordinates": {
            "lat": 22.5726,
            "lng": 88.3639
        }
    }

    # PUSH TO WEBSOCKET INSTANTLY (The exact millisecond)
    try:
        sio.emit('accident_detected_raw', payload)
        print(f"🚀 Pushed real-time event to Socket.io! Confidence: {confidence}")
    except Exception as e:
        print(f"⚠️ Socket.io emit failed: {e}")

    # Also save to DB via HTTP for persistence
    try:
        response = requests.post(BACKEND_URL, json=payload, timeout=3)
        if response.status_code == 201:
            last_report_time = current_time
            print(f"✅ Accident saved to DB!")
        else:
            print(f"❌ Failed to save to DB: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Network error reporting to backend: {e}")
        print("💾 Saving to local SQLite offline queue...")
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("INSERT INTO alerts (payload) VALUES (?)", (json.dumps(payload),))
            conn.commit()
            conn.close()
            last_report_time = current_time # Update cooldown even if offline
        except Exception as db_err:
            print(f"❌ Critical Error: Could not save to offline DB! {db_err}")

@app.route('/detect', methods=['POST'])
def detect():
    if "frame" not in request.files:
        return jsonify({"error": "NO fream provided"}),400

    file = request.files['frame']
    # Read the file bytes into memory
    file_bytes = file.read()

    # Convert bytes to a numpy array
    np_array = np.frombuffer(file_bytes, np.uint8)

    # Decode the numpy array into an actual image (like opening a .jpg)
    img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Failed to decode image"}), 400

    # Resize to 224x224 (same size we trained with)
    img = cv2.resize(img, (224, 224))

    # Normalize: convert pixel values from 0-255 to 0.0-1.0
    img = img / 255.0
    
    # Add batch dimension: (224,224,3) → (1,224,224,3)
    img = np.expand_dims(img, axis=0)

    # Run the image through the model
    prediction = model.predict(img)
    
    # prediction is like [[0.87]], so we grab the number
    confidence = float(prediction[0][0])
    
    # DEBUG: Print confidence for every frame to help the user calibrate
    print(f"DEBUG: Frame processed. Confidence: {round(confidence, 4)}")
    
    # If confidence > 0.3, it's an accident (Lowered threshold for better sensitivity)
    is_accident = confidence > 0.3

    # If accident detected, report to backend automatically
    if is_accident:
        report_accident_to_backend(round(confidence, 4))

    # return the result to the frontend
    return jsonify({
        "accident": is_accident,
        "confidence": round(confidence, 4)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)




