// 🌐 ที่อยู่ Backend API
// เปลี่ยนได้ตามพอร์ตที่คุณรัน backend (Flask/FastAPI)
export const BASE_API_URL = "http://localhost:5000"

// 🧠 การตั้งค่าทั่วไปของระบบ AI
export const AI_SETTINGS = {
  FRAME_INTERVAL_MS: 10000, // ความถี่ในการส่งข้อมูล (10 วินาที/ครั้ง) - ลดเพื่อหลีกเลี่ยง rate limit
  MIN_CONFIDENCE: 0.4, // threshold สำหรับตรวจจับ keypoints (คะแนนต่ำกว่านี้จะไม่ส่ง)
  MAX_FEEDBACK_PER_FRAME: 3, // จำนวนคำแนะนำต่อเฟรมสูงสุด
}

// 🎥 ตั้งค่ากล้องเริ่มต้น
export const CAMERA_CONFIG = {
  width: 640,
  height: 480,
  facingMode: "user", // 'user' = กล้องหน้า, 'environment' = กล้องหลัง
}
