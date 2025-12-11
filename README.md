# MirrorLink 🔮

> Un Espejo Inteligente (Smart Mirror) interactivo controlado por visión computarizada y sincronizado vía móvil.

MirrorLink transforma un monitor convencional en una interfaz futurista al estilo "Jarvis". Utiliza **MediaPipe** para el reconocimiento de gestos en tiempo real y una **App Móvil** (React Native) para sincronizar calendarios y notificaciones de manera segura sin exponer credenciales en el dispositivo IoT.

## ✨ Características Principales

* **🖐️ Control Gestual sin Tocar:** Navegación completa usando visión artificial (Hand Tracking).
* **📅 Agenda Inmersiva:** Visualización de eventos con scroll gestual físico (Pinch & Drag).
* **📱 Sincronización Móvil:** Puente seguro (WebSocket) para enviar Calendario, Notificaciones y Comandos desde el celular.
* **⚡ Arquitectura React + Vite:** Rendimiento ultra-rápido y animaciones fluidas a 60fps.
* **🧘 Modos de Escena:** Modo Día, Modo Noche y Modo Focus (Pomodoro).

## 🛠️ Tecnologías

* **Frontend:** React, Vite, TailwindCSS.
* **AI/Visión:** Google MediaPipe (Hands & Face Mesh).
* **Backend (Puente):** Node.js, Express, Socket.io.
* **Mobile App:** React Native (Expo), Expo Calendar.

## 📦 Instalación y Despliegue

Este proyecto consta de 3 partes que deben funcionar en simultáneo.

### Prerrequisitos
* Node.js (v18 o superior).
* Un celular con la app Expo Go instalada.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/mirrorlink.git](https://github.com/tu-usuario/mirrorlink.git)
cd mirrorlink
npm install