import cv2
import mediapipe as mp
import json
import sys

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_keypoints_from_video(video_path):
    """
    Extract keypoints from video using MediaPipe Pose
    
    Returns:
        dict: Contains video info, fps, and keypoints for each frame
    """
    try:
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"[ERROR] Cannot open video: {video_path}")
            return None

        # Get video info
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"[VIDEO] FPS: {fps}, Total Frames: {total_frames_count}")

        # Start MediaPipe Pose
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        frames_data = []
        frame_number = 0

        print("[PROCESSING] Extracting keypoints...")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert to RGB (MediaPipe uses RGB)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect pose
            results = pose.process(frame_rgb)

            if results.pose_landmarks:
                # Convert landmarks to keypoints
                keypoints = []
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    keypoint = {
                        "name": mp_pose.PoseLandmark(idx).name,
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    }
                    keypoints.append(keypoint)

                # Store frame data
                frame_data = {
                    "frame_number": frame_number,
                    "timestamp": frame_number / fps,
                    "keypoints": keypoints
                }
                frames_data.append(frame_data)

            frame_number += 1

            # Show progress
            if frame_number % 30 == 0:
                progress = (frame_number / total_frames_count) * 100
                print(f"[PROGRESS] {progress:.1f}% ({frame_number}/{total_frames_count} frames)")

        cap.release()
        pose.close()

        print(f"[SUCCESS] Keypoints extracted: {len(frames_data)} frames")

        return {
            "video_path": video_path,
            "fps": fps,
            "total_frames": len(frames_data),
            "frames": frames_data
        }

    except Exception as e:
        print(f"[ERROR] extract_keypoints_from_video: {e}")
        return None
