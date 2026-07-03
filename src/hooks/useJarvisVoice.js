import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';

const useJarvisVoice = ({ setWidgets, setIsStandby, setBootPhase, playTechSound, searchWidgetDefault, isStandby }) => {
    const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
    const isProcessingVoiceRef = useRef(false);
    const silenceTimerRef = useRef(null); 
    const isAiSpeaking = useRef(false);
    const [jarvisVoice, setJarvisVoice] = useState(null);

    // Carga inicial
    useEffect(() => {
        const cargarVoces = () => {
            const voces = window.speechSynthesis.getVoices();
            const voz = voces.find(v => v.lang.includes('es'));
            if (voz) setJarvisVoice(voz);
        };
        window.speechSynthesis.onvoiceschanged = cargarVoces;
        cargarVoces();
        if (browserSupportsSpeechRecognition) SpeechRecognition.startListening({ continuous: true, language: 'es-MX' });
    }, [browserSupportsSpeechRecognition]);

    const speak = (text) => {
        if (!('speechSynthesis' in window)) return;
        SpeechRecognition.stopListening();
        isAiSpeaking.current = true; 
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (jarvisVoice) u.voice = jarvisVoice;
        u.lang = 'es-MX'; u.rate = 1.1; 
        u.onend = () => { isAiSpeaking.current = false; resetTranscript(); setTimeout(() => SpeechRecognition.startListening({ continuous: true, language: 'es-MX' }), 200); };
        window.speechSynthesis.speak(u);
    };

    const handleVoiceSearch = async (query) => {
        isProcessingVoiceRef.current = true;
        playTechSound('notification');
        setWidgets(prev => ({ ...prev, search: { ...searchWidgetDefault, x: 50, y: 40, visible: true, query: query, result: 'Procesando...' } }));
        try {
            const res = await axios.post('http://localhost:3001/api/search', { query });
            const ans = res.data.answer || "No encontré datos.";
            setWidgets(prev => ({ ...prev, search: { ...prev.search, result: ans } }));
            speak(ans);
            setTimeout(() => { setWidgets(prev => ({ ...prev, search: { ...prev.search, visible: false } })); isProcessingVoiceRef.current = false; }, 10000);
        } catch { isProcessingVoiceRef.current = false; }
    };

    // Procesamiento Inteligente
    useEffect(() => {
        if (isStandby || !transcript || isAiSpeaking.current) return; // Ignorar si está en standby o hablando

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        // Esperar 1.5s de silencio antes de procesar comando completo
        silenceTimerRef.current = setTimeout(() => {
            const lower = transcript.toLowerCase();
            
            // 🔥 WAKE WORD: Solo activar si dice "Jarvis"
            if (lower.includes('jarvis')) {
                const command = lower.split('jarvis')[1]?.trim(); // Obtener lo que sigue a "Jarvis"
                
                if (command) {
                    if (command.includes('apágate') || command.includes('descansa')) {
                        speak("Entrando en reposo.");
                        setIsStandby(true);
                        setBootPhase('standby');
                    } 
                    else if (command.includes('busca') || command.includes('qué es') || command.includes('quién es') || command.includes('clima')) {
                        handleVoiceSearch(command);
                    }
                }
                resetTranscript();
            } else if (transcript.length > 50) {
                // Limpiar buffer si se acumula mucha basura sin decir Jarvis
                resetTranscript();
            }
        }, 1500);
    }, [transcript, isStandby]);

    return { transcript };
};

export default useJarvisVoice;