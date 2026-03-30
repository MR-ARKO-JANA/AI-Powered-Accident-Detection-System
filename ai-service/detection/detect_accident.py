# Importing all necessary librarise
import cv2
import os
# env\Scripts\activate
print("Extrection start......")


# process The video or Marge file and folder 
def process_video(video_path, output_subfolder, prefix): 

    if not os.path.exists(output_subfolder):
        os.makedirs(output_subfolder)

    cap = cv2.VideoCapture(video_path)
    count = 0

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        frame_name = f"{prefix}_frame_{count}.jpg"
        frame_path = os.path.join(output_subfolder, frame_name)

        cv2.imwrite(frame_path, frame)
        count += 1

    cap.release()
    return count    

def extract_frames_folder(video_folder, output_folder, prefix):
        total_saved = 0

        video_files = [f for f in os.listdir(video_folder)
                   if f.endswith(('.mp4', '.avi', '.mov'))]

        if not video_files:
            print(f"{video_folder} not exist")
            return 0

        for video_file in video_files:
            video_path = os.path.join(video_folder, video_file)
            video_name = os.path.splitext(video_file)[0]

            output_subfolder = os.path.join(output_folder,
            video_name
        )

            saved = process_video(video_path, output_subfolder, prefix)
            total_saved += saved

        return total_saved





if __name__ == "__main__" :
    print("__Accident Video.......")
    acc_fream = extract_frames_folder("dataset/accident_vdeo","fream_collection/accident","ACC")

    print("non__Accident Video.......")
    norm_fream = extract_frames("dataset/non_accident_video","fream_collection/non_accident","nor")


    

