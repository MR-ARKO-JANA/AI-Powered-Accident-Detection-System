import cv2
import os

# --- Configuration ---
IMG_HEIGHT, IMG_WIDTH = 224, 224  # Standard CNN input size
SKIP_FRAMES = 30                 # Save 1 frame per second (at ~30fps video)
ACCIDENT_START_SKIP = 0.3        # Skip first 30% of accident videos

# Build robust paths relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
ai_service_dir = os.path.dirname(script_dir)

DATASET_DIR = os.path.join(ai_service_dir, "dataset")
OUTPUT_DIR = os.path.join(ai_service_dir, "fream_collection")


def preprocess_video(video_path, save_folder, label):
    """
    Extracts, resizes, and saves frames from a single video.
    - Resizes to 224x224 (CNN-ready).
    - Skips redundant frames (every 30th frame saved).
    - For accident videos, skips the first 30% (normal driving footage).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"  ⚠ Error: Couldn't open {os.path.basename(video_path)}. Skipping...")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    is_accident = (label == "accident")

    # Skip early portion of accident videos to avoid normal driving frames
    start_frame = int(total_frames * ACCIDENT_START_SKIP) if is_accident else 0
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    frame_idx = start_frame
    saved_count = 0
    clean_name = os.path.splitext(os.path.basename(video_path))[0]

    while True:
        success, frame = cap.read()
        if not success:
            break

        # Save every SKIP_FRAMES-th frame
        if frame_idx % SKIP_FRAMES == 0:
            resized = cv2.resize(frame, (IMG_WIDTH, IMG_HEIGHT))
            img_path = os.path.join(save_folder, f"{clean_name}_f{frame_idx}.jpg")
            cv2.imwrite(img_path, resized)
            saved_count += 1

        frame_idx += 1

    cap.release()
    return saved_count


if __name__ == "__main__":
    print("=" * 40)
    print("  Image Preprocessing Pipeline")
    print("=" * 40)
    print(f"  Dataset: {DATASET_DIR}")
    print(f"  Output:  {OUTPUT_DIR}")
    print(f"  Frame Size: {IMG_WIDTH}x{IMG_HEIGHT}")
    print(f"  Skip Rate: Every {SKIP_FRAMES} frames")
    print("=" * 40)

    # Walk through all subfolders in the dataset directory
    for root, dirs, files in os.walk(DATASET_DIR):
        for file in files:
            if not file.endswith(('.mp4', '.avi', '.mov')):
                continue

            video_path = os.path.join(root, file)

            # Determine label based on folder name
            label = "non_accident" if "non_accident" in root else "accident"
            save_folder = os.path.join(OUTPUT_DIR, label)
            os.makedirs(save_folder, exist_ok=True)

            saved = preprocess_video(video_path, save_folder, label)
            print(f"  ∟ {label.upper()}: {file} -> {saved} frames saved.")

    print("\n🎉 Done! Your dataset is ready for training.")