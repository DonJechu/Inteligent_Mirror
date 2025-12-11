import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ip from 'ip';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); // Permitir leer JSON en los POST

// --- RUTAS HTTP ---

// 1. Servir el "Mando a Distancia Web" (Opcional, útil para pruebas rápidas)
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'controller.html'));
});

// 2. Webhook para recibir notificaciones externas (Apps de terceros, Atajos, etc.)
app.post('/api/notify', (req, res) => {
    const { app, message } = req.body;
    console.log(`📨 WEBHOOK RECIBIDO: ${app} - ${message}`);
    
    // Reenviar al espejo
    io.to('mirror-room').emit('new-notification', {
        id: Date.now(),
        app: app || 'Sistema',
        message: message || 'Mensaje entrante',
        time: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})
    });
    
    res.json({ success: true });
});

// --- CONFIGURACIÓN SOCKET.IO ---
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

console.log("---------------------------------------------------");
console.log("🚀 INICIANDO SISTEMA DE COMUNICACIÓN STARK...");

io.on('connection', (socket) => {
  // A. Identificación de Dispositivos
  socket.on('identify', (type) => {
    if (type === 'mirror') {
        console.log(`✅ ESPEJO CONECTADO (${socket.id})`);
        socket.join('mirror-room');
    } else if (type === 'phone') {
        console.log(`📱 CELULAR CONECTADO (${socket.id})`);
    }
  });

  // B. Recibir NOTIFICACIÓN del celular
  socket.on('send-notification', (data) => {
    console.log(`📩 MENSAJE: ${data.app} - ${data.message}`);
    
    // Reenviar al espejo
    io.to('mirror-room').emit('new-notification', {
        id: Date.now(),
        app: data.app || 'Sistema',
        message: data.message || 'Nueva notificación',
        time: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})
    });
  });

  // C. Recibir CALENDARIO del celular (NUEVO)
  socket.on('send-calendar', (events) => {
    console.log(`📅 AGENDA RECIBIDA: ${events.length} eventos`);
    io.to('mirror-room').emit('update-calendar', events);
  });

  // D. Recibir CORREO del celular (NUEVO)
  socket.on('send-mail', (emails) => {
    console.log(`✉️ CORREOS RECIBIDOS: ${emails.length}`);
    io.to('mirror-room').emit('update-mail', emails);
  });

  socket.on('disconnect', () => {
    // Opcional: Log de desconexión
  });
});

// --- INICIO DEL SERVIDOR ---
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => { // '0.0.0.0' permite acceso desde toda la red local
  console.log(`📡 SERVIDOR PUENTE ACTIVO`);
  console.log(`👉 IP DEL SERVIDOR: http://${ip.address()}:${PORT}`);
  console.log("---------------------------------------------------");
});