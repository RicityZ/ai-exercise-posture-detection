from utils.video_utils import extract_keypoints_from_video
import json

# Test extract keypoints from uploaded video
video_path = "data/poses/Squat/video/fitness_app_V1-0007_480.mov"

print("="*60)
print(f"Testing keypoint extraction from: {video_path}")
print("="*60)

result = extract_keypoints_from_video(video_path)

if result:
    print("\n[SUCCESS] Keypoint extraction completed!")
    print(f"  - Total frames: {result['total_frames']}")
    print(f"  - FPS: {result['fps']}")
    print(f"  - First frame has {len(result['frames'][0]['keypoints'])} keypoints")
    
    # บันทึก keypoints
    output_path = "data/poses/Squat/keypoints/fitness_app_V1-0007_480.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] Keypoints saved to: {output_path}")
else:
    print("\n[ERROR] Failed to extract keypoints")

