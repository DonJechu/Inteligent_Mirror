import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// ==========================================
// 🛠️ REGISTRO DE WIDGETS
// ==========================================
export const WIDGET_REGISTRY = {
  time: { id: 'time', name: 'Reloj Maestro', icon: '🕐', category: 'SISTEMA', priority: 1, locked: true },
  weather: { id: 'weather', name: 'Atmósfera', icon: '☀️', category: 'AMBIENTE', priority: 2 },
  status: { id: 'status', name: 'Sistemas', icon: '📶', category: 'SISTEMA', priority: 3 },
  news: { id: 'news', name: 'Feed Global', icon: '📰', category: 'INFO', priority: 4 },
  music: { id: 'music', name: 'Audio', icon: '🎵', category: 'MEDIA', priority: 5, isDynamic: true },
  notifications: { id: 'notifications', name: 'Centro de Mensajes', icon: '💬', category: 'COMUNICACIÓN', priority: 6, isDynamic: true },
  // 👇 CALENDARIO BLOQUEADO (Actúa como botón)
  calendar: { id: 'calendar', name: 'Agenda Diaria', icon: '📅', category: 'PRODUCTIVIDAD', priority: 7, locked: true },
  mail: { id: 'mail', name: 'Buzón Prioritario', icon: '✉️', category: 'PRODUCTIVIDAD', priority: 8 },
};

// ⚙️ PRESETS
export const PRESETS = {
  default: {
    time: { x: 50, y: 50, visible: true, scale: 1.5 },
    weather: { x: 20, y: 20, visible: true, scale: 1 },
    status: { x: 90, y: 5, visible: true, scale: 0.9 },
    news: { x: 50, y: 85, visible: true, scale: 1 },
    music: { x: 80, y: 80, visible: false, scale: 1 },
    notifications: { x: 85, y: 50, visible: true, scale: 1, items: [] },
    calendar: { x: 20, y: 50, visible: true, scale: 1, events: [] },
    mail: { x: 20, y: 80, visible: true, scale: 1, emails: [] }
  },
  morning: { 
    time: { x: 50, y: 15, visible: true, scale: 1 },
    weather: { x: 85, y: 20, visible: true, scale: 1 },
    status: { x: 90, y: 5, visible: true, scale: 0.8 },
    news: { x: 50, y: 85, visible: true, scale: 1 },
    music: { x: 10, y: 90, visible: false, scale: 1 },
    notifications: { x: 90, y: 80, visible: true, scale: 1, items: [] },
    calendar: { x: 25, y: 50, visible: true, scale: 1.2, events: [] },
    mail: { x: 75, y: 50, visible: true, scale: 1.1, emails: [] }
  },
  zen: { 
    time: { x: 50, y: 50, visible: true, scale: 1.2 },
    weather: { x: 50, y: 65, visible: true, scale: 0.8 },
    status: { x: 90, y: 5, visible: false, scale: 1 },
    news: { x: 50, y: 90, visible: false, scale: 1 },
    music: { x: 80, y: 80, visible: true, scale: 1 },
    notifications: { x: 90, y: 50, visible: false, scale: 1, items: [] },
    calendar: { x: 50, y: 80, visible: true, scale: 1, events: [] },
    mail: { x: 20, y: 80, visible: false, scale: 1, emails: [] }
  }
};

const DEFAULT_CONFIG = { dayStart: 6, nightStart: 19, theme: 'stark', opacity: 1, scale: 1 };

const useSmartMirrorLogic = () => {
  // ---------------------------------------------------------
  // 1. ESTADOS (LA MEMORIA)
  // ---------------------------------------------------------
  const [time, setTime] = useState(new Date());
  const [weather] = useState({ temp: 24, condition: 'Cielo Despejado' });
  const [cameraActive, setCameraActive] = useState(false);
  const [isDayTime, setIsDayTime] = useState(true);

  // VISTA ACTUAL
  const [viewMode, setViewMode] = useState('dashboard');

  // IA
  const [isStandby, setIsStandby] = useState(false); 
  const [bootPhase, setBootPhase] = useState('active');
  const [handDetected, setHandDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // UI
  const [focusMode, setFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(1500); 
  const [sessionComplete, setSessionComplete] = useState(false);
  const [interactionProgress, setInteractionProgress] = useState(0); 
  const [interactionType, setInteractionType] = useState(null); 
  
  const [socket, setSocket] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [hoveredWidget, setHoveredWidget] = useState(null);

  // DATA
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_mirror_config_v1');
      if (saved) return { ...PRESETS.default, ...JSON.parse(saved) };
    } catch (e) { console.error(e); }
    return PRESETS.default;
  });

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_mirror_settings_v1');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) { console.error(e); }
    return DEFAULT_CONFIG;
  });

  // ---------------------------------------------------------
  // 2. REFERENCIAS (PARA EL MOTOR DE FÍSICA Y GESTOS)
  // ---------------------------------------------------------
  const lastActivityRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const isStandbyRef = useRef(false);
  const interactionTimerRef = useRef(0);
  const focusModeRef = useRef(false);
  const viewModeRef = useRef('dashboard'); 

  // Refs para Scroll y Gestos Avanzados
  const agendaScrollRef = useRef(null); 
  const grabStartPosRef = useRef(null); 
  const isDraggingScrollRef = useRef(false);
  const wasGrabbingRef = useRef(false);
  const lastHandYRef = useRef(null);

  const videoRef = useRef(null);
  const grabbedWidgetRef = useRef(null);
  const widgetsRef = useRef(widgets); // Referencia viva
  
  const handsRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  // ---------------------------------------------------------
  // 3. SINCRONIZACIÓN
  // ---------------------------------------------------------
  useEffect(() => { widgetsRef.current = widgets; }, [widgets]);
  useEffect(() => { isStandbyRef.current = isStandby; }, [isStandby]);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  // ---------------------------------------------------------
  // 🔌 CONEXIÓN WEBSOCKET
  // ---------------------------------------------------------
  useEffect(() => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      console.log("🟢 Conectado al Puente Stark");
      newSocket.emit('identify', 'mirror');
    });

    // 1. Notificaciones
    newSocket.on('new-notification', (notif) => {
      playTechSound('notification'); 
      registerActivity(); 
      setWidgets(prev => {
        const currentNotifs = prev.notifications?.items || [];
        const newItems = [notif, ...currentNotifs].slice(0, 5); 
        const baseWidget = prev.notifications || { ...WIDGET_REGISTRY.notifications, x: 85, y: 50, scale: 1 };
        return { ...prev, notifications: { ...baseWidget, visible: true, items: newItems } };
      });
    });

    // 2. Calendario
    newSocket.on('update-calendar', (realEvents) => {
      console.log("📅 Agenda recibida");
      playTechSound('notification');
      setWidgets(prev => {
        const baseCalendar = prev.calendar || { ...WIDGET_REGISTRY.calendar, x: 20, y: 50, scale: 1 };
        return {
            ...prev,
            calendar: {
                ...baseCalendar,
                visible: true, 
                events: realEvents
            }
        };
      });
    });

    // 3. Correo
    newSocket.on('update-mail', (realEmails) => {
        setWidgets(prev => ({
          ...prev,
          mail: { ...(prev.mail || WIDGET_REGISTRY.mail), visible: true, emails: realEmails }
        }));
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // ---------------------------------------------------------
  // 🔊 SISTEMA DE SONIDO
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
      else if (type === 'notification') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      }
      else if (type === 'swipe') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      }
    } catch (e) {}
  };

  // ---------------------------------------------------------
  // 💾 PERSISTENCIA & UTILS
  // ---------------------------------------------------------
  const applyPreset = (presetName) => {
    const preset = PRESETS[presetName] || PRESETS.default;
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
        cleanWidgets[key] = { ...widgets[key], isDragging: false };
      });
      localStorage.setItem('jarvis_mirror_config_v1', JSON.stringify(cleanWidgets));
    }
  }, [widgets, isGrabbing, bootPhase]);

  useEffect(() => {
    localStorage.setItem('jarvis_mirror_settings_v1', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      const hour = now.getHours();
      setIsDayTime(hour >= config.dayStart && hour < config.nightStart);
    }, 1000);
    return () => clearInterval(timer);
  }, [config]);

  // ---------------------------------------------------------
  // 🎮 SISTEMA DE INTERACCIONES (DASHBOARD)
  // ---------------------------------------------------------
  const checkInteractions = (x, y, isGrabbingInput) => {
    if (grabbedWidgetRef.current) { interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null); return; }

    const margin = 10;
    let activeType = null;

    if (viewModeRef.current === 'dashboard') {
        if (x < margin && y < margin) activeType = 'reload';
        else if (x > (100 - margin) && y > (100 - margin)) activeType = 'standby';
        else {
            if (focusModeRef.current) {
                 const dx = Math.abs(50 - x), dy = Math.abs(50 - y);
                 if (dx < 20 && dy < 20 && isGrabbingInput) activeType = 'focus';
            } else {
                // 1. Focus (Reloj)
                const timeWidget = widgetsRef.current.time;
                if (timeWidget?.visible) {
                    const dx = Math.abs(timeWidget.x - x), dy = Math.abs(timeWidget.y - y);
                    if (dx < 15 * (timeWidget.scale || 1) && dy < 15 * (timeWidget.scale || 1) && isGrabbingInput) activeType = 'focus';
                }
                
                // 2. Agenda (Botón)
                const calWidget = widgetsRef.current.calendar;
                if (calWidget?.visible) {
                    const dx = Math.abs(calWidget.x - x), dy = Math.abs(calWidget.y - y);
                    // Hitbox de 15% y requiere PINZA
                    if (dx < 15 && dy < 15 && isGrabbingInput) { 
                        activeType = 'agenda';
                    }
                }
            }
        }
    }

    if (activeType) {
        interactionTimerRef.current += 1;
        setInteractionType(activeType);
        const threshold = activeType === 'agenda' ? 40 : 60; 
        setInteractionProgress(Math.min(100, (interactionTimerRef.current / threshold) * 100));

        if (interactionTimerRef.current >= threshold) {
            if (activeType === 'reload') window.location.reload();
            if (activeType === 'standby') { setIsStandby(true); setBootPhase('standby'); }
            if (activeType === 'focus') setFocusMode(prev => !prev);
            
            if (activeType === 'agenda') {
                console.log("📅 BOTÓN PULSADO: ABRIENDO AGENDA");
                setViewMode('agenda');
                playTechSound('swipe');
            }
            
            interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null);
        }
    } else if (interactionTimerRef.current > 0) {
        interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null);
    }
  };

  // ---------------------------------------------------------
  // ✋ LÓGICA DE MANOS (GESTOS, SCROLL Y CLICK)
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
      const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
      const isGrabbingNow = dist < 0.05;
      
      setIsGrabbing(isGrabbingNow);

      // === LÓGICA POR VISTA ===
      if (viewMode === 'dashboard') {
          checkInteractions(screenX, screenY, isGrabbingNow);
          if (grabbedWidgetRef.current) {
            if (isGrabbingNow) moveWidget(grabbedWidgetRef.current, screenX, screenY); else releaseWidget();
          } else {
            if (isGrabbingNow) checkWidgetGrab(screenX, screenY); else checkWidgetHover(screenX, screenY);
          }
      } 
      // === MODO AGENDA: SCROLL Y SALIR ===
      else if (viewMode === 'agenda') {
          
          // 1. INICIO DEL GESTO
          if (isGrabbingNow && !wasGrabbingRef.current) {
              grabStartPosRef.current = { x: screenX, y: screenY }; 
              isDraggingScrollRef.current = false; 
          }

          // 2. MANTENIENDO EL GESTO
          if (isGrabbingNow) {
              const moveDist = grabStartPosRef.current ? Math.abs(screenY - grabStartPosRef.current.y) : 0;

              // Si mueve más de 5% de la pantalla -> ES SCROLL
              if (moveDist > 5) {
                  isDraggingScrollRef.current = true; 
                  
                  if (agendaScrollRef.current && lastHandYRef.current !== null) {
                      // Delta invertido para sensación táctil
                      const deltaY = (screenY - lastHandYRef.current) * 15; 
                      agendaScrollRef.current.scrollTop -= deltaY;
                  }
              }
          } 
          
          // 3. SOLTAR EL GESTO
          if (!isGrabbingNow && wasGrabbingRef.current) {
              // Si NO fue scroll (fue un toque rápido) -> SALIR
              if (!isDraggingScrollRef.current) {
                  console.log("🔙 CLICK DETECTADO: CERRANDO AGENDA");
                  setViewMode('dashboard');
                  playTechSound('swipe');
              }
          }
      }
      
      wasGrabbingRef.current = isGrabbingNow; 
      lastHandYRef.current = screenY; 

    } else {
      setHandDetected(false); setHoveredWidget(null);
      interactionTimerRef.current = 0; setInteractionProgress(0);
      if (grabbedWidgetRef.current) releaseWidget();
      wasGrabbingRef.current = false;
    }
  };

  const onFaceResults = (r) => { if (r.multiFaceLandmarks?.[0]) { registerActivity(); setFaceDetected(true); } else setFaceDetected(false); };

  // --- HELPERS (CON BLOQUEO DE CALENDARIO) ---
  const checkWidgetGrab = (x, y) => {
    const threshold = 18;
    for (let [name, widget] of Object.entries(widgetsRef.current)) {
      // Bloqueamos 'time' y 'calendar' para que no se muevan, solo se pulsen
      if (!widget.visible || name === 'time' || name === 'calendar') continue;
      
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
  const handleWidgetMouseDown = (e, widgetName) => {}; 

  // Motor de Física
  useEffect(() => {
    const physicsLoop = setInterval(() => {
      if (isGrabbing || showSettings || isStandby || focusMode) return;
      let hasChanges = false;
      const currentWidgets = { ...widgetsRef.current };
      const keys = Object.keys(currentWidgets);
      const repulsionDist = 18;

      keys.forEach((keyA, i) => {
        const wA = currentWidgets[keyA];
        if (keyA === 'time' || !wA.visible || wA.isDragging) return;

        let newX = wA.x, newY = wA.y;
        if (newX < 5) newX += (5 - newX) * 0.1; if (newX > 95) newX += (95 - newX) * 0.1;
        if (newY < 5) newY += (5 - newY) * 0.1; if (newY > 95) newY += (95 - newY) * 0.1;

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

  const registerActivity = () => {
    lastActivityRef.current = Date.now();
    if (isStandbyRef.current) {
      setIsStandby(false); setBootPhase('booting'); setTimeout(() => setBootPhase('active'), 2000);
    }
  };

  useEffect(() => {
    const sleepCheck = setInterval(() => {
      if (!focusMode && !isStandbyRef.current && Date.now() - lastActivityRef.current > 15000) {
        setIsStandby(true); setBootPhase('standby');
      }
    }, 1000);
    return () => clearInterval(sleepCheck);
  }, [focusMode]);

  // ---------------------------------------------------------
  // INICIALIZACIÓN (FIX CÁMARA)
  // ---------------------------------------------------------
  useEffect(() => {
    if (cameraRef.current) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(e => console.log("Play error", e));
          setCameraActive(true);
        }
        
        if (typeof window.Hands === 'undefined' || typeof window.FaceMesh === 'undefined') return;

        handsRef.current = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        handsRef.current.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        handsRef.current.onResults(onHandResults);

        faceMeshRef.current = new window.FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMeshRef.current.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMeshRef.current.onResults(onFaceResults);

        cameraRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current?.readyState === 4) {
              frameCountRef.current++;
              if (handsRef.current) await handsRef.current.send({ image: videoRef.current });
              const faceCheckFrequency = isStandbyRef.current ? 5 : 60;
              if (frameCountRef.current % faceCheckFrequency === 0 && faceMeshRef.current) {
                  await faceMeshRef.current.send({ image: videoRef.current });
              }
            }
          },
          width: 320, height: 240
        });
        await cameraRef.current.start();
      } catch (err) { console.error("Init Error", err); }
    };

    const loadMediaPipe = () => {
        if (window.Hands && window.FaceMesh) { initCamera(); return; }
        // FIX: Versiones fijas para evitar conflictos
        const scripts = [
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
        ];
        let loaded = 0;
        const loadNext = () => {
            if (loaded >= scripts.length) { setTimeout(initCamera, 500); return; }
            if (document.querySelector(`script[src="${scripts[loaded]}"]`)) { loaded++; loadNext(); return; }
            const script = document.createElement('script');
            script.src = scripts[loaded]; script.async = false;
            script.onload = () => { loaded++; loadNext(); };
            document.head.appendChild(script);
        };
        loadNext();
    };

    loadMediaPipe();

    return () => { 
        if (cameraRef.current) {
             try { cameraRef.current.stop(); } catch(e){}
             cameraRef.current = null;
        }
    };
  }, []);

  return {
    time, weather, cameraActive, handDetected, faceDetected, 
    isStandby, bootPhase, widgets, handPosition, isGrabbing, 
    hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, setWidgets,
    config, updateConfig, isDayTime, applyPreset, 
    focusMode, interactionProgress, interactionType, focusTime, sessionComplete,
    viewMode, setViewMode, agendaScrollRef // <--- EXPORTAMOS REF DE SCROLL
  };
};

export default useSmartMirrorLogic;