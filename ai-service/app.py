import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

from config import Config

# Load model at startup
model = None
try:
    model = tf.keras.models.load_model(Config.MODEL_PATH)
    print(f"✅ Model loaded from {Config.MODEL_PATH}")
except Exception as e:
    print(f"⚠️ Model load failed: {e} — running in mock mode")


def classify_severity(confidence):
    """Map confidence score to severity level per Backend Schema spec"""
    if confidence >= 0.8:
        return "severe"
    elif confidence >= 0.5:
        return "moderate"
    else:
        return "minor"


@app.route('/health', methods=['GET'])
def health():
    """Service liveness probe for monitoring/orchestration"""
    return jsonify({
        "service": "ai-service",
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": Config.MODEL_PATH,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200


@app.route('/detect', methods=['POST'])
def detect():
    """
    POST /detect — Accident Detection Endpoint
    
    Accepts: multipart/form-data with 'frame' file
    Returns: JSON with accident_detected, confidence, severity, frame_timestamp
    
    Supports two modes:
    - Synchronous (default): Returns detection result inline
    - Async (USE_CELERY=True): Queues for background processing
    """
    if "frame" not in request.files:
        return jsonify({"error": "No frame provided"}), 400

    file = request.files['frame']

    # Read image from file buffer
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Could not decode image"}), 400

    # If async mode enabled, save and queue
    if Config.USE_CELERY:
        import uuid
        temp_dir = Config.TEMP_DIR
        file_path = os.path.join(temp_dir, f"{uuid.uuid4()}.jpg")
        cv2.imwrite(file_path, img)

        from tasks import process_frame_task
        process_frame_task.delay(file_path)

        return jsonify({
            "status": "queued",
            "message": "Frame processing in background"
        }), 202

    # Synchronous detection — return result inline
    if model is None:
        return jsonify({
            "accident_detected": False,
            "confidence": 0.0,
            "severity": "minor",
            "frame_timestamp": datetime.now(timezone.utc).isoformat(),
            "error": "Model not loaded"
        }), 200

    # Preprocess
    resized = cv2.resize(img, (224, 224))
    normalized = resized / 255.0
    batch = np.expand_dims(normalized, axis=0)

    # Inference
    prediction = model.predict(batch, verbose=0)
    confidence = float(prediction[0][0])
    is_accident = confidence > Config.CONFIDENCE_THRESHOLD

    severity = classify_severity(confidence) if is_accident else "minor"

    result = {
        "accident_detected": is_accident,
        "confidence": round(confidence, 4),
        "severity": severity,
        "frame_timestamp": datetime.now(timezone.utc).isoformat()
    }

    return jsonify(result), 200


if __name__ == '__main__':
    app.run(debug=Config.DEBUG_MODE, host='0.0.0.0', port=Config.PORT)
