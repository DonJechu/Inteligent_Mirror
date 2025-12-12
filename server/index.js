import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ip from 'ip';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import OpenAI from 'openai'; // Usamos la librería de OpenAI para conectar con DeepSeek
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const { GoogleSearch } = require("google-search-results-nodejs");

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🧠 MEMORIA DE CORTO PLAZO
let lastSearchContext = null; 

// 🤖 CONFIGURACIÓN DEEPSEEK
let deepseek = null;
if (DEEPSEEK_API_KEY) {
    deepseek = new OpenAI({
        baseURL: 'https://api.deepseek.com', // <--- La clave: Apuntamos a DeepSeek
        apiKey: DEEPSEEK_API_KEY
    });
}

const app = express();
app.use(cors());
app.use(express.json());

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

// FUNCIÓN DE BÚSQUEDA (SERPAPI + DEEPSEEK)
const performSearch = (query, lat, lon, res) => {
    console.log(`🌎 BUSCANDO EN SERPAPI: "${query}"`);
    
    if (!SERPAPI_KEY) return res.json({ answer: "Error de configuración: Falta SERPAPI_KEY." });

    try {
        const search = new GoogleSearch(SERPAPI_KEY);
        let finalQuery = query;
        // Si hay coordenadas, las pegamos para ayudar a Google
        if (lat && lon) finalQuery = `${query} loc:${lat},${lon}`;

        search.json({
            engine: "google",
            q: finalQuery,
            hl: "es-419", 
            gl: "mx",
            google_domain: "google.com.mx"
        }, async (json) => {
            if (!json || json.error) return res.json({ answer: "Error en la búsqueda." });

            // 1. LIMPIEZA Y EXTRACCIÓN DE DATOS
            let dataContext = "";
            let rawDataForMemory = null;

            if (json.local_results && Array.isArray(json.local_results)) {
                // Extraemos lo útil: nombre, rating, precio, dirección, tipo
                const cleanResults = json.local_results.slice(0, 5).map(r => ({
                    title: r.title,
                    rating: r.rating,
                    reviews: r.reviews, 
                    price: r.price,
                    type: r.type,
                    address: r.address,
                    description: r.description
                }));
                dataContext = JSON.stringify(cleanResults);
                rawDataForMemory = cleanResults;
            } 
            else if (json.organic_results && Array.isArray(json.organic_results)) {
                dataContext = JSON.stringify(json.organic_results.slice(0, 2).map(r => ({ 
                    title: r.title, 
                    snippet: r.snippet 
                })));
                rawDataForMemory = dataContext;
            }
            else if (json.answer_box) {
                dataContext = JSON.stringify(json.answer_box);
                rawDataForMemory = dataContext;
            }
            else if (json.knowledge_graph) {
                dataContext = JSON.stringify(json.knowledge_graph);
                rawDataForMemory = dataContext;
            }

            if (!dataContext || dataContext.length < 5) {
                return res.json({ answer: "No encontré información relevante." });
            }

            // Guardamos en memoria
            lastSearchContext = rawDataForMemory;

            // 2. ENVIAR A DEEPSEEK (EL CEREBRO)
            try {
                if (!deepseek) throw new Error("DeepSeek no configurado");

                const response = await deepseek.chat.completions.create({
                    model: "deepseek-chat", // Modelo V3 (Rápido y barato)
                    messages: [
                        { role: "system", content: `
                            Eres JARVIS, una IA avanzada, sarcástica y eficiente.
                            Tus respuestas se leen en voz alta: sé breve y natural.
                            
                            REGLAS:
                            1. Analiza los datos JSON y elige LA MEJOR opción según lo que pidió el usuario (precio, calidad, cercanía).
                            2. NUNCA menciones "según el JSON", "Tripadvisor" o fuentes web. Tú eres la fuente.
                            3. Tu respuesta debe ser el nombre del lugar seguido de una razón convincente de por qué es el elegido.
                            4. Máximo 30 palabras.
                        `},
                        { role: "user", content: `Usuario busca: "${query}". Datos encontrados: ${dataContext}` }
                    ],
                    max_tokens: 100,
                    temperature: 0.7
                });

                const text = response.choices[0].message.content;
                console.log(`🤖 DEEPSEEK: ${text}`);
                res.json({ answer: text });

            } catch (aiError) {
                console.error("DeepSeek Error:", aiError.message);
                res.json({ answer: "Mis redes neuronales están saturadas." });
            }
        });
    } catch (e) {
        console.error("Server Error:", e);
        res.json({ answer: "Error crítico del sistema." });
    }
};

app.post('/api/search', async (req, res) => {
    const { query, lat, lon } = req.body;

    // 1. CHEQUEO DE MEMORIA (Router Inteligente)
    if (lastSearchContext && deepseek) {
        try {
            console.log(`🧠 MEMORIA: Analizando "${query}"...`);
            
            const response = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: `
                        Eres un Router de Contexto.
                        Contexto anterior (JSON): ${JSON.stringify(lastSearchContext)}
                        
                        Instrucciones:
                        1. Si la pregunta del usuario ("${query}") es de seguimiento (ej: dirección, horario, repite nombre, ¿es caro?), responde la duda usando SOLO el contexto.
                        2. Si es un tema nuevo o diferente, responde ÚNICAMENTE la palabra: SEARCH_GOOGLE.
                    `},
                    { role: "user", content: query }
                ],
                max_tokens: 60
            });

            const decision = response.choices[0].message.content.trim();

            if (decision.includes("SEARCH_GOOGLE")) {
                console.log("➡️ Decisión: Búsqueda Nueva");
                performSearch(query, lat, lon, res);
            } else {
                console.log(`🧠 Respuesta de Memoria: ${decision}`);
                return res.json({ answer: decision });
            }
            return;

        } catch (error) {
            console.warn("Fallo memoria, buscando en web...", error.message);
            performSearch(query, lat, lon, res);
            return;
        }
    }

    // Si no hay memoria, buscamos directo
    performSearch(query, lat, lon, res);
});

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
  console.log("🤖 IA: DeepSeek V3 | 🗺️ Mapa: SerpApi");
});