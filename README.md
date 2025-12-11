# 🔮 MirrorLink

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Status](https://img.shields.io/badge/status-active-success.svg)

> A futuristic Smart Mirror interface controlled by computer vision gestures and synchronized securely via a mobile companion app. Inspired by J.A.R.V.I.S. technology.

---

## 📸 Screenshots

![Dashboard Preview](https://via.placeholder.com/800x450?text=MirrorLink+Dashboard+Preview)
*(Replace this link with a real screenshot of your interface)*

---

## ✨ Features

* **🖐️ Touchless Gesture Control**: Navigate the interface using hand gestures powered by AI (MediaPipe). No touch required.
* **📅 Immersive Agenda**: Pinch & drag to scroll through your daily events.
* **📱 Mobile Sync (Companion App)**: Securely bridge your phone's Calendar, Notifications, and Mail to the mirror via local WebSocket without exposing credentials to the mirror itself.
* **⚡ High Performance**: Built with **React + Vite** for ultra-fast 60fps rendering.
* **🧘 Circadian Modes**: Automatically switches between **Day Mode** (High Contrast/Cyan) and **Night Mode** (Blue Light Filter/Amber).
* **🎯 Focus Mode**: Distraction-free Pomodoro timer activated by gestures.

---

## 🛠️ Tech Stack

### Frontend (Mirror)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![MediaPipe](https://img.shields.io/badge/MediaPipe-0099CC?style=for-the-badge&logo=google&logoColor=white)

### Backend (Bridge)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge) ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

### Mobile (Remote)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)

---

## 🚀 Installation & Setup

This project consists of 3 parts running simultaneously: **Server**, **Mirror Client**, and **Mobile App**.

### Prerequisites
* Node.js (v18 or higher)
* Expo Go app installed on your phone.

### 1. Clone the Repository
```bash
<<<<<<< HEAD
git clone [https://github.com/your-username/mirrorlink.git](https://github.com/your-username/mirrorlink.git)
=======
git clone [https://github.com/DonJechu/Inteligent_Mirror.git](https://github.com/DonJechu/Inteligent_Mirror.git)
>>>>>>> 5d63f1d34f7796bd41854894eaa22358f648d10b
cd mirrorlink
npm install
