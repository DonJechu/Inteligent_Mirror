import React, { useState, useEffect, useRef } from 'react';
import { Camera, Wifi, Battery, Cloud, Sun, Moon } from 'lucide-react';

const SmartMirror = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 22, condition: 'Soleado' });
  const [cameraActive, setCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [widgets, setWidgets] = useState({
    time: { x: 50, y: 20, isDragging: false },
    weather: { x: 50, y: 60, isDragging: false },
    status: { x: 85, y: 5, isDragging: false }
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [grabbedWidget, setGrabbedWidget] = useState(null);
  const grabbedWidgetRef = useRef(null); // Usar ref para acceso inmediato
  const [hoveredWidget, setHoveredWidget] = useState(null);

  // Estado para mouse
  const [mouseGrabbedWidget, setMouseGrabbedWidget] = useState(null);

  // Actualizar reloj
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Event listeners para mouse
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
        setWidgets(prev => ({
          ...prev,
          [mouseGrabbedWidget]: { ...prev[mouseGrabbedWidget], isDragging: false }
        }));
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

  // Inicializar cámara y detección de manos
  useEffect(() => {
    let hands;
    let camera;

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

        // Esperar a que MediaPipe esté disponible
        if (typeof window.Hands === 'undefined') {
          console.error('MediaPipe Hands no está disponible');
          return;
        }

        hands = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // Cambiar a 0 para mejor rendimiento
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 320, // Reducido de 640 para mejor rendimiento
          height: 240 // Reducido de 480 para mejor rendimiento
        });
        
        await camera.start();

      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
      }
    };

    // Cargar scripts de MediaPipe
    const loadMediaPipe = () => {
      if (document.querySelector('script[src*="mediapipe"]')) {
        // Ya están cargados
        initCamera();
        return;
      }

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
        script.onload = () => {
          loaded++;
          if (loaded === scripts.length) {
            setTimeout(initCamera, 1000);
          }
        };
        script.onerror = (e) => {
          console.error('Error cargando script:', src, e);
        };
        document.head.appendChild(script);
      });
    };

    loadMediaPipe();

    return () => {
      if (camera) {
        try {
          camera.stop();
        } catch (e) {}
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current?.videoWidth || 320;
    canvas.height = videoRef.current?.videoHeight || 240;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      setHandDetected(true);

      // Posición de la palma (landmark 9)
      const palm = landmarks[9];
      const screenX = (1 - palm.x) * 100; // Invertir X para efecto espejo
      const screenY = palm.y * 100;
      setHandPosition({ x: screenX, y: screenY });

      // Detectar gesto de agarre (comparar distancia entre pulgar y índice)
      const thumb = landmarks[4];
      const index = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + 
        Math.pow(thumb.y - index.y, 2)
      );

      const isGrabbingNow = distance < 0.08; // Aumentado para detectar mejor
      
      if (isGrabbingNow && !isGrabbing && !grabbedWidgetRef.current) {
        // Comenzar a agarrar SOLO si no hay nada agarrado
        checkWidgetGrab(screenX, screenY);
        console.log('🟢 Iniciando agarre');
      } else if (!isGrabbingNow && grabbedWidgetRef.current) {
        // Soltar - se activa cuando la distancia es >= 0.08
        console.log('🔴 Soltando widget:', grabbedWidgetRef.current);
        releaseWidget();
      }
      
      setIsGrabbing(isGrabbingNow);

      // SIEMPRE actualizar posición si hay un widget agarrado Y estamos agarrando
      if (grabbedWidgetRef.current && isGrabbingNow) {
        console.log(`📍 Moviendo ${grabbedWidgetRef.current} a x:${screenX.toFixed(1)} y:${screenY.toFixed(1)}`);
        moveWidget(grabbedWidgetRef.current, screenX, screenY);
      }
      
      // Verificar hover solo si no está agarrando
      if (!isGrabbingNow && !grabbedWidgetRef.current) {
        checkWidgetHover(screenX, screenY);
      }

      // Dibujar mano (opcional, comentar si quieres más FPS)
      // drawHand(ctx, landmarks, canvas.width, canvas.height);
    } else {
      setHandDetected(false);
      setHoveredWidget(null);
      if (grabbedWidgetRef.current) releaseWidget();
    }
  };

  const drawHand = (ctx, landmarks, width, height) => {
    // Dibujar conexiones
    const connections = [
      [0,1],[1,2],[2,3],[3,4], // Pulgar
      [0,5],[5,6],[6,7],[7,8], // Índice
      [0,9],[9,10],[10,11],[11,12], // Medio
      [0,13],[13,14],[14,15],[15,16], // Anular
      [0,17],[17,18],[18,19],[19,20], // Meñique
      [5,9],[9,13],[13,17] // Palma
    ];

    ctx.strokeStyle = isGrabbing ? '#3b82f6' : '#10b981';
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      ctx.beginPath();
      ctx.moveTo((1 - startPoint.x) * width, startPoint.y * height);
      ctx.lineTo((1 - endPoint.x) * width, endPoint.y * height);
      ctx.stroke();
    });

    // Dibujar puntos
    landmarks.forEach((point, index) => {
      ctx.fillStyle = index === 4 || index === 8 ? '#f59e0b' : '#10b981';
      ctx.beginPath();
      ctx.arc((1 - point.x) * width, point.y * height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const checkWidgetHover = (x, y) => {
    const threshold = 15;
    let foundHover = null;
    
    for (let [name, widget] of Object.entries(widgets)) {
      const dx = Math.abs(widget.x - x);
      const dy = Math.abs(widget.y - y);
      if (dx < threshold && dy < threshold) {
        foundHover = name;
        break;
      }
    }
    
    setHoveredWidget(foundHover);
  };

  const checkWidgetGrab = (x, y) => {
    const threshold = 15;
    for (let [name, widget] of Object.entries(widgets)) {
      const dx = Math.abs(widget.x - x);
      const dy = Math.abs(widget.y - y);
      if (dx < threshold && dy < threshold) {
        setGrabbedWidget(name);
        grabbedWidgetRef.current = name; // Guardar en ref también
        setWidgets(prev => ({
          ...prev,
          [name]: { ...prev[name], isDragging: true }
        }));
        console.log(`Widget ${name} agarrado`);
        return;
      }
    }
  };

  const moveWidget = (name, x, y) => {
    console.log(`Moviendo ${name} a x:${x.toFixed(1)} y:${y.toFixed(1)}`); // Debug
    setWidgets(prev => ({
      ...prev,
      [name]: { ...prev[name], x, y }
    }));
  };

  const releaseWidget = () => {
    const widgetName = grabbedWidgetRef.current;
    console.log('🔵 Limpiando widget agarrado:', widgetName);
    
    if (widgetName) {
      setWidgets(prev => ({
        ...prev,
        [widgetName]: { ...prev[widgetName], isDragging: false }
      }));
    }
    
    setGrabbedWidget(null);
    grabbedWidgetRef.current = null; // Limpiar ref PRIMERO
    setIsGrabbing(false); // Asegurar que isGrabbing se ponga en false
    setHoveredWidget(null);
  };

  const handleWidgetMouseDown = (e, widgetName) => {
    e.preventDefault();
    setMouseGrabbedWidget(widgetName);
    setWidgets(prev => ({
      ...prev,
      [widgetName]: { ...prev[widgetName], isDragging: true }
    }));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video de cámara oculto */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="hidden"
      />
      <canvas 
        ref={canvasRef} 
        className="absolute top-4 right-4 w-32 h-24 border-2 border-white/20 rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Cursor de mano virtual */}
      {handDetected && (
        <div 
          className="absolute w-8 h-8 rounded-full pointer-events-none z-50"
          style={{ 
            left: `${handPosition.x}%`, 
            top: `${handPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: isGrabbing ? '#ef4444' : '#10b981',
            boxShadow: isGrabbing ? '0 0 30px #ef4444' : '0 0 30px #10b981',
            border: '3px solid white',
            transition: 'none'
          }}
        />
      )}

      {/* Widget de Hora */}
      <div 
        className={`absolute ${
          widgets.time.isDragging 
            ? 'scale-125 shadow-2xl rotate-2' 
            : hoveredWidget === 'time' 
            ? 'scale-105 shadow-lg' 
            : ''
        }`}
        style={{ 
          left: `${widgets.time.x}%`, 
          top: `${widgets.time.y}%`,
          transform: 'translate(-50%, -50%)',
          filter: hoveredWidget === 'time' ? 'brightness(1.2)' : 'brightness(1)',
          transition: widgets.time.isDragging ? 'none' : 'all 0.2s'
        }}
      >
        <div 
          className={`text-center cursor-move ${widgets.time.isDragging ? 'opacity-80' : ''}`}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'time')}
        >
          <div className="text-8xl font-thin text-white tracking-wider mb-2">
            {formatTime(time)}
          </div>
          <div className="text-2xl text-white/70 font-light capitalize">
            {formatDate(time)}
          </div>
        </div>
        {hoveredWidget === 'time' && !widgets.time.isDragging && (
          <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Widget de Clima */}
      <div 
        className={`absolute ${
          widgets.weather.isDragging 
            ? 'scale-125 shadow-2xl -rotate-2' 
            : hoveredWidget === 'weather' 
            ? 'scale-105 shadow-lg' 
            : ''
        }`}
        style={{ 
          left: `${widgets.weather.x}%`, 
          top: `${widgets.weather.y}%`,
          transform: 'translate(-50%, -50%)',
          filter: hoveredWidget === 'weather' ? 'brightness(1.2)' : 'brightness(1)',
          transition: widgets.weather.isDragging ? 'none' : 'all 0.2s'
        }}
      >
        <div 
          className={`backdrop-blur-md bg-white/10 rounded-3xl p-6 border cursor-move transition-all ${
            hoveredWidget === 'weather' ? 'border-blue-400' : 'border-white/20'
          } ${widgets.weather.isDragging ? 'opacity-80' : ''}`}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'weather')}
        >
          <div className="flex items-center gap-4">
            <Sun className="w-12 h-12 text-yellow-300" />
            <div>
              <div className="text-5xl font-light text-white">{weather.temp}°</div>
              <div className="text-white/70">{weather.condition}</div>
            </div>
          </div>
        </div>
        {hoveredWidget === 'weather' && !widgets.weather.isDragging && (
          <div className="absolute inset-0 rounded-3xl border-2 border-blue-400 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Widget de Estado */}
      <div 
        className={`absolute ${
          widgets.status.isDragging 
            ? 'scale-125 shadow-2xl rotate-3' 
            : hoveredWidget === 'status' 
            ? 'scale-105 shadow-lg' 
            : ''
        }`}
        style={{ 
          left: `${widgets.status.x}%`, 
          top: `${widgets.status.y}%`,
          transform: 'translate(-50%, -50%)',
          filter: hoveredWidget === 'status' ? 'brightness(1.2)' : 'brightness(1)',
          transition: widgets.status.isDragging ? 'none' : 'all 0.2s'
        }}
      >
        <div 
          className={`flex gap-4 cursor-move ${widgets.status.isDragging ? 'opacity-80' : ''}`}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'status')}
        >
          <div className={`backdrop-blur-md bg-white/10 rounded-full p-3 border transition-all ${
            hoveredWidget === 'status' ? 'border-blue-400' : 'border-white/20'
          }`}>
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div className={`backdrop-blur-md bg-white/10 rounded-full p-3 border transition-all ${
            hoveredWidget === 'status' ? 'border-blue-400' : 'border-white/20'
          }`}>
            <Battery className="w-5 h-5 text-white" />
          </div>
        </div>
        {hoveredWidget === 'status' && !widgets.status.isDragging && (
          <div className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Indicador de estado */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="backdrop-blur-md bg-white/10 rounded-full px-6 py-3 border border-white/20">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              cameraActive ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`} />
            <span className="text-white text-sm">
              {handDetected ? (
                isGrabbing ? '✊ Moviendo widget' : hoveredWidget ? '🫳 Junta dedos para agarrar' : '✋ Mano detectada'
              ) : 'Esperando detección...'}
            </span>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="absolute top-8 left-8 max-w-sm">
        <div className="backdrop-blur-md bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-white font-light text-lg mb-2">Control por Gestos</h3>
          <ul className="text-white/60 text-sm space-y-1">
            <li>✋ Mantén tu mano frente a la cámara</li>
            <li>🤏 Junta pulgar e índice para agarrar</li>
            <li>↔️ Mueve tu mano para arrastrar widgets</li>
            <li>✌️ Separa dedos para soltar</li>
            <li>🖱️ O usa el mouse para probar (click y arrastra)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SmartMirror;