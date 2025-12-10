import { useState, useEffect, useRef } from 'react';

const useSmartMirrorLogic = () => {
  // --- 1. ESTADOS INICIALES (Tu configuración) ---
  const [time, setTime] = useState(new Date());
  const [weather] = useState({ temp: 24, condition: 'Cielo Despejado' }); // Actualizado valores para demo
  const [cameraActive, setCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  
  // Widgets con la estructura necesaria para el diseño nuevo, pero controlados por tu lógica vieja
  const [widgets, setWidgets] = useState({
    time: { id: 'time', x: 50, y: 20, isDragging: false, visible: true, scale: 1.1 },
    weather: { id: 'weather', x: 20, y: 20, isDragging: false, visible: true, scale: 1 },
    status: { id: 'status', x: 90, y: 5, isDragging: false, visible: true, scale: 0.9 },
    news: { id: 'news', x: 50, y: 85, isDragging: false, visible: true, scale: 1 },
    music: { id: 'music', x: 80, y: 80, isDragging: false, visible: true, scale: 1 } // Visible por defecto para probar
  });

  const [showSettings, setShowSettings] = useState(false);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [hoveredWidget, setHoveredWidget] = useState(null);
  const [mouseGrabbedWidget, setMouseGrabbedWidget] = useState(null);

  // --- 2. REFS (Cruciales para tu lógica) ---
  const videoRef = useRef(null);
  const grabbedWidgetRef = useRef(null);
  const widgetsRef = useRef(widgets); // Mantiene referencia actualizada para evitar bugs de closure

  // Sincronizar Ref con Estado (La clave para que funcione el movimiento)
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 3. LÓGICA DE DETECCIÓN (TU CÓDIGO ORIGINAL) ---
  const onResults = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      setHandDetected(true);

      // 1. Calcular Posición (Tu fórmula exacta)
      const palm = landmarks[9];
      const screenX = (1 - palm.x) * 100;
      const screenY = palm.y * 100;
      setHandPosition({ x: screenX, y: screenY });

      // 2. Calcular Distancia Pulgar (4) - Índice (8)
      const thumb = landmarks[4];
      const index = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + 
        Math.pow(thumb.y - index.y, 2)
      );

      // 3. Umbral de agarre (Tu valor exacto: 0.08)
      const isGrabbingNow = distance < 0.08;
      
      // Lógica de estado de agarre
      if (isGrabbingNow && !isGrabbing && !grabbedWidgetRef.current) {
        checkWidgetGrab(screenX, screenY);
      } else if (!isGrabbingNow && grabbedWidgetRef.current) {
        releaseWidget();
      }
      
      setIsGrabbing(isGrabbingNow);

      // Si hay algo agarrado, moverlo
      if (grabbedWidgetRef.current && isGrabbingNow) {
        moveWidget(grabbedWidgetRef.current, screenX, screenY);
      }
      
      // Si no agarra nada, checar hover visual
      if (!isGrabbingNow && !grabbedWidgetRef.current) {
        checkWidgetHover(screenX, screenY);
      }

    } else {
      // Reset si no hay mano
      setHandDetected(false);
      setHoveredWidget(null);
      if (grabbedWidgetRef.current) releaseWidget();
    }
  };

  // --- 4. FUNCIONES AUXILIARES (TU LÓGICA) ---
  const checkWidgetGrab = (x, y) => {
    const threshold = 18; // Tu hitbox original
    const currentWidgets = widgetsRef.current;
    
    for (let [name, widget] of Object.entries(currentWidgets)) {
      if (!widget.visible) continue;
      const dx = Math.abs(widget.x - x);
      const dy = Math.abs(widget.y - y);
      
      if (dx < threshold && dy < threshold) {
        grabbedWidgetRef.current = name;
        setWidgets(prev => ({
          ...prev,
          [name]: { ...prev[name], isDragging: true }
        }));
        return;
      }
    }
  };

  const moveWidget = (name, x, y) => {
    setWidgets(prev => ({
      ...prev,
      [name]: { ...prev[name], x, y }
    }));
  };

  const releaseWidget = () => {
    const widgetName = grabbedWidgetRef.current;
    if (widgetName) {
      setWidgets(prev => ({
        ...prev,
        [widgetName]: { ...prev[widgetName], isDragging: false }
      }));
    }
    grabbedWidgetRef.current = null;
    setIsGrabbing(false);
    setHoveredWidget(null);
  };

  const checkWidgetHover = (x, y) => {
    const threshold = 18;
    const currentWidgets = widgetsRef.current;
    let found = null;
    
    for (let [name, widget] of Object.entries(currentWidgets)) {
      if (!widget.visible) continue;
      const dx = Math.abs(widget.x - x);
      const dy = Math.abs(widget.y - y);
      if (dx < threshold && dy < threshold) {
        found = name;
        break;
      }
    }
    setHoveredWidget(found);
  };

  // --- 5. SETUP MEDIAPIPE (TU CÓDIGO) ---
  useEffect(() => {
    let hands, camera;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }

        if (typeof window.Hands === 'undefined') return;

        hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // Volvemos a 0 como en tu script original
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current?.readyState === 4) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240
        });
        await camera.start();
      } catch (err) { console.error(err); }
    };

    const loadMediaPipe = () => {
        if (document.querySelector('script[src*="mediapipe"]')) { initCamera(); return; }
        const scripts = [
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
        ];
        let loaded = 0;
        scripts.forEach(src => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.onload = () => { loaded++; if (loaded === scripts.length) setTimeout(initCamera, 1000); };
          document.head.appendChild(script);
        });
    };
    loadMediaPipe();
    return () => { if (camera) try { camera.stop(); } catch(e){} };
  }, []);

  // --- 6. LOGICA MOUSE (Para pruebas y respaldo) ---
  const handleWidgetMouseDown = (e, widgetName) => {
    e.preventDefault();
    setMouseGrabbedWidget(widgetName);
    setWidgets(prev => ({ ...prev, [widgetName]: { ...prev[widgetName], isDragging: true } }));
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (mouseGrabbedWidget) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        moveWidget(mouseGrabbedWidget, x, y);
      }
    };
    const handleMouseUp = () => {
      if (mouseGrabbedWidget) {
        setWidgets(prev => ({...prev, [mouseGrabbedWidget]: { ...prev[mouseGrabbedWidget], isDragging: false }}));
        setMouseGrabbedWidget(null);
      }
    };
    if (mouseGrabbedWidget) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [mouseGrabbedWidget]);

  // Helpers simples para UI
  const toggleWidget = (id) => {
      setWidgets(prev => ({
          ...prev, 
          [id]: { ...prev[id], visible: !prev[id]?.visible }
      }));
  };

  return {
    time, weather, cameraActive, handDetected, widgets,
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings,
    videoRef, handleWidgetMouseDown, toggleWidget, setWidgets
  };
};

export default useSmartMirrorLogic;