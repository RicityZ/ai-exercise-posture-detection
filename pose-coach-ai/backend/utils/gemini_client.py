from google import genai
import os
import json

# สร้าง Gemini client (API key จะถูกอ่านจาก environment variable GEMINI_API_KEY อัตโนมัติ)
try:
    client = genai.Client()
    print(f"[GEMINI] ✅ Client initialized successfully")
except Exception as e:
    print(f"[GEMINI] ⚠️ Warning: {e}")
    client = None

def analyze_pose_with_gemini(pose_name, user_keypoints, reference_keypoints=None):
    """
    ส่งข้อมูล keypoints ผู้ใช้และ reference ไปให้ Gemini วิเคราะห์เปรียบเทียบ
    """
    
    # สร้าง prompt ที่มีทั้ง user และ reference keypoints
    if reference_keypoints:
        prompt = f"""
คุณเป็นเทรนเนอร์ AI มืออาชีพด้านฟิตเนสและท่าทางการออกกำลังกาย

ชื่อท่าที่กำลังฝึก: {pose_name}

ข้อมูล keypoints ของผู้ใช้ (จากกล้อง):
{json.dumps(user_keypoints, indent=2, ensure_ascii=False)}

ข้อมูล keypoints ของท่ามาตรฐาน (reference):
{json.dumps(reference_keypoints, indent=2, ensure_ascii=False)}

โปรดเปรียบเทียบและวิเคราะห์:
1. เปรียบเทียบท่าของผู้ใช้กับท่ามาตรฐาน
2. ระบุจุดที่แตกต่าง เช่น:
   - มุมข้อต่อต่างกัน (เข่า สะโพก ไหล่)
   - ตำแหน่งของแขน ขา หลัง
   - ความสมดุลของร่างกาย
3. ให้คะแนน 0–100 (100 = เหมือนท่ามาตรฐานมาก)
4. เขียน feedback กระชับ เข้าใจง่าย ภาษาไทย
5. ตอบกลับในรูปแบบ JSON เท่านั้น:
{{
  "score": 85,
  "feedback": [
    "[OK] ฟอร์มโดยรวมดีมาก",
    "[!] หลังควรตรงขึ้นอีกเล็กน้อย เทียบกับท่ามาตรฐาน",
    "[!] เข่าซ้ายควรกางออกมากกว่านี้ประมาณ 10 องศา"
  ]
}}
"""
    else:
        # ถ้าไม่มี reference ให้วิเคราะห์แบบเดิม
        prompt = f"""
คุณเป็นเทรนเนอร์ AI มืออาชีพด้านฟิตเนสและท่าทางการออกกำลังกาย

ชื่อท่าที่กำลังฝึก: {pose_name}
ข้อมูล keypoints ของผู้ใช้:
{json.dumps(user_keypoints, indent=2, ensure_ascii=False)}

โปรดวิเคราะห์:
1. ท่านี้ถูกต้องตามหลักการออกกำลังกายหรือไม่
2. จุดใดที่ควรปรับ เช่น หลังงอ เข่าหุบ แขนกางมากไป
3. ให้คะแนน 0–100
4. เขียน feedback กระชับ เข้าใจง่าย ภาษาไทย
5. ตอบกลับในรูปแบบ JSON เท่านั้น:
{{
  "score": 85,
  "feedback": [
    "[OK] ฟอร์มโดยรวมดีมาก",
    "[!] หลังควรตรงขึ้นอีกเล็กน้อย",
    "[!] เข่าซ้ายหุบเข้ามาด้านในมากไป"
  ]
}}
"""
    try:
        if not client:
            raise ValueError("Gemini client not initialized")
        
        # ใช้ client.models.generate_content ตามที่ Google แนะนำ
        response = client.models.generate_content(
            model="gemini-2.0-flash",  # ใช้ตามที่ Google Quick Start บอก (ไม่มี -exp)
            contents=prompt
        )
        
        print(f"[GEMINI] ✅ Response received from Gemini")
        return response.text.strip()
    except Exception as e:
        print(f"[ERROR] Gemini API Error: {e}")
        return json.dumps({
            "score": 0,
            "feedback": [f"[!] เกิดข้อผิดพลาดจาก Gemini API: {str(e)}"]
        })

