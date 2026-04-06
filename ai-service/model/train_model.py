import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

# --- Path Configuration ---
# Using absolute paths based on script location for robustness
model_dir = os.path.dirname(os.path.abspath(__file__))
ai_service_dir = os.path.dirname(model_dir)

# This is where detect_accident.py / image_preprocessing.py save frames
base_dir = os.path.join(ai_service_dir, 'fream_collection')

# --- Training Configuration ---
img_height, img_width = 224, 224  # Must match the preprocessing resize
batch_size = 32

print("=" * 40)
print("  CNN Model Training")
print("=" * 40)
print(f"  Dataset Path: {base_dir}")
print(f"  Image Size:   {img_width}x{img_height}")
print(f"  Batch Size:   {batch_size}")
print("=" * 40)

# Verify the dataset folder exists before proceeding
if not os.path.exists(base_dir):
    print(f"\n⚠ Error: Dataset folder not found at: {base_dir}")
    print("  Run detect_accident.py or image_preprocessing.py first.")
    exit(1)

# --- Data Augmentation & Generators ---
train_datagen = ImageDataGenerator(
    rescale=1./255,             # Normalize pixel values to [0, 1]
    rotation_range=20,          # Randomly rotate images by up to 20 degrees
    width_shift_range=0.2,      # Randomly shift images horizontally by up to 20%
    height_shift_range=0.2,     # Randomly shift images vertically by up to 20%
    shear_range=0.2,            # Apply random shearing transformations
    zoom_range=0.2,             # Apply random zooming transformations
    horizontal_flip=True,       # Randomly flip images horizontally
    fill_mode='nearest',        # Fill in any new pixels created by the transformations
    validation_split=0.2        # 80% training, 20% validation
)

# Training Data Generator
train_generator = train_datagen.flow_from_directory(
    base_dir,
    target_size=(img_height, img_width),
    batch_size=batch_size,
    class_mode='binary',        # Accident vs Non-Accident
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

# Print class mapping for verification
print(f"\n  Class Indices: {train_generator.class_indices}")
print(f"  Training Samples:   {train_generator.samples}")
print(f"  Validation Samples: {validation_generator.samples}\n")

# --- CNN Model Architecture ---
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
    Dropout(0.5),               # Prevents overfitting
    Dense(1, activation='sigmoid')  # Binary output (0=non-accident, 1=accident)
])

# Compile the Model
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Display model summary
model.summary()

# --- Start Training ---
print("\nTraining started... Processing images from fream_collection.")
history = model.fit(
    train_generator,
    epochs=15,
    validation_data=validation_generator
)

# --- Save the Model ---
model_save_path = os.path.join(model_dir, 'accident_model.h5')
model.save(model_save_path)

print("\n" + "=" * 40)
print(f"  ✅ Success! Model saved at:")
print(f"  {model_save_path}")
print("=" * 40)