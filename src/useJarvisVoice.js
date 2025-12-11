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
    const silenceTimerRef = useRef(null); // ⏱️ Temporizador para detectar fin de frase

    // 1. Iniciar escucha continua
    useEffect(() => {
        if (browserSupportsSpeechRecognition) {
            SpeechRecognition.startListening({ continuous: true, language: 'es-MX' });
        }
    }, [browserSupportsSpeechRecognition]);

    // 🔊 FUNCIÓN DE HABLA
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // 2. DETECTOR DE COMANDOS INTELIGENTE
    useEffect(() => {
        // A. Si no hay nada escrito, no hacemos nada
        if (!transcript) return;

        const lower = transcript.toLowerCase();

        // B. COMANDO DE EMERGENCIA: "CÁLLATE" (Se ejecuta INMEDIATAMENTE)
        if (lower.includes('cállate') || lower.includes('silencio') || lower.includes('basta')) {
            console.log("🤫 SILENCIANDO JARVIS");
            window.speechSynthesis.cancel();
            resetTranscript();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            return;
        }

        // C. LÓGICA DE ESPERA (DEBOUNCE)
        // Cada vez que hablas, reiniciamos el contador. Solo si te callas por 1.5s, ejecutamos.
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
            processFinalCommand(lower);
        }, 1500); // ⏳ ESPERA 1.5 SEGUNDOS DE SILENCIO

    }, [transcript]);

    // 3. PROCESAR EL COMANDO FINAL (YA COMPLETO)
    const processFinalCommand = (commandText) => {
        if (isProcessingVoiceRef.current) return;

        // BUSCAR
        if (commandText.includes('jarvis busca') || commandText.includes('busca')) {
            // Limpiamos la frase para quedarnos solo con la pregunta
            const query = commandText.replace('jarvis busca', '').replace('busca', '').trim();
            
            // Solo buscamos si la pregunta tiene sentido (más de 3 letras)
            if (query.length > 3) {
                console.log(`🎤 COMANDO COMPLETO DETECTADO: "${query}"`);
                handleVoiceSearch(query);
            }
        }
        
        // APAGAR
        else if (commandText.includes('jarvis apágate') || commandText.includes('apagar pantalla')) {
            speak("Entrando en reposo.");
            setIsStandby(true);
            setBootPhase('standby');
            resetTranscript();
        }
        
        // Si habló pero no era un comando, limpiamos para no acumular basura
        else {
            // Opcional: resetTranscript() si quieres limpiar el buffer si no dijo ningún comando válido
        }
    };

    // 4. LLAMADA AL SERVIDOR
    const handleVoiceSearch = async (query) => {
        isProcessingVoiceRef.current = true;
        playTechSound('notification'); 
        
        setWidgets(prev => ({
            ...prev,
            search: { ...searchWidgetDefault, x: 50, y: 40, visible: true, query: query, result: 'Analizando red global...' }
        }));

        try {
            const res = await axios.post('http://localhost:3001/api/search', { query });
            const respuestaTexto = res.data.answer || "Sin resultados.";
            
            setWidgets(prev => ({
                ...prev,
                search: { ...prev.search, result: respuestaTexto }
            }));

            speak(respuestaTexto);
            
            // Esperar a que termine de hablar o 15 seg
            setTimeout(() => {
                setWidgets(prev => ({ ...prev, search: { ...prev.search, visible: false } }));
                resetTranscript();
                isProcessingVoiceRef.current = false;
            }, 15000);

        } catch (e) {
            speak("Error de conexión.");
            setWidgets(prev => ({ ...prev, search: { ...prev.search, visible: false } }));
            isProcessingVoiceRef.current = false;
            resetTranscript();
        }
    };

    return { transcript };
};

export default useJarvisVoice;