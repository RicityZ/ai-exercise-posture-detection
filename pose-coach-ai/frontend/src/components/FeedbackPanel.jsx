import React from "react"
import "../styles/main.css"

export default function FeedbackPanel({ score, feedback, loading }) {
  return (
    <div className="feedback-panel">
      <h3>🧠 ผลการประเมินท่าทาง</h3>

      {loading && <p className="loading">กำลังประมวลผลด้วย AI...</p>}

      {!loading && (
        <>
          {score !== undefined && (
            <div className="score-display">
              <span className="score-label">คะแนนรวม:</span>{" "}
              <span className="score-value">{score.toFixed(2)} / 100</span>
            </div>
          )}

          {feedback && feedback.length > 0 ? (
            <ul className="feedback-list">
              {feedback.map((item, index) => (
                <li
                  key={index}
                  className={item.startsWith("✅") ? "good" : item.startsWith("⚠️") ? "warn" : "bad"}
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            !loading && <p>ยังไม่มีคำแนะนำ กรุณาเริ่มทำท่าทาง</p>
          )}
        </>
      )}
    </div>
  )
}
