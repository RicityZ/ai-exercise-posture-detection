import React from "react"
import "../styles/main.css"

export default function Loader({ text = "กำลังประมวลผล..." }) {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner"></div>
      <p className="loader-text">{text}</p>
    </div>
  )
}
