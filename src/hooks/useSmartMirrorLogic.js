import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useJarvisVoice from './useJarvisVoice';
import { WIDGET_REGISTRY, PRESETS, DEFAULT_CONFIG } from '../config/constants';

// SONIDO
const playTechSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'complete') { osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.8); } 
    else if (type === 'notification') { osc.type = 'triangle'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now + 0.3); } 
    else if (type === 'swipe') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now + 0.3); }
  } catch (e) {}
};

const useSmartMirrorLogic = () => {
  const [time, setTime] = useState(new Date());
  const [weather] = useState({ temp: 24, condition: 'Cielo Despejado' });
  const [cameraActive, setCameraActive] = useState(false);
  const [isDayTime, setIsDayTime] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard');
  const [isStandby, setIsStandby] = useState(false); 
  const [bootPhase, setBootPhase] = useState('active');
  const [handDetected, setHandDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
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

  const [widgets, setWidgets] = useState(() => {
    try { const saved = localStorage.getItem('jarvis_mirror_config_v2'); if (saved) return { ...PRESETS.default, ...JSON.parse(saved) }; } catch (e) { }
    return PRESETS.default;
  });

  const [config, setConfig] = useState(() => {
    try { const saved = localStorage.getItem('jarvis_mirror_settings_v2'); if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }; } catch (e) { }
    return DEFAULT_CONFIG;
  });

  const resetToFactory = () => {
      if(confirm("¿Reiniciar configuración de fábrica?")) {
          localStorage.removeItem('jarvis_mirror_config_v2');
          localStorage.removeItem('jarvis_mirror_settings_v2');
          setWidgets(PRESETS.default);
          setConfig(DEFAULT_CONFIG);
          window.location.reload();
      }
  };

  useJarvisVoice({ setWidgets, setIsStandby, setBootPhase, playTechSound, searchWidgetDefault: WIDGET_REGISTRY.search });

  // REFS
  const lastActivityRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const isStandbyRef = useRef(false);
  const interactionTimerRef = useRef(0);
  const focusModeRef = useRef(false);
  const viewModeRef = useRef('dashboard'); 
  const agendaScrollRef = useRef(null); 
  const grabStartPosRef = useRef(null); 
  const isDraggingScrollRef = useRef(false);
  const wasGrabbingRef = useRef(false);
  const lastHandYRef = useRef(null);
  const videoRef = useRef(null);
  const grabbedWidgetRef = useRef(null);
  const widgetsRef = useRef(widgets); 
  const handsRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => { widgetsRef.current = widgets; }, [widgets]);
  useEffect(() => { isStandbyRef.current = isStandby; }, [isStandby]);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  // SOCKETS
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    newSocket.on('new-notification', (notif) => {
      playTechSound('notification'); registerActivity(); 
      setWidgets(prev => {
        const currentNotifs = prev.notifications?.items || [];
        const baseWidget = prev.notifications || { ...WIDGET_REGISTRY.notifications, x: 85, y: 50, scale: 1 };
        return { ...prev, notifications: { ...baseWidget, visible: true, items: [notif, ...currentNotifs].slice(0, 5) } };
      });
    });
    newSocket.on('update-calendar', (realEvents) => setWidgets(prev => ({ ...prev, calendar: { ...(prev.calendar || WIDGET_REGISTRY.calendar), visible: true, events: realEvents } })));
    newSocket.on('update-mail', (realEmails) => setWidgets(prev => ({ ...prev, mail: { ...(prev.mail || WIDGET_REGISTRY.mail), visible: true, emails: realEmails } })));
    newSocket.on('update-music', (track) => setWidgets(prev => ({ ...prev, music: { ...(prev.music || WIDGET_REGISTRY.music), visible: true, track: track } })));
    return () => newSocket.close();
  }, []);

  const applyPreset = (presetName) => { const preset = PRESETS[presetName] || PRESETS.default; setWidgets(prev => { const newWidgets = { ...prev }; Object.keys(preset).forEach(key => { if (newWidgets[key]) newWidgets[key] = { ...newWidgets[key], ...preset[key], isDragging: false }; }); return newWidgets; }); };
  useEffect(() => { if (!isGrabbing && bootPhase === 'active') { const clean = {}; Object.keys(widgets).forEach(k => clean[k] = { ...widgets[k], isDragging: false }); localStorage.setItem('jarvis_mirror_config_v2', JSON.stringify(clean)); } }, [widgets, isGrabbing]);
  useEffect(() => { localStorage.setItem('jarvis_mirror_settings_v2', JSON.stringify(config)); }, [config]);
  useEffect(() => { const t = setInterval(() => { const n = new Date(); setTime(n); setIsDayTime(n.getHours() >= config.dayStart && n.getHours() < config.nightStart); }, 1000); return () => clearInterval(t); }, [config]);
  
  useEffect(() => { let timer = null; if (focusMode && !sessionComplete && focusTime > 0) { timer = setInterval(() => setFocusTime(prev => prev - 1), 1000); } else if (!focusMode) { setFocusTime(1500); setSessionComplete(false); } else if (focusTime === 0 && !sessionComplete) { setSessionComplete(true); playTechSound('complete'); setTimeout(() => { setFocusMode(false); setSessionComplete(false); setFocusTime(1500); }, 5000); } return () => clearInterval(timer); }, [focusMode, focusTime, sessionComplete]);
  
  const registerActivity = () => { lastActivityRef.current = Date.now(); if (isStandbyRef.current) { setIsStandby(false); setBootPhase('booting'); setTimeout(() => setBootPhase('active'), 2000); } };
  useEffect(() => { const s = setInterval(() => { if (!focusMode && !isStandbyRef.current && Date.now() - lastActivityRef.current > 15000) { setIsStandby(true); setBootPhase('standby'); } }, 1000); return () => clearInterval(s); }, [focusMode]);

  const checkInteractions = (x, y, isGrabbingInput) => {
    if (grabbedWidgetRef.current) { interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null); return; }
    const margin = 10; let activeType = null;
    if (viewModeRef.current === 'dashboard') {
        if (x < margin && y < margin) activeType = 'reload';
        else if (x > (100 - margin) && y > (100 - margin)) activeType = 'standby';
        else {
            if (focusModeRef.current) { const dx = Math.abs(50 - x), dy = Math.abs(50 - y); if (dx < 20 && dy < 20 && isGrabbingInput) activeType = 'focus'; } 
            else {
                const timeW = widgetsRef.current.time;
                if (timeW?.visible) { const dx = Math.abs(timeW.x - x), dy = Math.abs(timeW.y - y); if (dx < 15 && dy < 15 && isGrabbingInput) activeType = 'focus'; }
                const calW = widgetsRef.current.calendar;
                if (calW?.visible) { const dx = Math.abs(calW.x - x), dy = Math.abs(calW.y - y); if (dx < 15 && dy < 15 && isGrabbingInput) activeType = 'agenda'; }
            }
        }
    }
    if (activeType) {
        interactionTimerRef.current += 1; setInteractionType(activeType); const threshold = activeType === 'agenda' ? 40 : 60; setInteractionProgress(Math.min(100, (interactionTimerRef.current / threshold) * 100));
        if (interactionTimerRef.current >= threshold) {
            if (activeType === 'reload') window.location.reload();
            if (activeType === 'standby') { setIsStandby(true); setBootPhase('standby'); }
            if (activeType === 'focus') setFocusMode(prev => !prev);
            if (activeType === 'agenda') { setViewMode('agenda'); playTechSound('swipe'); }
            interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null);
        }
    } else if (interactionTimerRef.current > 0) { interactionTimerRef.current = 0; setInteractionProgress(0); setInteractionType(null); }
  };

  const onHandResults = (results) => {
    if (results.multiHandLandmarks?.[0]) {
      registerActivity(); setHandDetected(true);
      const palm = results.multiHandLandmarks[0][9];
      const screenX = (1 - palm.x) * 100; const screenY = palm.y * 100;
      setHandPosition({ x: screenX, y: screenY });
      const thumb = results.multiHandLandmarks[0][4]; const index = results.multiHandLandmarks[0][8];
      const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
      const isGrabbingNow = dist < 0.05;
      setIsGrabbing(isGrabbingNow);

      if (viewMode === 'dashboard') {
          checkInteractions(screenX, screenY, isGrabbingNow);
          if (grabbedWidgetRef.current) { if (isGrabbingNow) moveWidget(grabbedWidgetRef.current, screenX, screenY); else releaseWidget(); } 
          else { if (isGrabbingNow) checkWidgetGrab(screenX, screenY); else checkWidgetHover(screenX, screenY); }
      } else if (viewMode === 'agenda') {
          if (isGrabbingNow && !wasGrabbingRef.current) { grabStartPosRef.current = { x: screenX, y: screenY }; lastHandYRef.current = screenY; isDraggingScrollRef.current = false; interactionTimerRef.current = 0; }
          if (isGrabbingNow) {
              const moveDist = grabStartPosRef.current ? Math.abs(screenY - grabStartPosRef.current.y) : 0;
              if (moveDist > 2) { isDraggingScrollRef.current = true; interactionTimerRef.current = 0; if (agendaScrollRef.current && lastHandYRef.current !== null) { const deltaY = (screenY - lastHandYRef.current) * 25; agendaScrollRef.current.scrollTop -= deltaY; } } 
              else if (!isDraggingScrollRef.current) { interactionTimerRef.current += 1; if (interactionTimerRef.current > 50) { setViewMode('dashboard'); playTechSound('swipe'); interactionTimerRef.current = 0; } }
          } 
      }
      wasGrabbingRef.current = isGrabbingNow; lastHandYRef.current = screenY; 
    } else { setHandDetected(false); setHoveredWidget(null); interactionTimerRef.current = 0; setInteractionProgress(0); if (grabbedWidgetRef.current) releaseWidget(); wasGrabbingRef.current = false; }
  };

  const onFaceResults = (r) => { if (r.multiFaceLandmarks?.[0]) { registerActivity(); setFaceDetected(true); } else setFaceDetected(false); };
  const checkWidgetGrab = (x, y) => { for (let [name, widget] of Object.entries(widgetsRef.current)) { if (!widget.visible || name === 'time' || name === 'calendar') continue; if (Math.abs(widget.x - x) < 18 && Math.abs(widget.y - y) < 18) { grabbedWidgetRef.current = name; setWidgets(prev => ({ ...prev, [name]: { ...prev[name], isDragging: true } })); return; } } };
  const moveWidget = (name, x, y) => setWidgets(prev => ({ ...prev, [name]: { ...prev[name], x, y } }));
  const releaseWidget = () => { if (grabbedWidgetRef.current) setWidgets(prev => ({ ...prev, [grabbedWidgetRef.current]: { ...prev[grabbedWidgetRef.current], isDragging: false } })); grabbedWidgetRef.current = null; setIsGrabbing(false); setHoveredWidget(null); };
  const checkWidgetHover = (x, y) => { let found = null; for (let [name, widget] of Object.entries(widgetsRef.current)) { if (!widget.visible) continue; if (Math.abs(widget.x - x) < 18 && Math.abs(widget.y - y) < 18) { found = name; break; } } setHoveredWidget(found); };
  const toggleWidget = (id) => setWidgets(prev => ({ ...prev, [id]: { ...prev[id], visible: !prev[id]?.visible } }));
  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const handleWidgetMouseDown = (e, widgetName) => {}; 

  useEffect(() => {
    if (cameraRef.current) return;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(e=>{}); setCameraActive(true); }
        if (typeof window.Hands === 'undefined') return;
        handsRef.current = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        handsRef.current.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        handsRef.current.onResults(onHandResults);
        faceMeshRef.current = new window.FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMeshRef.current.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMeshRef.current.onResults(onFaceResults);
        cameraRef.current = new window.Camera(videoRef.current, { onFrame: async () => { if (videoRef.current?.readyState === 4) { frameCountRef.current++; if (handsRef.current) await handsRef.current.send({ image: videoRef.current }); if (frameCountRef.current % (isStandbyRef.current ? 5 : 60) === 0 && faceMeshRef.current) await faceMeshRef.current.send({ image: videoRef.current }); } }, width: 320, height: 240 });
        await cameraRef.current.start();
      } catch (err) {}
    };
    const loadMediaPipe = () => { if (window.Hands) { initCamera(); return; } const scripts = ['https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js', 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js', 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js']; let loaded = 0; const loadNext = () => { if (loaded >= scripts.length) { setTimeout(initCamera, 500); return; } const script = document.createElement('script'); script.src = scripts[loaded]; script.crossOrigin = "anonymous"; script.async = false; script.onload = () => { loaded++; loadNext(); }; document.head.appendChild(script); }; loadNext(); };
    loadMediaPipe();
    return () => { if (cameraRef.current) { try { cameraRef.current.stop(); } catch(e){} cameraRef.current = null; } };
  }, []);

  return { time, weather, cameraActive, handDetected, faceDetected, isStandby, bootPhase, widgets, handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings, videoRef, handleWidgetMouseDown, toggleWidget, setWidgets, config, updateConfig, isDayTime, applyPreset, focusMode, interactionProgress, interactionType, focusTime, sessionComplete, viewMode, setViewMode, agendaScrollRef, resetToFactory };
};

export default useSmartMirrorLogic;