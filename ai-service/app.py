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

    # Resize to 224x224 (same size we trained with)
    img = cv2.resize(img, (224, 224))

    # Normalize: convert pixel values from 0-255 to 0.0-1.0
    img = img / 255.0
    
    # Add batch dimension: (224,224,3) → (1,224,224,3)
    # The model expects a "batch" of images, even if it's just one
    img = np.expand_dims(img, axis=0)

    # Run the image through the model
    prediction = model.predict(img)
    
    # prediction is like [[0.87]], so we grab the number
    confidence = float(prediction[0][0])
    
    # If confidence > 0.5, it's an accident
    is_accident = confidence > 0.5

    # return the result to the frontend
    return jsonify({
        "accident": is_accident,
        "confidence": round(confidence, 4)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)




