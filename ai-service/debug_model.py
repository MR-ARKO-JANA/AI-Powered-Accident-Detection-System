import tensorflow as tf
import numpy as np
import os

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'accident_model.h5')

if not os.path.exists(model_path):
    print(f"❌ Model file not found at {model_path}")
    exit(1)

model = tf.keras.models.load_model(model_path)
print("✅ Model loaded successfully.")
print(f"Model Summary:\n")
model.summary()

# Test with random image
test_img = np.random.rand(1, 224, 224, 3)
prediction = model.predict(test_img)
print(f"\nTest Prediction Output: {prediction}")
print(f"Prediction Shape: {prediction.shape}")
