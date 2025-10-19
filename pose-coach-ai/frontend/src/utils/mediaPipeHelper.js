import { Pose } from "@mediapipe/pose"
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils"

// MediaPipe Pose connections
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
]

/**
 * ✅ สร้าง MediaPose instance ใหม่ (ไม่ใช้ singleton)
 * แต่ละ component จะมี instance ของตัวเอง
 */
export function createMediaPipe(onResults) {
  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    }
  })

  pose.setOptions({
    modelComplexity: 1, // 0=lite, 1=full, 2=heavy
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  })

  pose.onResults(onResults)
  console.log("✅ MediaPipe Pose instance created")
  
  return pose
}

/**
 * 🎨 วาด skeleton บน canvas ด้วย MediaPipe drawing utilities
 */
export function drawSkeletonOnCanvas(canvas, results, flipHorizontal = false) {
  if (!canvas || !results || !results.poseLandmarks) return
  
  const ctx = canvas.getContext("2d")
  const { width, height } = canvas
  
  if (width === 0 || height === 0) {
    console.warn("⚠️ Canvas size is 0!")
    return
  }
  
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  
  // ถ้าต้องการ flip horizontal
  if (flipHorizontal) {
    ctx.scale(-1, 1)
    ctx.translate(-width, 0)
  }
  
  // วาด connections (เส้นโครงกระดูก)
  drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
    color: "#00e0ff",
    lineWidth: 3
  })
  
  // วาด landmarks (จุด keypoints)
  drawLandmarks(ctx, results.poseLandmarks, {
    color: "#ff3d71",
    fillColor: "#ff3d71",
    radius: 5
  })
  
  ctx.restore()
}

/**
 * 🎨 วาด skeleton แบบกำหนดเอง (ไม่ใช้ drawing_utils)
 */
export function drawSkeletonCustom(canvas, landmarks, flipHorizontal = false) {
  if (!canvas || !landmarks || landmarks.length === 0) return
  
  const ctx = canvas.getContext("2d")
  const { width, height } = canvas
  
  if (width === 0 || height === 0) {
    console.warn("⚠️ Canvas size is 0! width:", width, "height:", height)
    return
  }
  
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  
  // ถ้าต้องการ flip horizontal ให้ใช้ transform
  if (flipHorizontal) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  
  ctx.lineWidth = 3
  ctx.strokeStyle = "#00e0ff"
  ctx.fillStyle = "#ff3d71"
  
  // MediaPipe landmarks เป็น normalized (0-1)
  const getXY = (landmark) => {
    const x = landmark.x * width
    const y = landmark.y * height
    return [x, y]
  }
  
  // วาด connections
  ctx.beginPath()
  for (const [i, j] of POSE_CONNECTIONS) {
    const lm1 = landmarks[i]
    const lm2 = landmarks[j]
    if (!lm1 || !lm2 || lm1.visibility < 0.5 || lm2.visibility < 0.5) continue
    
    const [x1, y1] = getXY(lm1)
    const [x2, y2] = getXY(lm2)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.stroke()
  
  // วาด points
  for (const landmark of landmarks) {
    if (landmark.visibility < 0.5) continue
    const [x, y] = getXY(landmark)
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.restore()
}

/**
 * 🔄 แปลง MediaPipe landmarks เป็น format ที่ backend ต้องการ
 */
export function convertLandmarksToKeypoints(landmarks) {
  if (!landmarks || landmarks.length === 0) return []
  
  return landmarks.map((lm, idx) => ({
    name: `landmark_${idx}`,
    x: lm.x,
    y: lm.y,
    z: lm.z || 0,
    visibility: lm.visibility
  }))
}

/**
 * 🛑 ทำลาย MediaPipe instance
 */
export function destroyMediaPipe(poseInstance) {
  if (poseInstance) {
    poseInstance.close()
    console.log("🛑 MediaPipe Pose destroyed")
  }
}

