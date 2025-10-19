import React, { useRef, useEffect, useState, forwardRef } from "react"

const CameraFeed = forwardRef(({ width = 640, height = 480 }, ref) => {
  const videoRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  // ให้ ref ที่รับจาก CompareAI ชี้ไปที่ video element โดยตรง
  useEffect(() => {
    if (ref) {
      ref.current = videoRef.current
    }
  }, [ref])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsReady(true)
      } catch (err) {
        console.error("Camera error:", err)
        setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง")
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div style={{ textAlign: "center" }}>
      <h3>📷 กล้องผู้ใช้</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <video
        ref={videoRef}
        width={width}
        height={height}
        style={{
          borderRadius: "10px",
          border: "2px solid #ccc",
          transform: "scaleX(-1)",
          backgroundColor: "#000",
        }}
        autoPlay
        muted
        playsInline
      ></video>
      {!isReady && <p>กำลังเปิดกล้อง...</p>}
    </div>
  )
})

export default CameraFeed
