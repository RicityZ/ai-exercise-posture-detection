# 🏋️‍♀️ Pose Coach AI

AI-powered pose analysis application using MediaPipe and Google Gemini.

## 🚀 Quick Start

### วิธีที่ 1: ใช้ไฟล์ .bat (แนะนำสำหรับ Windows)

```bash
# เริ่มทั้ง Frontend และ Backend พร้อมกัน
start.bat

# หยุดทั้งหมด
stop.bat
```

### วิธีที่ 2: รันแยกทีละส่วน

#### Backend (Flask)
```bash
cd backend
python app.py
```

#### Frontend (Vite + React)
```bash
cd frontend
npm run dev
```

## 📦 Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 🌐 URLs

- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
pose-coach-ai/
├── backend/           # Flask API
│   ├── app.py        # Main server
│   ├── data/         # Uploaded poses & videos
│   └── utils/        # Helper functions
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── index.html
├── start.bat         # 🚀 Start both servers
└── stop.bat          # 🛑 Stop all servers
```

## 🎯 Features

- ✅ Real-time pose detection using BlazePose
- ✅ AI feedback using Google Gemini
- ✅ Upload custom reference poses
- ✅ Compare user pose with reference
- ✅ Skeleton overlay visualization

## 🛠️ Tech Stack

### Backend
- Flask
- MediaPipe Pose
- Google Gemini AI
- OpenCV

### Frontend
- React
- Vite
- TensorFlow.js
- BlazePose (tfjs)

## 📝 License

MIT

