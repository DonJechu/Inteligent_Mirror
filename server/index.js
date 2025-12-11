import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ip from 'ip';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// 📚 CORRECCIÓN DE LIBRERÍA
const require = createRequire(import.meta.url);
const { GoogleSearch } = require("google-search-results-nodejs");

// ⚠️ PEGA TU API KEY AQUÍ ABAJO ⚠️
const SERPAPI_KEY = "5b7b0f3d9477285e5f2a5cf32cab54f1e83903eda652b4b2ddaeafa50774c47f"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- RUTAS ---
app.get('/', (req, res) => res.sendFile(join(__dirname, 'controller.html')));

app.post('/api/notify', (req, res) => {
    const { app, message } = req.body;
    io.to('mirror-room').emit('new-notification', {
        id: Date.now(),
        app: app || 'Sistema',
        message: message || 'Mensaje entrante',
        time: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})
    });
    res.json({ success: true });
});

// 👇 RUTA DE BÚSQUEDA CORREGIDA Y MEJORADA 👇
app.post('/api/search', (req, res) => {
    const { query } = req.body;
    console.log(`🎤 JARVIS ANALIZANDO: "${query}"`);

    // 1. Verificar API Key
    if (!SERPAPI_KEY || SERPAPI_KEY.includes("TU_API_KEY")) {
        console.log("❌ ERROR: Falta la API Key en server/index.js");
        return res.json({ answer: "Error de configuración. Por favor agrega tu llave de acceso en el código del servidor." });
    }

    try {
        // 2. Instanciar la búsqueda (FORMA CORRECTA)
        const search = new GoogleSearch(SERPAPI_KEY);
        
        search.json({
            engine: "google",
            q: query,
            hl: "es-419", 
            gl: "mx"
        }, (json) => {
            // Verificar si hubo error en la respuesta de Google
            if (!json || json.error) {
                console.error("❌ Error en respuesta de SerpApi:", json?.error);
                return res.json({ answer: "Lo siento, hubo un problema al conectar con la red global." });
            }

            let answer = "";

            // A. Lugares (AHORA LEE LOS 3 MEJORES)
            if (json.local_results && json.local_results.length > 0) {
                // Tomamos hasta 3 resultados
                const places = json.local_results.slice(0, 3);
                
                // Formateamos la respuesta para que suene natural
                const placeDescriptions = places.map((p, index) => {
                    const rating = p.rating ? `con ${p.rating} estrellas` : "";
                    return `${index + 1}: ${p.title} ${rating}`;
                });

                answer = `Encontré estas opciones cercanas: ${placeDescriptions.join('. ')}.`;
            }
            // B. Datos directos (Caja de respuesta)
            else if (json.answer_box) {
                if (json.answer_box.answer) answer = json.answer_box.answer;
                else if (json.answer_box.snippet) answer = json.answer_box.snippet;
                else if (json.answer_box.price) answer = `El precio es ${json.answer_box.price} ${json.answer_box.currency}.`;
                else if (json.answer_box.temperature) answer = `Estamos a ${json.answer_box.temperature} grados, ${json.answer_box.weather}.`;
            }
            // C. Datos generales
            else if (json.knowledge_graph) {
                answer = json.knowledge_graph.description || json.knowledge_graph.title;
            }
            // D. Primer resultado web
            else if (json.organic_results && json.organic_results.length > 0) {
                answer = json.organic_results[0].snippet;
            }
            else {
                answer = "No encontré información precisa sobre eso en mis bases de datos.";
            }

            console.log(`🤖 RESPUESTA: ${answer}`);
            res.json({ answer });
        });

    } catch (error) {
        console.error("🔥 CRASH DEL SERVIDOR:", error);
        res.json({ answer: "Ocurrió un error interno en mis sistemas." });
    }
});

// --- SOCKET.IO ---
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on('connection', (socket) => {
  socket.on('identify', (type) => { if (type === 'mirror') socket.join('mirror-room'); });
  socket.on('send-notification', (data) => io.to('mirror-room').emit('new-notification', { ...data, id: Date.now(), time: new Date().toLocaleTimeString() }));
  socket.on('send-calendar', (events) => io.to('mirror-room').emit('update-calendar', events));
  socket.on('send-mail', (emails) => io.to('mirror-room').emit('update-mail', emails));
  socket.on('update-music', (track) => io.to('mirror-room').emit('update-music', track));
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 SERVIDOR ACTIVO EN: http://${ip.address()}:${PORT}`);
  console.log("---------------------------------------------------");
});