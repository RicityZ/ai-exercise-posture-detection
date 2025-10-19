from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
from utils.gemini_client import analyze_pose_with_gemini
from utils.video_utils import extract_keypoints_from_video
from werkzeug.utils import secure_filename

# โหลด environment variables จาก .env
load_dotenv()
print("[ENV] ✅ Loaded .env file")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "expose_headers": ["Content-Type", "Authorization"]}})

UPLOAD_FOLDER = "data/poses"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/poses", methods=["GET"])
def list_poses():
    """คืนรายชื่อโฟลเดอร์ท่าทางที่มีอยู่ใน data/poses"""
    try:
        if not os.path.isdir(UPLOAD_FOLDER):
            return jsonify({"poses": []})

        pose_names = []
        for name in os.listdir(UPLOAD_FOLDER):
            full_path = os.path.join(UPLOAD_FOLDER, name)
            if os.path.isdir(full_path):
                pose_names.append(name)

        pose_names.sort()
        return jsonify({"poses": pose_names})
    except Exception as e:
        print(f"[ERROR] /poses: {e}")
        return jsonify({"poses": []})

@app.route("/pose-video", methods=["GET"])
def get_pose_video():
    """ให้ URL ของวิดีโออ้างอิงตามชื่อท่า: ?pose=Squat"""
    try:
        pose = request.args.get("pose", "")
        if not pose:
            return jsonify({"url": None})

        video_dir = os.path.join(UPLOAD_FOLDER, pose, "video")
        if not os.path.isdir(video_dir):
            return jsonify({"url": None})

        # เลือกไฟล์วิดีโอแรกในโฟลเดอร์
        for fname in os.listdir(video_dir):
            if fname.lower().endswith((".mp4", ".mov", ".webm", ".mkv")):
                return jsonify({
                    "url": f"/media/{pose}/video/{fname}"
                })
        return jsonify({"url": None})
    except Exception as e:
        print(f"[ERROR] /pose-video: {e}")
        return jsonify({"url": None})

@app.route("/media/<pose>/video/<filename>")
def serve_pose_video(pose, filename):
    """เสิร์ฟไฟล์วิดีโออ้างอิงแบบ static พร้อม CORS headers"""
    try:
        directory = os.path.join(UPLOAD_FOLDER, pose, "video")
        response = send_from_directory(directory, filename, as_attachment=False)
        # เพิ่ม CORS headers สำหรับ video
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
        return response
    except Exception as e:
        print(f"[ERROR] /media: {e}")
        return ("Not Found", 404)

@app.route("/analyze-live", methods=["POST"])
def analyze_live():
    """วิเคราะห์ท่าทางแบบชุด (รับข้อมูล 10 วินาที แล้ววิเคราะห์ครั้งเดียว)"""
    try:
        data = request.get_json()
        pose_name = data.get("pose_name", "unknown")
        user_keypoints_batch = data.get("user_keypoints_batch", [])  # Array of keypoints over time
        
        print(f"\n[ANALYZE-LIVE] Received batch request for pose: {pose_name}")
        print(f"[ANALYZE-LIVE] Batch size (frames): {len(user_keypoints_batch)}")

        if not user_keypoints_batch or len(user_keypoints_batch) == 0:
            print("[ANALYZE-LIVE] ERROR: No user keypoints batch!")
            return jsonify({
                "score": 0,
                "feedback": ["[!] ไม่พบข้อมูล keypoints จากกล้อง"]
            })
        
        # เลือก frame กลางจาก batch เพื่อวิเคราะห์
        mid_frame_idx = len(user_keypoints_batch) // 2
        user_keypoints = user_keypoints_batch[mid_frame_idx]
        print(f"[ANALYZE-LIVE] Using frame {mid_frame_idx} from batch for analysis")

        # โหลด reference keypoints จาก data/poses/{pose_name}/keypoints
        keypoints_dir = os.path.join(UPLOAD_FOLDER, pose_name, "keypoints")
        reference_keypoints = None
        
        print(f"[ANALYZE-LIVE] Looking for reference keypoints in: {keypoints_dir}")
        
        if os.path.isdir(keypoints_dir):
            # หาไฟล์ JSON ล่าสุด
            json_files = [f for f in os.listdir(keypoints_dir) if f.endswith('.json')]
            print(f"[ANALYZE-LIVE] Found JSON files: {json_files}")
            
            if json_files:
                latest_json = sorted(json_files)[-1]
                json_path = os.path.join(keypoints_dir, latest_json)
                print(f"[ANALYZE-LIVE] Loading reference from: {json_path}")
                
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        ref_data = json.load(f)
                        # ดึง keypoints จาก frame แรก (หรือ frame กลาง)
                        if ref_data.get('frames') and len(ref_data['frames']) > 0:
                            mid_frame_idx = len(ref_data['frames']) // 2  # เลือก frame กลาง
                            reference_keypoints = ref_data['frames'][mid_frame_idx].get('keypoints', [])
                            print(f"[ANALYZE-LIVE] ✅ Loaded {len(reference_keypoints)} reference keypoints from frame {mid_frame_idx}")
                        else:
                            print("[ANALYZE-LIVE] ⚠️ No frames found in reference data")
                except Exception as e:
                    print(f"[ANALYZE-LIVE] ❌ Failed to load reference keypoints: {e}")
        else:
            print(f"[ANALYZE-LIVE] ⚠️ Keypoints directory not found: {keypoints_dir}")

        # ส่งทั้ง user และ reference keypoints ไปให้ Gemini
        print(f"[ANALYZE-LIVE] Sending to Gemini AI...")
        result_text = analyze_pose_with_gemini(pose_name, user_keypoints, reference_keypoints)
        print(f"[ANALYZE-LIVE] Gemini response received: {result_text[:100]}...")

        try:
            result_json = json.loads(result_text)
            print(f"[ANALYZE-LIVE] ✅ Parsed JSON successfully. Score: {result_json.get('score', 0)}")
        except Exception as e:
            print(f"[ANALYZE-LIVE] ⚠️ Failed to parse JSON: {e}")
            result_json = {"score": 0, "feedback": [result_text.strip()]}

        print(f"[ANALYZE-LIVE] Returning result to frontend\n")
        return jsonify(result_json)

    except Exception as e:
        print(f"[ANALYZE-LIVE] ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "score": 0,
            "feedback": [f"[!] เกิดข้อผิดพลาดในเซิร์ฟเวอร์: {str(e)}"]
        })


@app.route("/upload", methods=["POST"])
def upload_pose():
    """อัปโหลดวิดีโอเทรนเนอร์ และแยก keypoints ด้วย MediaPipe"""
    try:
        pose_name = request.form.get("pose_name", "unnamed_pose")
        video_file = request.files.get("video")

        if not video_file:
            return jsonify({"success": False, "message": "ไม่พบไฟล์วิดีโอ"})

        # สร้างโฟลเดอร์สำหรับท่านี้
        pose_dir = os.path.join(UPLOAD_FOLDER, pose_name)
        video_dir = os.path.join(pose_dir, "video")
        keypoints_dir = os.path.join(pose_dir, "keypoints")
        
        os.makedirs(video_dir, exist_ok=True)
        os.makedirs(keypoints_dir, exist_ok=True)

        # บันทึกวิดีโอ
        filename = secure_filename(video_file.filename)
        video_path = os.path.join(video_dir, filename)
        video_file.save(video_path)

        print(f"[UPLOAD] Video saved: {video_path}")

        # แยก keypoints จากวิดีโอด้วย MediaPipe
        keypoints_data = extract_keypoints_from_video(video_path)
        
        if keypoints_data:
            # บันทึก keypoints เป็น JSON
            keypoints_filename = filename.replace(".mp4", ".json").replace(".mov", ".json")
            keypoints_path = os.path.join(keypoints_dir, keypoints_filename)
            
            with open(keypoints_path, "w", encoding="utf-8") as f:
                json.dump(keypoints_data, f, indent=2, ensure_ascii=False)
            
            print(f"[SUCCESS] Keypoints extracted: {len(keypoints_data['frames'])} frames")
            print(f"[SUCCESS] Keypoints saved: {keypoints_path}")
            
            return jsonify({
                "success": True,
                "message": f"[OK] อัปโหลดท่า {pose_name} สำเร็จ",
                "video_path": video_path,
                "keypoints_path": keypoints_path,
                "total_frames": len(keypoints_data['frames'])
            })
        else:
            return jsonify({
                "success": False,
                "message": "[!] ไม่สามารถแยก keypoints จากวิดีโอได้"
            })

    except Exception as e:
        print(f"[ERROR] /upload: {e}")
        return jsonify({
            "success": False,
            "message": f"[!] เกิดข้อผิดพลาด: {str(e)}"
        })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print("="*50)
    print(f"[BACKEND] Pose Coach AI Server Starting...")
    print(f"[BACKEND] Running on: http://localhost:{port}")
    print(f"[BACKEND] Press CTRL+C to quit")
    print("="*50)
    app.run(host="0.0.0.0", port=port, debug=True)

