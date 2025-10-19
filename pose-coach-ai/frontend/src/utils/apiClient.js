import { BASE_API_URL } from "./config"

/**
 * 📤 อัปโหลดวิดีโอเทรนเนอร์ (สร้างท่ามาตรฐานใหม่)
 * @param {string} poseName - ชื่อท่าทาง เช่น "Squat"
 * @param {File} videoFile - ไฟล์วิดีโอที่อัปโหลด (.mp4)
 * @returns {Promise<object>} - ข้อมูลตอบกลับจาก backend
 */
export async function uploadReference(poseName, videoFile) {
  try {
    const formData = new FormData()
    formData.append("pose_name", poseName)
    formData.append("video", videoFile)

    const response = await fetch(`${BASE_API_URL}/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) throw new Error("Upload failed")

    const data = await response.json()
    return data
  } catch (error) {
    console.error("uploadReference error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * 🤖 วิเคราะห์ท่าผู้ใช้แบบชุด (ส่ง keypoints batch 10 วินาที + ชื่อท่า → Gemini)
 * Backend จะไปดึง reference keypoints เองจาก data/poses/{poseName}/keypoints
 * @param {string} poseName - ชื่อท่าที่กำลังฝึก เช่น "Squat"
 * @param {Array<Array>} userKeypointsBatch - ข้อมูล keypoints จาก webcam หลายเฟรม (10 วินาที)
 * @returns {Promise<object>} - ผลคะแนนและ feedback จาก AI
 */
export async function analyzePoseBatch(poseName, userKeypointsBatch) {
  try {
    const response = await fetch(`${BASE_API_URL}/analyze-live`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pose_name: poseName,
        user_keypoints_batch: userKeypointsBatch,
      }),
    })

    if (!response.ok) throw new Error("Analyze request failed")

    const data = await response.json()
    return data
  } catch (error) {
    console.error("analyzePoseBatch error:", error)
    return { score: 0, feedback: ["❌ ไม่สามารถวิเคราะห์ได้"] }
  }
}

/**
 * 📚 ดึงรายชื่อท่าที่มีอยู่จาก backend (โฟลเดอร์ใน data/poses)
 */
export async function fetchPoseNames() {
  try {
    const res = await fetch(`${BASE_API_URL}/poses`)
    if (!res.ok) throw new Error("Failed to fetch pose names")
    const data = await res.json()
    return Array.isArray(data.poses) ? data.poses : []
  } catch (error) {
    console.error("fetchPoseNames error:", error)
    return []
  }
}

/**
 * 🎞️ ขอ URL วิดีโออ้างอิงของท่าที่เลือก
 */
export async function fetchPoseVideoUrl(poseName) {
  try {
    const res = await fetch(`${BASE_API_URL}/pose-video?pose=${encodeURIComponent(poseName)}`)
    if (!res.ok) throw new Error("Failed to fetch pose video url")
    const data = await res.json()
    if (!data || !data.url) return null
    // ถ้า backend ส่ง path แบบ relative ให้เติม BASE_API_URL นำหน้า
    if (/^https?:\/\//i.test(data.url)) return data.url
    return `${BASE_API_URL}${data.url}`
  } catch (e) {
    console.error("fetchPoseVideoUrl error:", e)
    return null
  }
}
