import React, { useEffect, useRef } from "react"
import { Camera } from "@mediapipe/camera_utils"
import { createMediaPipe, drawSkeletonCustom, convertLandmarksToKeypoints, destroyMediaPipe } from "../utils/mediaPipeHelper"

export default function WebcamPanel({ poseName, onKeypoints }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraRef = useRef(null)
  const poseRef = useRef(null)

  useEffect(() => {
    let mounted = true

    const start = async () => {
      try {
        // ตั้งค่า canvas size
        const ensureCanvasSize = () => {
          if (!videoRef.current || !canvasRef.current) return
          const vw = videoRef.current.videoWidth
          const vh = videoRef.current.videoHeight
          if (vw && vh && (canvasRef.current.width !== vw || canvasRef.current.height !== vh)) {
            canvasRef.current.width = vw
            canvasRef.current.height = vh
            console.log("📐 Webcam canvas size:", vw, "x", vh)
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
              console.log("📐 Webcam canvas resized:", vw, "x", vh)
            }
          }
          
          if (results.poseLandmarks) {
            // วาด skeleton (ไม่ต้อง flip เพราะ canvas มี CSS transform: scaleX(-1) อยู่แล้ว)
            drawSkeletonCustom(canvasRef.current, results.poseLandmarks, false)
            
            // แสดงค่า keypoints ที่สำคัญ (ทุก 30 เฟรม = 1 วินาที)
            if (Math.random() < 0.033) { // ~1 ครั้งต่อวินาที
              console.log("🎥 Webcam Keypoints Sample:")
              console.log("  - Nose:", results.poseLandmarks[0])
              console.log("  - Left Shoulder:", results.poseLandmarks[11])
              console.log("  - Right Shoulder:", results.poseLandmarks[12])
              console.log("  - Left Hip:", results.poseLandmarks[23])
              console.log("  - Right Hip:", results.poseLandmarks[24])
              console.log("  - Total landmarks:", results.poseLandmarks.length)
            }
            
            // แปลงเป็น keypoints และส่งให้ parent
            if (onKeypoints) {
              const kps = convertLandmarksToKeypoints(results.poseLandmarks)
              // console.log("📤 Sending keypoints to parent:", kps.length)
              onKeypoints(kps)
            } else {
              console.warn("⚠️ onKeypoints callback not provided!")
            }
          } else {
            // ถ้าไม่เจอ pose ให้ clear canvas
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }

        // สร้าง MediaPipe Pose instance
        poseRef.current = createMediaPipe(onResults)

        // เริ่ม camera
        if (videoRef.current) {
          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current })
              }
            },
            width: 640,
            height: 480
          })
          
          await cameraRef.current.start()
          console.log("✅ MediaPipe Camera started")
        }
      } catch (e) {
        console.error("🔥 Webcam error:", e)
      }
    }

    start()

    return () => {
      mounted = false
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (poseRef.current) {
        destroyMediaPipe(poseRef.current)
        poseRef.current = null
      }
    }
  }, [])

  // ลบ useEffect ที่ 2 ออก เพราะมันทำให้ canvas size ผิด

  return (
    <div className="panel" style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <h3 style={{ textAlign: "center", fontSize: "16px", marginBottom: "10px" }}>📷 กล้องผู้ใช้</h3>
      <div className="video-wrap" style={{ 
        position: "relative", 
        width: "100%", 
        aspectRatio: "4/3",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        <video 
          ref={videoRef} 
          autoPlay
          muted 
          playsInline 
          style={{ 
            width: "100%", 
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: "scaleX(-1)"
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
            transform: "scaleX(-1)",
            pointerEvents: "none" 
          }} 
        />
      </div>
    </div>
  )
}



