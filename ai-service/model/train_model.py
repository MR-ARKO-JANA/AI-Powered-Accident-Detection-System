import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

current_file_path = os.path.abspath(__file__)
model_dir = os.path.dirname(current_file_path)
ai_service_dir = os.path.dirname(model_dir)

base_dir = os.path.join(ai_service_dir, 'fream_collection')
print(base_dir)

img_height, img_width = 224, 224
batch_size = 32

train_datagen= ImageDataGenerator(
    rescale= 1./255, # Normalize pixel values to [0, 1]
    rotation_range = 20, # Randomly rotate images by up to 20 degrees
    width_shift_range=0.2, # Randomly shift images horizontally by up to 20%
    height_shift_range=0.2, # Randomly shift images vertically by up to 20%
    shear_range=0.2, # Apply random shearing transformations
    zoom_range=0.2, # Apply random zooming transformations
    horizontal_flip=True, # Randomly flip images horizontally
    fill_mode='nearest', # Fill in any new pixels created by the transformations
    validation_split=0.2 # Split the data into training and validation sets
)

# Training Data Generator
train_generator = train_datagen.flow_from_directory(
    base_dir,
    target_size=(img_height, img_width), # Resizing
    batch_size=batch_size,
    class_mode='binary',      # Accident vs Non-Accident
    subset='training'
)

# Validation Data Generator
validation_generator = train_datagen.flow_from_directory(
    base_dir,
    target_size=(img_height, img_width),
    batch_size=batch_size,
    class_mode='binary',
    subset='validation'
)

#  CNN Model Architecture
model = Sequential([
    # First Convolutional Layer
    Conv2D(32, (3, 3), activation='relu', input_shape=(img_height, img_width, 3)),
    MaxPooling2D(2, 2),
    
    # Second Convolutional Layer
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    
    # Third Convolutional Layer
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),             # Prevents overfitting
    Dense(1, activation='sigmoid') # Final output (0 for non-accident, 1 for accident)
])

# Compile the Model
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Start Training
print("Training started... Processing images from fream_collection.")
model.fit(
    train_generator,
    epochs=15,                # Standard for a project of this scale
    validation_data=validation_generator
)

# Save the Model (Week 1: Day 3 goal)
model_save_path = os.path.join(model_dir, 'accident_model.h5')
model.save(model_save_path)

print("-" * 30)
print(f"Success! Model saved at: {model_save_path}")
print("-" * 30)