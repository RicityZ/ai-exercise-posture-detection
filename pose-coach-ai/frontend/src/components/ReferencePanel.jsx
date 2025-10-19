import React, { useEffect, useRef } from "react"
import { createMediaPipe, drawSkeletonCustom, destroyMediaPipe } from "../utils/mediaPipeHelper"

export default function ReferencePanel({ videoUrl }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const poseRef = useRef(null)

  useEffect(() => {
    let mounted = true
    
    const setup = async () => {
      if (!videoRef.current || !videoUrl) return

      // ตั้งค่า canvas size
      const ensureCanvasSize = () => {
        if (!videoRef.current || !canvasRef.current) return
        const vw = videoRef.current.videoWidth
        const vh = videoRef.current.videoHeight
        if (vw && vh && (canvasRef.current.width !== vw || canvasRef.current.height !== vh)) {
          canvasRef.current.width = vw
          canvasRef.current.height = vh
          console.log("📐 Reference canvas size:", vw, "x", vh)
        }
      }

      // Callback เมื่อ MediaPipe ประมวลผลเสร็จ
      const onResults = (results) => {
        if (!mounted || !canvasRef.current || !videoRef.current) return
        
        // ตั้งค่าขนาด canvas ให้ตรงกับวิดีโอทุกครั้ง
        const vw = videoRef.current.videoWidth
        const vh = videoRef.current.videoHeight
        if (vw && vh) {
          if (canvasRef.current.width !== vw || canvasRef.current.height !== vh) {
            canvasRef.current.width = vw
            canvasRef.current.height = vh
            console.log("📐 Reference canvas resized:", vw, "x", vh)
          }
        }
        
        if (results.poseLandmarks) {
          console.log("🎞️ Reference: Drawing skeleton on canvas", canvasRef.current.width, "x", canvasRef.current.height)
          drawSkeletonCustom(canvasRef.current, results.poseLandmarks, false)
        } else {
          const ctx = canvasRef.current.getContext("2d")
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }

      // สร้าง MediaPipe Pose instance
      poseRef.current = createMediaPipe(onResults)

      // ตั้งค่าวิดีโอ
      videoRef.current.src = videoUrl
      
      const onVideoReady = () => {
        if (!mounted) return
        ensureCanvasSize()
        loop()
      }

      if (videoRef.current.readyState >= 2) {
        onVideoReady()
      } else {
        videoRef.current.addEventListener("loadedmetadata", onVideoReady, { once: true })
      }
      
      await videoRef.current.play().catch(() => {})
    }
    
    const loop = async () => {
      if (!mounted || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      
      try {
        if (poseRef.current && videoRef.current) {
          await poseRef.current.send({ image: videoRef.current })
        }
      } catch (e) {
        console.error("🔥 ReferencePanel loop error:", e)
      }
      
      rafRef.current = requestAnimationFrame(loop)
    }
    
    setup()
    
    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      }
      if (poseRef.current) {
        destroyMediaPipe(poseRef.current)
        poseRef.current = null
      }
    }
  }, [videoUrl])

  // ลบ useEffect ที่ 2 ออก เพราะมันทำให้ canvas size ผิด

  return (
    <div className="panel" style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <h3 style={{ textAlign: "center", fontSize: "16px", marginBottom: "10px" }}>🎞️ วิดีโออ้างอิง</h3>
      <div style={{ 
        position: "relative", 
        width: "100%", 
        minHeight: "400px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <video 
            ref={videoRef} 
            loop
            muted
            autoPlay
            playsInline
            crossOrigin="anonymous"
            style={{ 
              maxWidth: "100%", 
              maxHeight: "500px",
              objectFit: "contain",
              display: "block"
            }} 
          />
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: "absolute", 
              left: 0, 
              top: 0, 
              width: "100%", 
              height: "100%", 
              pointerEvents: "none" 
            }} 
          />
        </div>
      </div>
    </div>
  )
}


