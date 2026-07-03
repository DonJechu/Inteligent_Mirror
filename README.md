# 🔮 MirrorLink — Espejo Inteligente

![Status](https://img.shields.io/badge/status-active-success.svg) ![Stack](https://img.shields.io/badge/React_19-Vite-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg)

> Interfaz de espejo inteligente estilo J.A.R.V.I.S. controlada por **gestos con la mano** (visión por computadora con la webcam) y **voz**, con un puente en Node para notificaciones, agenda y música desde un teléfono en la misma red.

---

## ✨ Características

- **🖐️ Control gestual sin contacto** — cursor y "pinza" (índice + pulgar) con MediaPipe Hands sobre la cámara de la laptop. Sin teclado ni ratón.
- **🎙️ Asistente de voz "Jarvis"** — palabra de activación + búsqueda en la web resumida por IA (SerpAPI + DeepSeek) y respuesta hablada.
- **📅 Agenda inmersiva** — vista a pantalla completa; pinza y arrastra para hacer scroll.
- **🎯 Modo Focus (Pomodoro)** — temporizador a pantalla completa activado por gesto.
- **🧘 Temas** — JARVIS, Braun (minimal), Neon City (cyber) y Oasis (zen).
- **📱 Companion** — página web (`server/controller.html`) que empuja notificaciones, calendario, correo y música al espejo por WebSocket, sin exponer credenciales al espejo.

---

## 🛠️ Stack

- **Espejo (frontend):** React 19 · Vite · TailwindCSS · Framer Motion · MediaPipe (Hands + FaceMesh, cargado por CDN)
- **Puente (backend):** Node · Express · Socket.io · SerpAPI · DeepSeek

---

## 🚀 Instalación

### Requisitos
- Node.js 18 o superior.
- Una webcam (basta la de la laptop).
- Navegador con permiso de cámara y micrófono (Chrome/Edge recomendado por el reconocimiento de voz).

### 1. Clonar e instalar
```bash
git clone https://github.com/DonJechu/Inteligent_Mirror.git
cd Inteligent_Mirror
npm install
```

### 2. Configurar claves (opcional, solo para la búsqueda por voz)
Copia `.env.example` a `.env` y rellena tus claves:
```bash
cp .env.example .env
```
```
SERPAPI_KEY=tu_clave_serpapi
DEEPSEEK_API_KEY=tu_clave_deepseek
```
> Sin claves, el espejo funciona igual (reloj, gestos, widgets); solo se desactiva la búsqueda por voz.

### 3. Arrancar
```bash
npm start          # levanta el puente (:3001) y el espejo (Vite) a la vez
```
Abre el espejo en el navegador (Vite muestra la URL, normalmente `http://localhost:5173`) y acepta los permisos de cámara/micrófono.

El **companion** está en `http://localhost:3001` (o `http://<IP-de-tu-PC>:3001` desde el teléfono en la misma red).

### Scripts
| Comando | Qué hace |
|---|---|
| `npm start` | Puente + espejo juntos |
| `npm run dev` | Solo el espejo (Vite) |
| `npm run server` | Solo el puente (Node) |
| `npm run build` | Build de producción |
| `npm run lint` | Linter |

---

## 🎮 Uso

Consulta **[MANUAL.md](MANUAL.md)** para el detalle de gestos (pinza, scroll, Focus) y la vinculación del teléfono.

Comandos de voz: di **"Jarvis…"** seguido de, por ejemplo, *"busca un café cerca"*, *"qué es…"*, *"quién es…"* o *"apágate"*.

---

## 📄 Licencia
MIT.
