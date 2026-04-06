# Import necessary libraries
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


# Function to process individual videos and save frames
def process_video(video_path, output_folder, prefix, is_accident=False):
    """
    Extracts frames from a single video file.
    - Skips frames for efficiency (every SKIP_FRAMES-th frame).
    - Resizes frames to 224x224 for CNN compatibility.
    - For accident videos, skips the first 30% to focus on the crash.
    """
    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"  ⚠ Error: Couldn't open {video_path}. Skipping...")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # For accident videos, skip the initial "normal driving" portion
    start_frame = int(total_frames * ACCIDENT_START_SKIP) if is_accident else 0
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    frame_idx = start_frame
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Save only every SKIP_FRAMES-th frame to avoid redundancy
        if frame_idx % SKIP_FRAMES == 0:
            # Resize to CNN input dimensions
            resized = cv2.resize(frame, (IMG_WIDTH, IMG_HEIGHT))

            frame_name = f"{prefix}_frame_{frame_idx}.jpg"
            frame_path = os.path.join(output_folder, frame_name)
            cv2.imwrite(frame_path, resized)
            saved_count += 1

        frame_idx += 1

    cap.release()
    return saved_count


# Function to extract frames from all videos in a folder
def extract_frames_folder(video_folder, output_folder, prefix, is_accident=False):
    """
    Iterates through all video files in a folder and extracts frames.
    """
    total_saved = 0

    # Check if the video folder exists
    if not os.path.exists(video_folder):
        print(f"  ⚠ Error: {video_folder} does not exist.")
        return 0

    # Filter for video files only
    video_files = [f for f in os.listdir(video_folder)
                   if f.endswith(('.mp4', '.avi', '.mov'))]

    if not video_files:
        print(f"  ⚠ No video files found in {video_folder}")
        return 0

    for video_file in video_files:
        video_path = os.path.join(video_folder, video_file)

        saved = process_video(video_path, output_folder, prefix, is_accident)
        total_saved += saved
        print(f"  ∟ Saved {saved} frames from {video_file}")

    return total_saved


if __name__ == "__main__":
    print("=" * 40)
    print("  Video Frame Extraction Tool")
    print("=" * 40)
    print(f"  Dataset: {DATASET_DIR}")
    print(f"  Output:  {OUTPUT_DIR}")
    print(f"  Frame Size: {IMG_WIDTH}x{IMG_HEIGHT}")
    print(f"  Skip Rate: Every {SKIP_FRAMES} frames")
    print("=" * 40)

    # 1. Extract frames from Accident videos
    # Note: Your folder is named "accident_vdeo" (not "accident_video")
    print("\n--- Processing Accident Videos ---")
    accident_video_dir = os.path.join(DATASET_DIR, "accident_vdeo")
    accident_output_dir = os.path.join(OUTPUT_DIR, "accident")
    acc_frames = extract_frames_folder(accident_video_dir, accident_output_dir, "ACC", is_accident=True)

    # 2. Extract frames from Non-Accident videos
    print("\n--- Processing Non-Accident Videos ---")
    non_accident_video_dir = os.path.join(DATASET_DIR, "non_accident_video")
    non_accident_output_dir = os.path.join(OUTPUT_DIR, "non_accident")
    norm_frames = extract_frames_folder(non_accident_video_dir, non_accident_output_dir, "NOR", is_accident=False)

    print("\n" + "=" * 40)
    print(f"  ✅ Extraction Complete!")
    print(f"  Accident frames saved:     {acc_frames}")
    print(f"  Non-Accident frames saved: {norm_frames}")
    print(f"  Total frames saved:        {acc_frames + norm_frames}")
    print("=" * 40)