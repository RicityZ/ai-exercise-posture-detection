import React from "react"
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import UploadReference from "./pages/UploadReference"
import CompareAI from "./pages/CompareAI"
import "./styles/main.css"

function App() {
  return (
    <Router>
      <div className="navbar">
        <h2>🏋️‍♀️ Pose Coach AI</h2>
        <div className="nav-links">
          <Link to="/">วิเคราะห์ท่าทาง</Link>
          <Link to="/upload">อัปโหลดท่าใหม่</Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<CompareAI />} />
        <Route path="/upload" element={<UploadReference />} />
      </Routes>
    </Router>
  )
}

export default App

