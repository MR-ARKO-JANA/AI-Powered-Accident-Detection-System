import tensorflow as tf
import numpy as np
import os

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'accident_model.h5')
model = tf.keras.models.load_model(model_path)

# Black image
black_img = np.zeros((1, 224, 224, 3))
pred_black = model.predict(black_img)
print(f"Black Image Prediction: {pred_black}")

# White image
white_img = np.ones((1, 224, 224, 3))
pred_white = model.predict(white_img)
print(f"White Image Prediction: {pred_white}")
