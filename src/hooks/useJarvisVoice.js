import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';

const useJarvisVoice = ({ 
    setWidgets, 
    setIsStandby, 
    setBootPhase, 
    playTechSound,
    searchWidgetDefault,
    isStandby // 🔥 Recibimos el estado de standby para saber si debemos ignorar la voz
}) => {
    const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
    
    const isProcessingVoiceRef = useRef(false);
    const silenceTimerRef = useRef(null); 
    const isAiSpeaking = useRef(false);
    
    // Caché de ubicación para búsquedas locales
    const locationCache = useRef({ lat: null, lon: null, context: '' });
    const [jarvisVoice, setJarvisVoice] = useState(null);

    // 1. CARGA INICIAL (Voz y GPS)
    useEffect(() => {
        // Cargar voz del sistema
        const cargarVoces = () => {
            const voces = window.speechSynthesis.getVoices();
            // Intenta buscar una voz en español de Google o Microsoft, sino la primera en español
            const voz = voces.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && v.lang.includes('es')) ||
                        voces.find(v => v.lang.includes('es'));
            if (voz) setJarvisVoice(voz);
        };
        if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = cargarVoces;
        cargarVoces();

        // Iniciar escucha continua
        if (browserSupportsSpeechRecognition) {
            console.log("🎙️ Escucha activa...");
            SpeechRecognition.startListening({ continuous: true, language: 'es-MX' });
        }

        // Obtener GPS para contexto (clima/busquedas)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    locationCache.current = { lat: latitude, lon: longitude, context: '' };
                    try {
                        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const addr = res.data.address;
                        const city = addr.city || addr.town || addr.village || "";
                        const state = addr.state || "";
                        if (city && state) locationCache.current.context = `${city}, ${state}`;
                    } catch(e) { console.warn("GPS Background:", e); }
                }, 
                (err) => console.warn("GPS Error:", err), 
                { timeout: 10000 }
            );
        }
    }, [browserSupportsSpeechRecognition]);

    // Función para hablar
    const speak = (text) => {
        if (!'speechSynthesis' in window) return;
        SpeechRecognition.stopListening(); // Pausa escucha para no escucharse a sí mismo
        isAiSpeaking.current = true; 
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (jarvisVoice) utterance.voice = jarvisVoice;
        utterance.lang = 'es-MX';
        utterance.rate = 1.1; 

        utterance.onend = () => {
            isAiSpeaking.current = false; 
            resetTranscript();
            // Reactiva escucha después de hablar
            setTimeout(() => SpeechRecognition.startListening({ continuous: true, language: 'es-MX' }), 200);
        };
        window.speechSynthesis.speak(utterance);
    };

    // 2. PROCESAMIENTO DE TRANSCRIPCIÓN
    useEffect(() => {
        // 🛑 BLOQUEO DE SEGURIDAD:
        // Si está en Standby (ahorro) O si la IA está hablando -> IGNORAR TODO
        if (isStandby || !transcript || isAiSpeaking.current) {
            if (transcript) resetTranscript(); // Limpia buffer si se dijo algo mientras estaba apagado
            return; 
        }

        const lower = transcript.toLowerCase();

        // Comandos de interrupción inmediata
        if (lower.includes('cállate') || lower.includes('silencio')) {
            window.speechSynthesis.cancel();
            resetTranscript();
            return;
        }

        // Temporizador de silencio (Debounce)
        // Espera 1.3s de silencio antes de procesar la frase completa
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
            processFinalCommand(lower);
        }, 1300); 

    }, [transcript, isStandby]); // Agregamos isStandby a dependencias

    const processFinalCommand = (commandText) => {
        if (isProcessingVoiceRef.current) return;

        // 🧠 FILTRO "WAKE WORD" (Palabra de Activación)
        // Solo procesar si empieza con "jarvis" O es una pregunta directa muy clara
        const isWakeWordPresent = commandText.includes('jarvis');
        
        // Comandos de sistema (funcionan incluso sin "Jarvis" si son directos)
        if (commandText.includes('apágate') || (isWakeWordPresent && commandText.includes('apagar'))) {
            speak("Apagando sistemas.");
            setIsStandby(true);
            setBootPhase('standby');
            resetTranscript();
            return;
        }

        // Si no dijo "Jarvis", ignoramos (a menos que sea un comando muy específico, opcional)
        // Puedes quitar esta condición si quieres que responda sin decir el nombre
        if (!isWakeWordPresent) {
            resetTranscript();
            return;
        }

        // Limpiamos la palabra clave para procesar la orden limpia
        // Ejemplo: "Jarvis busca tacos" -> "busca tacos"
        const cleanCommand = commandText.replace('jarvis', '').trim();

        // 🧠 FILTRO DE INTENCIÓN
        // Palabras clave que indican una acción real
        const actionKeywords = [
            'busca', 'buscar', 'encuentra', 'encontrar', 
            'qué es', 'que es', 'quién es', 'quien es', 
            'repite', 'dónde', 'donde', 'ubicación', 
            'hora', 'teléfono', 'precio', 'clima', 'tiempo'
        ];
        
        const hasAction = actionKeywords.some(k => cleanCommand.includes(k));

        // Solo procedemos si hay una acción clara Y el comando no está vacío
        if (hasAction && cleanCommand.length > 2) {
            console.log(`🚀 COMANDO ACEPTADO: "${cleanCommand}"`);
            handleVoiceSearch(cleanCommand);
        } else {
            // Si dijo "Jarvis" pero no una orden clara, ignoramos
            resetTranscript(); 
        }
    };

    const handleVoiceSearch = async (query) => {
        isProcessingVoiceRef.current = true;
        playTechSound('notification'); 
        resetTranscript(); 

        // Mostrar widget de "Escuchando..."
        setWidgets(prev => ({
            ...prev,
            search: { ...searchWidgetDefault, x: 50, y: 40, visible: true, query: query, result: 'Procesando...' }
        }));

        try {
            const { lat, lon, context } = locationCache.current;
            
            // Contexto geográfico inteligente
            const isSearchIntent = query.includes('busca') || query.includes('encuentra') || query.includes('restaurante') || query.includes('lugar');
            const isNearbyRequest = query.includes('cerca') || query.includes('aquí');
            
            let finalQuery = query;
            // Si busca un lugar y tenemos GPS, añadimos la ciudad para mejorar resultados
            if (context && isSearchIntent && !isNearbyRequest) {
                finalQuery = `${query} en ${context}`;
            }

            console.log(`⚡ Enviando a IA: "${finalQuery}"`);

            const payload = { query: finalQuery };
            if (lat && lon) { payload.lat = lat; payload.lon = lon; }

            const res = await axios.post('http://localhost:3001/api/search', payload);
            const respuesta = res.data.answer || "No encontré información sobre eso.";
            
            // Actualizar widget con respuesta
            setWidgets(prev => ({
                ...prev,
                search: { ...prev.search, result: respuesta }
            }));

            speak(respuesta);
            
            // Ocultar widget después de leer
            setTimeout(() => {
                setWidgets(prev => ({ ...prev, search: { ...prev.search, visible: false } }));
                isProcessingVoiceRef.current = false;
            }, 10000);

        } catch (e) {
            speak("Lo siento, tuve un error de conexión.");
            isProcessingVoiceRef.current = false;
            setTimeout(() => {
                setWidgets(prev => ({ ...prev, search: { ...prev.search, visible: false } }));
            }, 3000);
        }
    };

    return { transcript };
};

export default useJarvisVoice;