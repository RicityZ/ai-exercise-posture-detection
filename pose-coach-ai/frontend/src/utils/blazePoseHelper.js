import * as poseDetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"

// ใช้ singleton บน globalThis เพื่อกันโหลดซ้ำจาก HMR/หลายอินสแตนซ์
let detector = typeof globalThis !== "undefined" ? (globalThis.__blazePoseDetector || null) : null
let isRunning = false
let animationId = null

/**
 * ✅ โหลด BlazePose model เพียงครั้งเดียว
 */
export async function loadBlazePose() {
  if (detector) return detector // โหลดแล้วไม่ต้องโหลดซ้ำ

  // เลือก backend: พยายามใช้ webgl ก่อน ถ้าไม่ได้ให้ fallback เป็น cpu
  try {
    await tf.setBackend("webgl")
  } catch {
    await tf.setBackend("cpu")
  }
  await tf.ready()

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.BlazePose,
    {
      runtime: "tfjs",
      modelType: "full", // ใช้โมเดลเต็ม (ความแม่นยำสูง)
    }
  )
  if (typeof globalThis !== "undefined") {
    globalThis.__blazePoseDetector = detector
  }

  console.log("✅ BlazePose model loaded successfully")
  return detector
}

/**
 * 🎥 เริ่มตรวจจับท่าทางแบบต่อเนื่อง
 * @param {object} videoRef - ref ของ <video> element
 * @param {function} callback - callback(keypoints) เรียกทุกเฟรม
 */
export async function runBlazePose(videoRef, callback) {
  if (isRunning) return
  isRunning = true

  const detector = await loadBlazePose()

  async function detectFrame() {
    if (!isRunning || !videoRef?.current) return

    try {
      const poses = await detector.estimatePoses(videoRef.current)

      if (poses && poses.length > 0) {
        const keypoints = poses[0].keypoints3D
          ? poses[0].keypoints3D.map((k) => ({
              name: k.name,
              x: k.x,
              y: k.y,
              z: k.z,
              score: k.score,
            }))
          : poses[0].keypoints.map((k) => ({
              name: k.name,
              x: k.x,
              y: k.y,
              score: k.score,
            }))

        if (callback) callback(keypoints)
      }
    } catch (err) {
      console.error("🔥 Pose detection error:", err)
    }

    animationId = requestAnimationFrame(detectFrame)
  }

  detectFrame()
}

/**
 * 🛑 หยุดตรวจจับ (หยุด loop และไม่ประมวลผลต่อ)
 */
export function stopBlazePose() {
  isRunning = false
  if (animationId) cancelAnimationFrame(animationId)
  console.log("🛑 BlazePose stopped")
}

// ===== Drawing Utilities =====
const CONNECTED_KEYPOINTS = poseDetection.util.getAdjacentPairs(
  poseDetection.SupportedModels.BlazePose
)

export function drawSkeletonOnCanvas(canvas, keypoints, flipHorizontal = false) {
  if (!canvas || !keypoints || keypoints.length === 0) return
  const ctx = canvas.getContext("2d")
  const { width, height } = canvas
  
  // Debug: ตรวจสอบขนาด canvas
  if (width === 0 || height === 0) {
    console.warn("⚠️ Canvas size is 0! width:", width, "height:", height)
    return
  }
  
  ctx.clearRect(0, 0, width, height)
  ctx.lineWidth = 3
  ctx.strokeStyle = "#00e0ff" // สีเส้นโครงกระดูก
  ctx.fillStyle = "#ff3d71"   // สีจุด keypoint

  // BlazePose keypoints เป็น normalized (0-1) เสมอ
  // แปลงเป็นพิกเซลตามขนาด canvas
  const getXY = (kp) => {
    const rawX = (kp.x || 0) * width
    const rawY = (kp.y || 0) * height
    const x = flipHorizontal ? width - rawX : rawX
    const y = rawY
    return [x, y]
  }

  // draw connections
  ctx.beginPath()
  for (const [i, j] of CONNECTED_KEYPOINTS) {
    const kp1 = keypoints[i]
    const kp2 = keypoints[j]
    if (!kp1 || !kp2 || (kp1.score && kp1.score < 0.3) || (kp2.score && kp2.score < 0.3)) continue
    const [x1, y1] = getXY(kp1)
    const [x2, y2] = getXY(kp2)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.stroke()

  // draw points
  for (const kp of keypoints) {
    if (kp.score && kp.score < 0.3) continue // ไม่วาดจุดที่มี confidence ต่ำ
    const [x, y] = getXY(kp)
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}
