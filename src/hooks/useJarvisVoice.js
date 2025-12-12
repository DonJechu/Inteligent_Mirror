import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';

const useJarvisVoice = ({ 
    setWidgets, 
    setIsStandby, 
    setBootPhase, 
    playTechSound,
    searchWidgetDefault 
}) => {
    const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
    
    const isProcessingVoiceRef = useRef(false);
    const silenceTimerRef = useRef(null); 
    const isAiSpeaking = useRef(false);
    
    // Caché de ubicación
    const locationCache = useRef({ lat: null, lon: null, context: '' });
    const [jarvisVoice, setJarvisVoice] = useState(null);

    // 1. CARGA INICIAL
    useEffect(() => {
        // Cargar voz
        const cargarVoces = () => {
            const voces = window.speechSynthesis.getVoices();
            const voz = voces.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && v.lang.includes('es')) ||
                        voces.find(v => v.lang.includes('es'));
            if (voz) setJarvisVoice(voz);
        };
        if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = cargarVoces;
        cargarVoces();

        // Escucha
        if (browserSupportsSpeechRecognition) {
            console.log("🎙️ Escucha activa...");
            SpeechRecognition.startListening({ continuous: true, language: 'es-MX' });
        }

        // GPS
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

    const speak = (text) => {
        if (!'speechSynthesis' in window) return;
        SpeechRecognition.stopListening();
        isAiSpeaking.current = true; 
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (jarvisVoice) utterance.voice = jarvisVoice;
        utterance.lang = 'es-MX';
        utterance.rate = 1.1; 

        utterance.onend = () => {
            isAiSpeaking.current = false; 
            resetTranscript();
            setTimeout(() => SpeechRecognition.startListening({ continuous: true, language: 'es-MX' }), 200);
        };
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (!transcript || isAiSpeaking.current) return;
        const lower = transcript.toLowerCase();

        if (lower.includes('cállate') || lower.includes('silencio')) {
            window.speechSynthesis.cancel();
            resetTranscript();
            return;
        }

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
            processFinalCommand(lower);
        }, 1300); 

    }, [transcript]);

    const processFinalCommand = (commandText) => {
        if (isProcessingVoiceRef.current) return;

        // Comandos locales
        if (commandText.includes('apágate')) {
            speak("Apagando sistemas.");
            setIsStandby(true);
            setBootPhase('standby');
            resetTranscript();
            return;
        }

        // 🧠 FILTRO INTELIGENTE: Aceptamos "busca" O preguntas de seguimiento
        const keywords = ['busca', 'encuentra', 'repite', 'nombre', 'dónde', 'donde', 'ubicación', 'hora', 'teléfono', 'quién', 'qué', 'cual', 'cuál', 'cómo', 'precio'];
        
        // Si tiene palabra clave O es una frase conversacional larga (> 2 palabras)
        const isValidCommand = keywords.some(k => commandText.includes(k)) || commandText.split(' ').length > 2;

        if (isValidCommand) {
            const query = commandText.replace(/jarvis|por favor/g, '').trim();
            if (query.length > 1) {
                console.log(`🚀 COMANDO: "${query}"`);
                handleVoiceSearch(query);
            } else {
                resetTranscript();
            }
        } else {
            // Si es ruido corto, lo ignoramos
            resetTranscript(); 
        }
    };

    const handleVoiceSearch = async (query) => {
        isProcessingVoiceRef.current = true;
        playTechSound('notification'); 
        resetTranscript(); 

        setWidgets(prev => ({
            ...prev,
            search: { ...searchWidgetDefault, x: 50, y: 40, visible: true, query: query, result: 'Procesando...' }
        }));

        try {
            const { lat, lon, context } = locationCache.current;
            
            // 🧠 LÓGICA DE CONTEXTO:
            // Solo agregamos la ciudad si es una búsqueda explícita de lugares.
            // Si es "¿dónde queda?" o "repítelo", NO agregamos ciudad para no confundir a la memoria.
            const isSearchIntent = query.includes('busca') || query.includes('encuentra') || query.includes('restaurante') || query.includes('lugar');
            const isNearbyRequest = query.includes('cerca') || query.includes('aquí');
            
            let finalQuery = query;
            if (context && isSearchIntent && !isNearbyRequest) {
                finalQuery = `${query} en ${context}`;
            }

            console.log(`⚡ Enviando: "${finalQuery}"`);

            const payload = { query: finalQuery };
            if (lat && lon) { payload.lat = lat; payload.lon = lon; }

            const res = await axios.post('http://localhost:3001/api/search', payload);
            const respuesta = res.data.answer || "Sin datos.";
            
            setWidgets(prev => ({
                ...prev,
                search: { ...prev.search, result: respuesta }
            }));

            speak(respuesta);
            
            setTimeout(() => {
                setWidgets(prev => ({ ...prev, search: { ...prev.search, visible: false } }));
                isProcessingVoiceRef.current = false;
            }, 10000);

        } catch (e) {
            speak("Error de sistema.");
            isProcessingVoiceRef.current = false;
        }
    };

    return { transcript };
};

export default useJarvisVoice;