import React from "react"

/**
 * 🔍 Component สำหรับแสดงค่า keypoints เพื่อ debug
 */
export default function KeypointsDebug({ keypoints }) {
  if (!keypoints || keypoints.length === 0) {
    return (
      <div style={{
        padding: "10px",
        backgroundColor: "#f0f0f0",
        borderRadius: "8px",
        fontSize: "12px",
        maxHeight: "200px",
        overflow: "auto"
      }}>
        <h4>🔍 Keypoints Debug</h4>
        <p style={{ color: "#999" }}>ไม่มีข้อมูล keypoints</p>
      </div>
    )
  }

  // เลือกแค่ keypoints สำคัญๆ
  const importantKeypoints = [
    { idx: 0, name: "Nose" },
    { idx: 11, name: "Left Shoulder" },
    { idx: 12, name: "Right Shoulder" },
    { idx: 13, name: "Left Elbow" },
    { idx: 14, name: "Right Elbow" },
    { idx: 15, name: "Left Wrist" },
    { idx: 16, name: "Right Wrist" },
    { idx: 23, name: "Left Hip" },
    { idx: 24, name: "Right Hip" },
    { idx: 25, name: "Left Knee" },
    { idx: 26, name: "Right Knee" },
    { idx: 27, name: "Left Ankle" },
    { idx: 28, name: "Right Ankle" }
  ]

  return (
    <div style={{
      padding: "15px",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      fontSize: "12px",
      maxHeight: "300px",
      overflow: "auto",
      fontFamily: "monospace"
    }}>
      <h4 style={{ marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
        🔍 Keypoints Debug ({keypoints.length} points)
      </h4>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {importantKeypoints.map(({ idx, name }) => {
          const kp = keypoints[idx]
          if (!kp) return null
          
          const visibility = kp.visibility || 0
          const color = visibility > 0.7 ? "#28a745" : visibility > 0.5 ? "#ffc107" : "#dc3545"
          
          return (
            <div key={idx} style={{
              padding: "6px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              borderLeft: `3px solid ${color}`
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{name}</div>
              <div style={{ fontSize: "10px", color: "#666" }}>
                x: {kp.x?.toFixed(3)} y: {kp.y?.toFixed(3)}
              </div>
              <div style={{ fontSize: "10px", color }}>
                visibility: {(visibility * 100).toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
      
      <div style={{
        marginTop: "10px",
        padding: "8px",
        backgroundColor: "#e9ecef",
        borderRadius: "4px",
        fontSize: "11px"
      }}>
        <strong>สีความหมาย:</strong>
        <span style={{ color: "#28a745", marginLeft: "5px" }}>● สูง (&gt;70%)</span>
        <span style={{ color: "#ffc107", marginLeft: "5px" }}>● ปานกลาง (50-70%)</span>
        <span style={{ color: "#dc3545", marginLeft: "5px" }}>● ต่ำ (&lt;50%)</span>
      </div>
    </div>
  )
}

