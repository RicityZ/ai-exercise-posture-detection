import React, { useEffect, useRef, useState } from "react"
import WebcamPanel from "../components/WebcamPanel"
import ReferencePanel from "../components/ReferencePanel"
import FeedbackPanel from "../components/FeedbackPanel"
import Loader from "../components/Loader"
import KeypointsDebug from "../components/KeypointsDebug"
import { analyzePoseBatch, fetchPoseNames, fetchPoseVideoUrl } from "../utils/apiClient"
import { AI_SETTINGS } from "../utils/config"
import "../styles/main.css"

export default function CompareAI() {
  const [feedback, setFeedback] = useState([])
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [poseName, setPoseName] = useState("Squat")
  const [poseOptions, setPoseOptions] = useState(["Squat"]) // รายชื่อท่าที่โหลดมาจาก backend
  const [currentKeypoints, setCurrentKeypoints] = useState([]) // เก็บ keypoints ล่าสุด
  const [showDebug, setShowDebug] = useState(false) // แสดง/ซ่อน debug panel

  // โหลดรายชื่อท่าจาก backend
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const names = await fetchPoseNames()
      if (mounted && names.length > 0) {
        setPoseOptions(names)
        if (!names.includes(poseName)) setPoseName(names[0])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])
  const isRunningRef = useRef(false) // ใช้ useRef สำหรับเช็คใน handleKeypoints (อัปเดตทันทีโดยไม่ต้อง re-render)
  const [isRunningUI, setIsRunningUI] = useState(false) // ใช้ state สำหรับ UI (ปุ่ม disable)
  const [refVideoUrl, setRefVideoUrl] = useState(null)
  const keypointsBatchRef = useRef([]) // เก็บ keypoints หลายเฟรม (10 วินาที)
  const recordingStartTimeRef = useRef(0) // เวลาเริ่มบันทึก

  // เมื่อเปลี่ยนท่าที่เลือก ให้โหลด URL วิดีโออ้างอิง
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const url = await fetchPoseVideoUrl(poseName)
      if (mounted) setRefVideoUrl(url)
    })()
    return () => {
      mounted = false
    }
  }, [poseName])
  // ฟังก์ชันวนลูปบันทึกและวิเคราะห์
  const recordAndAnalyzeLoop = async () => {
    if (!isRunningRef.current) {
      console.log("⏹️ Loop stopped")
      return
    }
    
    // รีเซ็ต batch สำหรับรอบใหม่
    keypointsBatchRef.current = []
    recordingStartTimeRef.current = Date.now()
    
    setFeedback(["⏳ กำลังบันทึกท่าทาง 10 วินาที..."])
    console.log("📹 Started recording for 10 seconds")
    
    // รอ 10 วินาที
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    if (!isRunningRef.current) {
      console.log("⚠️ Recording was stopped during collection")
      return
    }
    
    const batchSize = keypointsBatchRef.current.length
    const firstFrame = keypointsBatchRef.current[0]
    const midFrame = keypointsBatchRef.current[Math.floor(batchSize / 2)]
    const lastFrame = keypointsBatchRef.current[batchSize - 1]
    
    console.log(`📦 ========== BATCH DATA SUMMARY ==========`)
    console.log(`📊 Total frames collected: ${batchSize}`)
    console.log(`📊 Keypoints per frame: ${firstFrame?.length || 0}`)
    console.log(`📊 Total data points: ${batchSize * (firstFrame?.length || 0)}`)
    console.log(`📊 First frame sample:`, firstFrame?.slice(0, 3))
    console.log(`📊 Mid frame sample:`, midFrame?.slice(0, 3))
    console.log(`📊 Last frame sample:`, lastFrame?.slice(0, 3))
    console.log(`📦 ==========================================`)
    
    if (batchSize === 0) {
      setFeedback(["❌ ไม่พบข้อมูล keypoints, กำลังลองใหม่..."])
      // ลองใหม่
      setTimeout(() => recordAndAnalyzeLoop(), 1000)
      return
    }
    
    // ส่งข้อมูลไปวิเคราะห์
    setFeedback(["🤖 กำลังวิเคราะห์ท่าทางด้วย AI..."])
    setLoading(true)
    console.log(`🚀 Sending batch to backend for pose: ${poseName}`)
    
    let result = null
    try {
      result = await analyzePoseBatch(poseName, keypointsBatchRef.current)
      console.log("✅ Received result from backend:", result)
      
      setScore(result.score || 0)
      setFeedback(result.feedback || [])
    } catch (e) {
      console.error("❌ Error analyzing pose:", e)
      setFeedback([`❌ เกิดข้อผิดพลาด: ${e.message}`])
    } finally {
      setLoading(false)
    }
    
    // วนลูปต่อ (รอ 5 วินาทีก่อนเริ่มรอบใหม่)
    console.log("🔄 Waiting 5 seconds before next cycle...")
    const currentFeedback = result?.feedback || ["⏰ รอ 5 วินาทีก่อนวิเคราะห์รอบถัดไป..."]
    setFeedback([...currentFeedback, "", "⏰ รอ 5 วินาทีก่อนวิเคราะห์รอบถัดไป..."])
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // เริ่มรอบใหม่
    recordAndAnalyzeLoop()
  }
  
  // เริ่มบันทึกและวิเคราะห์แบบวนลูป
  const handleStart = () => {
    console.log("🟢 handleStart clicked! Current isRunning:", isRunningRef.current)
    if (isRunningRef.current) {
      console.log("⚠️ Already running, ignoring")
      return
    }
    
    isRunningRef.current = true
    setIsRunningUI(true)
    setScore(0)
    setFeedback(["⏳ กำลังเริ่มต้น..."]) // แสดง feedback ทันที
    
    console.log("✅ Started continuous recording loop")
    
    // เริ่ม loop (ใช้ setTimeout เพื่อให้ UI อัปเดตก่อน)
    setTimeout(() => recordAndAnalyzeLoop(), 100)
  }

  // หยุดการบันทึก
  const handleStop = () => {
    console.log("🔴 handleStop clicked!")
    isRunningRef.current = false
    setIsRunningUI(false)
    setLoading(false)
    keypointsBatchRef.current = []
    setFeedback(["⏹️ หยุดการวิเคราะห์แล้ว"]) // แสดง feedback เมื่อหยุด
    setScore(0) // รีเซ็ตคะแนน
    console.log("✅ Recording stopped")
  }

  // รับ keypoints จาก WebcamPanel และเก็บไว้ใน batch
  const handleKeypoints = (keypoints) => {
    // อัปเดต keypoints ล่าสุดเสมอ (สำหรับ debug)
    setCurrentKeypoints(keypoints)
    
    if (!isRunningRef.current) {
      // ไม่ต้อง log ทุกครั้ง เพราะจะเยอะมาก
      return
    }
    
    if (!keypoints || keypoints.length === 0) {
      return
    }
    
    // เก็บแค่ทุก 15 เฟรม (30fps ÷ 2 = ทุก 0.5 วินาที)
    // ใน 10 วินาที จะได้ ~20 เฟรม แทน 300 เฟรม
    const currentLength = keypointsBatchRef.current.length
    if (currentLength === 0 || currentLength % 15 === 0) {
      keypointsBatchRef.current.push(keypoints)
      
      // แสดง progress ทุก 5 เฟรมที่เก็บ (ทุก 2.5 วินาที)
      const elapsed = Date.now() - recordingStartTimeRef.current
      const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000))
      const collected = keypointsBatchRef.current.length
      
      if (collected % 5 === 0) {
        console.log(`📹 ========== RECORDING PROGRESS ==========`)
        console.log(`📹 Frames collected: ${collected}`)
        console.log(`📹 Time remaining: ${remaining}s`)
        console.log(`📹 Keypoints in this frame: ${keypoints.length}`)
        console.log(`📹 Sample keypoint:`, keypoints[0])
        console.log(`📹 =========================================`)
      }
    }
  }

  return (
    <div className="compare-container">
      <h2>🎯 วิเคราะห์ท่าทางด้วย AI แบบสด</h2>

      <div className="pose-selector">
        <label>เลือกชื่อท่าที่ต้องการฝึก: </label>
        <select value={poseName} onChange={(e) => setPoseName(e.target.value)}>
          {poseOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="two-col" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px"
      }}>
        <WebcamPanel poseName={poseName} onKeypoints={handleKeypoints} />
        <ReferencePanel videoUrl={refVideoUrl} />
      </div>

      <div className="control-buttons">
        <button
          onClick={handleStart}
          className="analyze-btn"
          disabled={isRunningUI}
        >
          ▶️ เริ่มตรวจจับแบบสด
        </button>

        <button
          onClick={handleStop}
          className="stop-btn"
          disabled={!isRunningUI}
        >
          ⏹️ หยุด
        </button>
        
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            padding: "10px 20px",
            backgroundColor: showDebug ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          🔍 {showDebug ? "ซ่อน" : "แสดง"} Debug
        </button>
      </div>

      {loading && <Loader text="AI กำลังเริ่มต้น..." />}

      {showDebug && (
        <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 20px" }}>
          <KeypointsDebug keypoints={currentKeypoints} />
        </div>
      )}

      {!loading && (
        <FeedbackPanel score={score} feedback={feedback} loading={isRunningUI} />
      )}
    </div>
  )
}
