import React, { useState } from "react"
import Loader from "../components/Loader"
import { uploadReference } from "../utils/apiClient"
import "../styles/main.css"

export default function UploadReference() {
  const [poseName, setPoseName] = useState("")
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!poseName || !videoFile) {
      setMessage("⚠️ กรุณาใส่ชื่อท่าและเลือกวิดีโอ")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const result = await uploadReference(poseName, videoFile)
      if (result?.success) {
        setMessage(`✅ อัปโหลดสำเร็จ: ${poseName}`)
      } else {
        setMessage("❌ อัปโหลดไม่สำเร็จ กรุณาลองใหม่")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setMessage("❌ เกิดข้อผิดพลาดระหว่างอัปโหลด")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-container">
      <h2>📤 อัปโหลดวิดีโอเทรนเนอร์ (ท่ามาตรฐาน)</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>ชื่อท่าทาง (เช่น Squat, Pushup):</label>
          <input
            type="text"
            value={poseName}
            onChange={(e) => setPoseName(e.target.value)}
            placeholder="ตั้งชื่อท่า..."
          />
        </div>

        <div className="form-group">
          <label>เลือกไฟล์วิดีโอ (.mp4, .mov):</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
          />
        </div>

        <button type="submit" className="upload-btn" disabled={loading}>
          {loading ? "กำลังอัปโหลด..." : "อัปโหลดวิดีโอ"}
        </button>
      </form>

      {loading && <Loader text="กำลังอัปโหลดและประมวลผล..." />}
      {message && <p className="upload-message">{message}</p>}
    </div>
  )
}
