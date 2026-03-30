import cv2
import os

# We define these at the top so they're easy to change if the folders move
DATASET_PATH = "../dataset"
SAVE_PATH = "../fream_collection"
SKIP_FRAMES = 30  # Extract 1 frame every second (approx)

if __name__ == "__main__":
    # Get the absolute path to make sure we aren't chasing ghosts
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    
    dataset_dir = os.path.join(base_dir, "dataset")
    output_dir = os.path.join(base_dir, "fream_collection")

    print(f"🚀 Starting dataset prep in: {base_dir}")

    # Walk through folders like a human searching for files
    for root, dirs, files in os.walk(dataset_dir):
        for file in files:
            if not file.endswith(".mp4"):
                continue
                
            video_path = os.path.join(root, file)
            
            # Simple check: Is this an accident or just normal driving?
            label = "non_accident" if "non_accident" in root else "accident"
            save_folder = os.path.join(output_dir, label)
            os.makedirs(save_folder, exist_ok=True)

            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                print(f"❌ Error: Couldn't open {file}. Moving to next...")
                continue

            # --- THE "HUMAN" FIX FOR YOUR PROBLEM ---
            # If it's an accident video, the crash usually isn't at the very start.
            # Let's skip the first 30% of the video to avoid 'normal' driving frames.
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            start_frame = int(total_frames * 0.3) if label == "accident" else 0
            
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
            frame_idx = start_frame
            saved_count = 0

            while True:
                success, frame = cap.read()
                if not success:
                    break

                # Save every 30th frame
                if frame_idx % SKIP_FRAMES == 0:
                    # Clean filename (removes .mp4 extension)
                    clean_name = os.path.splitext(file)[0]
                    img_path = os.path.join(save_folder, f"{clean_name}_f{frame_idx}.jpg")
                    
                    # Resize to 224x224 (Standard for CNNs like TensorFlow)
                    resized = cv2.resize(frame, (224, 224))
                    cv2.imwrite(img_path, resized)
                    saved_count += 1

                frame_idx += 1

            cap.release()
            print(f"  ∟ ✅ {label.upper()}: {file} -> {saved_count} frames saved.")

    print("\n🎉 Done! Your dataset is ready for training.")