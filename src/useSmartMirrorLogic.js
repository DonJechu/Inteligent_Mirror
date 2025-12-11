import { useState, useEffect, useRef } from 'react';

// ==========================================
// 🛠️ ÁREA DE DESARROLLADOR: REGISTRO
// ==========================================
export const WIDGET_REGISTRY = {
  time: { id: 'time', name: 'Reloj Maestro', icon: '🕐', category: 'SISTEMA', priority: 1, locked: true },
  weather: { id: 'weather', name: 'Atmósfera', icon: '☀️', category: 'AMBIENTE', priority: 2 },
  status: { id: 'status', name: 'Sistemas', icon: '📶', category: 'SISTEMA', priority: 3 },
  news: { id: 'news', name: 'Feed Global', icon: '📰', category: 'INFO', priority: 4 },
  music: { id: 'music', name: 'Audio', icon: '🎵', category: 'MEDIA', priority: 5, isDynamic: true },
  notifications: { id: 'notifications', name: 'Centro de Mensajes', icon: '✉️', category: 'COMUNICACIÓN', priority: 6, isDynamic: true },
};

// ⚙️ PRESETS (MODOS PREDEFINIDOS)
export const PRESETS = {
  default: {
    time: { x: 50, y: 50, visible: true, scale: 1.5 },
    weather: { x: 20, y: 20, visible: true, scale: 1 },
    status: { x: 90, y: 5, visible: true, scale: 0.9 },
    news: { x: 50, y: 85, visible: true, scale: 1 },
    music: { x: 80, y: 80, visible: false, scale: 1 }
  },
  morning: { // Modo Productividad
    time: { x: 50, y: 15, visible: true, scale: 1 },
    weather: { x: 50, y: 50, visible: true, scale: 1.5 },
    news: { x: 50, y: 80, visible: true, scale: 1.1 },
    status: { x: 90, y: 5, visible: true, scale: 0.8 },
    music: { x: 10, y: 90, visible: false, scale: 1 }
  },
  zen: { // Modo Estudio/Relax
    time: { x: 50, y: 50, visible: true, scale: 1.2 },
    weather: { x: 50, y: 65, visible: true, scale: 0.8 },
    status: { x: 90, y: 5, visible: false, scale: 1 },
    news: { x: 50, y: 90, visible: false, scale: 1 },
    music: { x: 80, y: 80, visible: true, scale: 1 }
  }
};

const DEFAULT_CONFIG = {
  dayStart: 6,
  nightStart: 19,
  theme: 'stark', // stark, tron, zen
  opacity: 1,     // 0.5 a 1
  scale: 1        // 0.8 a 1.2
};

const useSmartMirrorLogic = () => {
  const [time, setTime] = useState(new Date());
  const [weather] = useState({ temp: 24, condition: 'Cielo Despejado' });
  const [cameraActive, setCameraActive] = useState(false);
  
  // Estado Visual (Calculado)
  const [isDayTime, setIsDayTime] = useState(true);

  // Estados de IA
  const [isStandby, setIsStandby] = useState(false); 
  const [bootPhase, setBootPhase] = useState('active');
  const [handDetected, setHandDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const [focusMode, setFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(1500); 
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const [interactionProgress, setInteractionProgress] = useState(0); 
  const [interactionType, setInteractionType] = useState(null); 
  
  // REFS
  const lastActivityRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const isStandbyRef = useRef(false);
  const interactionTimerRef = useRef(0);
  const focusModeRef = useRef(false);

  // CARGA DE WIDGETS
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_mirror_config_v1');
      if (saved) return { ...PRESETS.default, ...JSON.parse(saved) };
    } catch (e) { console.error(e); }
    return PRESETS.default;
  });

  // CARGA DE CONFIGURACIÓN
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_mirror_settings_v1');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) { console.error(e); }
    return DEFAULT_CONFIG;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [hoveredWidget, setHoveredWidget] = useState(null);
  
  const videoRef = useRef(null);
  const grabbedWidgetRef = useRef(null);
  const widgetsRef = useRef(widgets);

  useEffect(() => { widgetsRef.current = widgets; }, [widgets]);
  useEffect(() => { isStandbyRef.current = isStandby; }, [isStandby]);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);

  // ---------------------------------------------------------
  // 💾 PERSISTENCIA & PRESETS
  // ---------------------------------------------------------
  const applyPreset = (presetName) => {
    const preset = PRESETS[presetName] || PRESETS.default;
    // Fusionamos con los widgets actuales para no perder propiedades como IDs
    setWidgets(prev => {
        const newWidgets = { ...prev };
        Object.keys(preset).forEach(key => {
            if (newWidgets[key]) {
                newWidgets[key] = { ...newWidgets[key], ...preset[key], isDragging: false };
            }
        });
        return newWidgets;
    });
  };

  useEffect(() => {
    if (!isGrabbing && bootPhase === 'active') {
      const cleanWidgets = {};
      Object.keys(widgets).forEach(key => {
        // No guardamos el reloj si queremos que sea dinámico, pero para presets guardamos todo menos dragging
        cleanWidgets[key] = { ...widgets[key], isDragging: false };
      });
      localStorage.setItem('jarvis_mirror_config_v1', JSON.stringify(cleanWidgets));
    }
  }, [widgets, isGrabbing, bootPhase]);

  useEffect(() => {
    localStorage.setItem('jarvis_mirror_settings_v1', JSON.stringify(config));
  }, [config]);

  // ---------------------------------------------------------
  // 🕒 RELOJ Y MODOS DÍA/NOCHE
  // ---------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      const hour = now.getHours();
      
      const isDay = hour >= config.dayStart && hour < config.nightStart;
      setIsDayTime(isDay);

      // Lógica de posición del reloj (Solo si no está en modo Focus)
      if (!focusModeRef.current) {
          // Opcional: Podrías forzar posición aquí, o dejar que el Preset mande.
          // Por ahora, dejamos que la configuración manual o el preset manden,
          // excepto si quieres forzar el "Hero Clock" de día.
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [config, focusMode]);

  // ---------------------------------------------------------
  // ⏳ LÓGICA POMODORO & SONIDO
  // ---------------------------------------------------------
  const playTechSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      
      if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); gain.gain.setValueAtTime(0.1, now);
        osc.frequency.setValueAtTime(1046.50, now + 0.2); gain.gain.setValueAtTime(0.1, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
      }
    } catch (e) {}
  };

  useEffect(() => {
    let timer = null;
    if (focusMode && !sessionComplete && focusTime > 0) {
      timer = setInterval(() => setFocusTime(prev => prev - 1), 1000);
    } else if (!focusMode) {
      setFocusTime(1500);
      setSessionComplete(false);
    } else if (focusTime === 0 && !sessionComplete) {
      setSessionComplete(true);
      playTechSound('complete');
      setTimeout(() => { setFocusMode(false); setSessionComplete(false); setFocusTime(1500); }, 5000);
    }
    return () => clearInterval(timer);
  }, [focusMode, focusTime, sessionComplete]);

  // ---------------------------------------------------------
  // ⚡ MOTOR DE FÍSICA
  // ---------------------------------------------------------
  useEffect(() => {
    const physicsLoop = setInterval(() => {
      if (isGrabbing || showSettings || isStandby || focusMode) return;
      let hasChanges = false;
      const currentWidgets = { ...widgetsRef.current };
      const keys = Object.keys(currentWidgets);
      const repulsionDist = 18;

      keys.forEach((keyA, i) => {
        const wA = currentWidgets[keyA];
        if (keyA === 'time' || !wA.visible || wA.isDragging) return; // Reloj anclado por defecto

        let newX = wA.x, newY = wA.y;
        
        // Bordes
        if (newX < 5) newX += (5 - newX) * 0.1; if (newX > 95) newX += (95 - newX) * 0.1;
        if (newY < 5) newY += (5 - newY) * 0.1; if (newY > 95) newY += (95 - newY) * 0.1;

        // Colisiones
        keys.forEach((keyB, j) => {
          if (i === j) return;
          const wB = currentWidgets[keyB];
          if (!wB.visible) return;
          const dx = wA.x - wB.x, dy = wA.y - wB.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < repulsionDist && dist > 0) {
            const force = (repulsionDist - dist) * 0.05;
            newX += (dx / dist) * force; newY += (dy / dist) * force;
          }
        });

        if (Math.abs(newX - wA.x) > 0.1 || Math.abs(newY - wA.y) > 0.1) {
          currentWidgets[keyA] = { ...wA, x: newX, y: newY };
          hasChanges = true;
        }
      });
      if (hasChanges) setWidgets(currentWidgets);
    }, 50);
    return () => clearInterval(physicsLoop);
  }, [isGrabbing, showSettings, isStandby, focusMode]);

  // ---------------------------------------------------------
  // ⚡ GESTIÓN DE ENERGÍA Y ACTIVIDAD
  // ---------------------------------------------------------
  const registerActivity = () => {
    lastActivityRef.current = Date.now();
    if (isStandbyRef.current) {
      setIsStandby(false);
      setBootPhase('booting');
      setTimeout(() => setBootPhase('active'), 2000);
    }
  };

  useEffect(() => {
    const sleepCheck = setInterval(() => {
      if (!focusMode && !isStandbyRef.current && Date.now() - lastActivityRef.current > 15000) {
        setIsStandby(true);
        setBootPhase('standby');
      }
    }, 1000);
    return () => clearInterval(sleepCheck);
  }, [focusMode]);

  // ---------------------------------------------------------
  // 🎮 SISTEMA DE INTERACCIONES
  // ---------------------------------------------------------
  const checkInteractions = (x, y, isGrabbingInput) => {
    if (grabbedWidgetRef.current) { interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null); return; }

    const margin = 10;
    let activeType = null;

    if (x < margin && y < margin) activeType = 'reload';
    else if (x > (100 - margin) && y > (100 - margin)) activeType = 'standby';
    else {
        if (focusModeRef.current) {
             const dx = Math.abs(50 - x), dy = Math.abs(50 - y);
             if (dx < 20 && dy < 20 && isGrabbingInput) activeType = 'focus';
        } else {
            const timeWidget = widgetsRef.current.time;
            if (timeWidget?.visible) {
                const dx = Math.abs(timeWidget.x - x), dy = Math.abs(timeWidget.y - y);
                if (dx < 15 * (timeWidget.scale || 1) && dy < 15 * (timeWidget.scale || 1) && isGrabbingInput) activeType = 'focus';
            }
        }
    }

    if (activeType) {
        interactionTimerRef.current += 1;
        setInteractionType(activeType);
        const threshold = activeType === 'focus' ? 40 : 60;
        setInteractionProgress(Math.min(100, (interactionTimerRef.current / threshold) * 100));

        if (interactionTimerRef.current >= threshold) {
            if (activeType === 'reload') window.location.reload();
            if (activeType === 'standby') { setIsStandby(true); setBootPhase('standby'); }
            if (activeType === 'focus') setFocusMode(prev => !prev);
            interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null);
        }
    } else if (interactionTimerRef.current > 0) {
        interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null);
    }
  };

  // ---------------------------------------------------------
  // LÓGICA DE MANOS & CARA
  // ---------------------------------------------------------
  const onHandResults = (results) => {
    if (results.multiHandLandmarks?.[0]) {
      registerActivity();
      setHandDetected(true);
      const palm = results.multiHandLandmarks[0][9];
      const screenX = (1 - palm.x) * 100;
      const screenY = palm.y * 100;
      setHandPosition({ x: screenX, y: screenY });

      const thumb = results.multiHandLandmarks[0][4];
      const index = results.multiHandLandmarks[0][8];
      const distance = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
      
      const isGrabbingNow = distance < (grabbedWidgetRef.current ? 0.10 : 0.05);
      setIsGrabbing(isGrabbingNow);
      checkInteractions(screenX, screenY, isGrabbingNow);

      if (grabbedWidgetRef.current) {
        if (isGrabbingNow) moveWidget(grabbedWidgetRef.current, screenX, screenY); else releaseWidget();
      } else {
        if (isGrabbingNow) checkWidgetGrab(screenX, screenY); else checkWidgetHover(screenX, screenY);
      }
    } else {
      setHandDetected(false);
      setHoveredWidget(null);
      interactionTimerRef.current = 0; setInteractionProgress(0);
      if (grabbedWidgetRef.current) releaseWidget();
    }
  };

  const onFaceResults = (results) => {
    if (results.multiFaceLandmarks?.[0]) {
        registerActivity(); setFaceDetected(true);
    } else setFaceDetected(false);
  };

  // --- HELPERS BÁSICOS ---
  const checkWidgetGrab = (x, y) => {
    const threshold = 18;
    for (let [name, widget] of Object.entries(widgetsRef.current)) {
      if (!widget.visible || name === 'time') continue;
      if (Math.abs(widget.x - x) < threshold && Math.abs(widget.y - y) < threshold) {
        grabbedWidgetRef.current = name;
        setWidgets(prev => ({ ...prev, [name]: { ...prev[name], isDragging: true } }));
        return;
      }
    }
  };
  const moveWidget = (name, x, y) => setWidgets(prev => ({ ...prev, [name]: { ...prev[name], x, y } }));
  const releaseWidget = () => {
    if (grabbedWidgetRef.current) setWidgets(prev => ({ ...prev, [grabbedWidgetRef.current]: { ...prev[grabbedWidgetRef.current], isDragging: false } }));
    grabbedWidgetRef.current = null; setIsGrabbing(false); setHoveredWidget(null);
  };
  const checkWidgetHover = (x, y) => {
    const threshold = 18; let found = null;
    for (let [name, widget] of Object.entries(widgetsRef.current)) {
      if (!widget.visible) continue;
      if (Math.abs(widget.x - x) < threshold && Math.abs(widget.y - y) < threshold) { found = name; break; }
    }
    setHoveredWidget(found);
  };
  const toggleWidget = (id) => setWidgets(prev => ({ ...prev, [id]: { ...prev[id], visible: !prev[id]?.visible } }));
  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const handleWidgetMouseDown = (e, widgetName) => {}; // Placeholder

  // ---------------------------------------------------------
  // INICIALIZACIÓN
  // ---------------------------------------------------------
  useEffect(() => {
    let hands, faceMesh, camera;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (videoRef.current.paused) await videoRef.current.play().catch(e => console.log("Play interrupted"));
          setCameraActive(true);
        }
        if (typeof window.Hands === 'undefined' || typeof window.FaceMesh === 'undefined') return;

        hands = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        hands.onResults(onHandResults);

        faceMesh = new window.FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMesh.onResults(onFaceResults);

        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current?.readyState === 4) {
              frameCountRef.current++;
              await hands.send({ image: videoRef.current });
              const faceCheckFrequency = isStandbyRef.current ? 5 : 60;
              if (frameCountRef.current % faceCheckFrequency === 0) await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 320, height: 240
        });
        await camera.start();
      } catch (err) { console.error(err); }
    };

    const loadMediaPipe = () => {
        const scripts = [
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
        ];
        let loaded = 0;
        const loadNext = () => {
            if (loaded >= scripts.length) { setTimeout(initCamera, 1000); return; }
            if (document.querySelector(`script[src="${scripts[loaded]}"]`)) { loaded++; loadNext(); return; }
            const script = document.createElement('script');
            script.src = scripts[loaded]; script.async = false;
            script.onload = () => { loaded++; loadNext(); };
            document.head.appendChild(script);
        };
        loadNext();
    };
    loadMediaPipe();
    return () => { if (camera) try { camera.stop(); } catch(e){} };
  }, []);

  return {
    time, weather, cameraActive, handDetected, faceDetected, 
    isStandby, bootPhase, widgets, handPosition, isGrabbing, 
    hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, setWidgets,
    config, updateConfig, isDayTime, applyPreset, // Nuevas exportaciones
    focusMode, interactionProgress, interactionType, focusTime, sessionComplete
  };
};

export default useSmartMirrorLogic;