import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' 
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify  # Added for the AI API [cite: 46, 49]
from flask_cors import CORS # Recommended for handling cross-origin requests from React [cite: 66]

app = Flask(__name__)
CORS(app)  # Enable CORS so React frontend can call this API

from tasks import process_frame_task
import uuid


from config import Config

# Removed old socket and daemon logic as it is now in tasks.py

@app.route('/detect', methods=['POST'])
def detect():
    if "frame" not in request.files:
        return jsonify({"error": "NO fream provided"}),400

    file = request.files['frame']
    # Save frame temporarily for Celery
    temp_dir = Config.TEMP_DIR
        
    file_path = os.path.join(temp_dir, f"{uuid.uuid4()}.jpg")
    file.save(file_path)

    # Offload processing to Celery background task or background thread
    if Config.USE_CELERY:
        process_frame_task.delay(file_path)
    else:
        import threading
        threading.Thread(target=process_frame_task, args=(file_path,), daemon=True).start()

    # Return immediately so the camera feed doesn't freeze
    return jsonify({
        "status": "queued",
        "message": "Frame processing in background"
    }), 202

if __name__ == '__main__':
    app.run(debug=Config.DEBUG_MODE, host='0.0.0.0', port=Config.PORT)




