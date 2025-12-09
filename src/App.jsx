import React, { useState, useEffect, useRef } from 'react';
import { Camera, Wifi, Battery, Cloud, Sun, Moon } from 'lucide-react';

const SmartMirror = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 22, condition: 'Soleado' });
  const [cameraActive, setCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [widgets, setWidgets] = useState({
    time: { id: 'time', x: 50, y: 20, isDragging: false, visible: true },
    weather: { id: 'weather', x: 50, y: 60, isDragging: false, visible: true },
    status: { id: 'status', x: 85, y: 5, isDragging: false, visible: true }
  });
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  
  // Widgets disponibles para agregar
  const availableWidgets = [
    { id: 'time', name: 'Reloj', icon: '🕐', color: 'bg-blue-500' },
    { id: 'weather', name: 'Clima', icon: '☀️', color: 'bg-yellow-500' },
    { id: 'status', name: 'Estado', icon: '📶', color: 'bg-green-500' },
    { id: 'calendar', name: 'Calendario', icon: '📅', color: 'bg-purple-500' },
    { id: 'news', name: 'Noticias', icon: '📰', color: 'bg-red-500' },
    { id: 'music', name: 'Música', icon: '🎵', color: 'bg-pink-500' },
  ];

  const videoRef = useRef(null);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [grabbedWidget, setGrabbedWidget] = useState(null);
  const grabbedWidgetRef = useRef(null);
  const widgetsRef = useRef(widgets); // Mantener referencia actualizada
  const [hoveredWidget, setHoveredWidget] = useState(null);
  const [lastGrabState, setLastGrabState] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

  // Estado para mouse
  const [mouseGrabbedWidget, setMouseGrabbedWidget] = useState(null);

  // Actualizar reloj
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mantener widgetsRef actualizado
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

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
          modelComplexity: 0,
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
          width: 320,
          height: 240
        });
        
        await camera.start();

      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
      }
    };

    const loadMediaPipe = () => {
      if (document.querySelector('script[src*="mediapipe"]')) {
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
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      setHandDetected(true);

      const palm = landmarks[9];
      const screenX = (1 - palm.x) * 100;
      const screenY = palm.y * 100;
      setHandPosition({ x: screenX, y: screenY });

      const thumb = landmarks[4];
      const index = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + 
        Math.pow(thumb.y - index.y, 2)
      );

      const isGrabbingNow = distance < 0.08;
      
      if (isGrabbingNow && !isGrabbing && !grabbedWidgetRef.current) {
        checkWidgetGrab(screenX, screenY);
        console.log('🟢 Iniciando agarre');
      } else if (!isGrabbingNow && grabbedWidgetRef.current) {
        console.log('🔴 Soltando widget:', grabbedWidgetRef.current);
        releaseWidget();
      }
      
      setIsGrabbing(isGrabbingNow);

      if (grabbedWidgetRef.current && isGrabbingNow) {
        console.log(`📍 Moviendo ${grabbedWidgetRef.current} a x:${screenX.toFixed(1)} y:${screenY.toFixed(1)}`);
        moveWidget(grabbedWidgetRef.current, screenX, screenY);
      }
      
      if (!isGrabbingNow && !grabbedWidgetRef.current) {
        checkWidgetHover(screenX, screenY);
        checkMenuItemHover(screenX, screenY);
      }

    } else {
      setHandDetected(false);
      setHoveredWidget(null);
      setMenuHovered(false);
      setHoveredMenuItem(null);
      if (grabbedWidgetRef.current) releaseWidget();
    }
  };

  const checkWidgetHover = (x, y) => {
    const threshold = 18; // Hitbox más grande
    let foundHover = null;
    
    // Verificar si está sobre el botón del menú (ajustado para alcance completo)
    if (x > 3 && x < 18 && y > 80 && y < 98) {
      setMenuHovered(true);
      return;
    } else {
      setMenuHovered(false);
    }
    
    // Usar widgetsRef para tener las posiciones actualizadas
    const currentWidgets = widgetsRef.current;
    for (let [name, widget] of Object.entries(currentWidgets)) {
      if (!widget.visible) continue;
      const dx = Math.abs(widget.x - x);
      const dy = Math.abs(widget.y - y);
      if (dx < threshold && dy < threshold) {
        foundHover = name;
        break;
      }
    }
    
    setHoveredWidget(foundHover);
  };

  const checkMenuItemHover = (x, y) => {
    if (!showWidgetMenu) {
      setHoveredMenuItem(null);
      return;
    }

    // Área del menú: bottom-24 left-8
    // El menú ocupa aproximadamente: X: 3-30%, Y: 55-90%
    if (x < 3 || x > 35 || y < 50 || y > 92) {
      setHoveredMenuItem(null);
      return;
    }

    // Calcular posición relativa en la grid 2x3
    const menuStartX = 8; // left-8 en porcentaje
    const menuStartY = 55; // bottom-24 aproximado
    const menuWidth = 22; // ancho del menú
    const menuHeight = 32; // alto del menú
    
    const relX = ((x - menuStartX) / menuWidth) * 100; // 0-100% dentro del menú
    const relY = ((y - menuStartY) / menuHeight) * 100; // 0-100% dentro del menú

    if (relX < 0 || relX > 100 || relY < 0 || relY > 100) {
      setHoveredMenuItem(null);
      return;
    }

    const col = relX < 50 ? 0 : 1;
    const row = Math.floor(relY / 33.33); // Dividir en 3 filas (cada una ~33%)

    if (row >= 0 && row < 3) {
      const index = row * 2 + col;
      if (index < availableWidgets.length) {
        const widgetId = availableWidgets[index].id;
        console.log(`🎯 Hover sobre widget del menú: ${widgetId} (col:${col}, row:${row})`);
        setHoveredMenuItem(widgetId);
        return;
      }
    }

    setHoveredMenuItem(null);
  };

  const handleGestureClick = (x, y) => {
    console.log('👆 Procesando click en', x.toFixed(1), y.toFixed(1));
    console.log('   showWidgetMenu:', showWidgetMenu);
    console.log('   hoveredMenuItem:', hoveredMenuItem);

    // Click en botón de menú
    const onMenuButton = x > 3 && x < 18 && y > 80 && y < 98;
    
    if (onMenuButton) {
      console.log('✅ Click en menú confirmado');
      setShowWidgetMenu(prev => !prev);
      return;
    }

    // Click en items del menú - detección directa
    if (showWidgetMenu) {
      // Verificar si está dentro del área general del menú
      const inMenuArea = x > 3 && x < 35 && y > 50 && y < 92;
      console.log('   ¿En área del menú?', inMenuArea);
      
      if (inMenuArea) {
        // Calcular directamente qué widget fue clickeado
        const menuStartX = 8;
        const menuStartY = 55;
        const menuWidth = 22;
        const menuHeight = 32;
        
        const relX = ((x - menuStartX) / menuWidth) * 100;
        const relY = ((y - menuStartY) / menuHeight) * 100;
        
        console.log('   Posición relativa:', relX.toFixed(1), relY.toFixed(1));
        
        if (relX >= 0 && relX <= 100 && relY >= 0 && relY <= 100) {
          const col = relX < 50 ? 0 : 1;
          const row = Math.floor(relY / 33.33);
          const index = row * 2 + col;
          
          console.log('   Grid pos - col:', col, 'row:', row, 'index:', index);
          
          if (index >= 0 && index < availableWidgets.length) {
            const clickedWidget = availableWidgets[index].id;
            console.log('✅ Click directo en widget:', clickedWidget);
            toggleWidget(clickedWidget);
            return;
          }
        }
      }
    }
    
    console.log('❌ Click no procesado');
  };

  const checkWidgetGrab = (x, y) => {
    const threshold = 18; // Hitbox más grande
    
    // No agarrar el botón del menú, eso es para clicks
    if (x > 3 && x < 18 && y > 80 && y < 98) {
      return;
    }
    
    // Usar widgetsRef para tener las posiciones actualizadas en tiempo real
    const currentWidgets = widgetsRef.current;
    for (let [name, widget] of Object.entries(currentWidgets)) {
      if (!widget.visible) continue;
      const dx = Math.abs(widget.x - x);
      const dy = Math.abs(widget.y - y);
      console.log(`Verificando ${name}: pos widget=(${widget.x.toFixed(1)}, ${widget.y.toFixed(1)}), mano=(${x.toFixed(1)}, ${y.toFixed(1)}), dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}`);
      if (dx < threshold && dy < threshold) {
        console.log(`✅ Widget ${name} agarrado!`);
        setGrabbedWidget(name);
        grabbedWidgetRef.current = name;
        setWidgets(prev => ({
          ...prev,
          [name]: { ...prev[name], isDragging: true }
        }));
        return;
      }
    }
    console.log('❌ No se encontró widget para agarrar');
  };

  const moveWidget = (name, x, y) => {
    console.log(`Moviendo ${name} a x:${x.toFixed(1)} y:${y.toFixed(1)}`);
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
    grabbedWidgetRef.current = null;
    setIsGrabbing(false);
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

  const toggleWidget = (widgetId) => {
    setWidgets(prev => {
      const widget = prev[widgetId];
      if (widget) {
        return {
          ...prev,
          [widgetId]: { ...widget, visible: !widget.visible }
        };
      } else {
        return {
          ...prev,
          [widgetId]: {
            id: widgetId,
            x: 50,
            y: 50,
            isDragging: false,
            visible: true
          }
        };
      }
    });
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
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="hidden"
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
      {widgets.time?.visible && (
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
      )}

      {/* Widget de Clima */}
      {widgets.weather?.visible && (
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
      )}

      {/* Widget de Estado */}
      {widgets.status?.visible && (
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
      )}

      {/* Widget de Calendario */}
      {widgets.calendar?.visible && (
        <div 
          className={`absolute ${
            widgets.calendar.isDragging 
              ? 'scale-125 shadow-2xl -rotate-1' 
              : hoveredWidget === 'calendar' 
              ? 'scale-105 shadow-lg' 
              : ''
          }`}
          style={{ 
            left: `${widgets.calendar.x}%`, 
            top: `${widgets.calendar.y}%`,
            transform: 'translate(-50%, -50%)',
            filter: hoveredWidget === 'calendar' ? 'brightness(1.2)' : 'brightness(1)',
            transition: widgets.calendar.isDragging ? 'none' : 'all 0.2s'
          }}
        >
          <div 
            className={`backdrop-blur-md bg-white/10 rounded-3xl p-6 border cursor-move transition-all ${
              hoveredWidget === 'calendar' ? 'border-blue-400' : 'border-white/20'
            } ${widgets.calendar.isDragging ? 'opacity-80' : ''}`}
            onMouseDown={(e) => handleWidgetMouseDown(e, 'calendar')}
          >
            <div className="text-white space-y-2">
              <div className="text-4xl font-bold text-purple-300">{time.getDate()}</div>
              <div className="text-sm opacity-70">
                {time.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
              </div>
              <div className="text-xs opacity-50 mt-3">📌 3 eventos hoy</div>
            </div>
          </div>
          {hoveredWidget === 'calendar' && !widgets.calendar.isDragging && (
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-400 animate-pulse pointer-events-none" />
          )}
        </div>
      )}

      {/* Widget de Noticias */}
      {widgets.news?.visible && (
        <div 
          className={`absolute ${
            widgets.news.isDragging 
              ? 'scale-125 shadow-2xl rotate-1' 
              : hoveredWidget === 'news' 
              ? 'scale-105 shadow-lg' 
              : ''
          }`}
          style={{ 
            left: `${widgets.news.x}%`, 
            top: `${widgets.news.y}%`,
            transform: 'translate(-50%, -50%)',
            filter: hoveredWidget === 'news' ? 'brightness(1.2)' : 'brightness(1)',
            transition: widgets.news.isDragging ? 'none' : 'all 0.2s'
          }}
        >
          <div 
            className={`backdrop-blur-md bg-white/10 rounded-3xl p-6 border cursor-move transition-all max-w-sm ${
              hoveredWidget === 'news' ? 'border-blue-400' : 'border-white/20'
            } ${widgets.news.isDragging ? 'opacity-80' : ''}`}
            onMouseDown={(e) => handleWidgetMouseDown(e, 'news')}
          >
            <div className="text-white space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl">📰</div>
                <div className="text-lg font-light">Noticias</div>
              </div>
              <div className="text-sm opacity-80 border-l-2 border-red-400 pl-3">
                "Nuevos avances en tecnología de IA..."
              </div>
              <div className="text-xs opacity-50">Hace 2 horas</div>
            </div>
          </div>
          {hoveredWidget === 'news' && !widgets.news.isDragging && (
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-400 animate-pulse pointer-events-none" />
          )}
        </div>
      )}

      {/* Widget de Música */}
      {widgets.music?.visible && (
        <div 
          className={`absolute ${
            widgets.music.isDragging 
              ? 'scale-125 shadow-2xl -rotate-2' 
              : hoveredWidget === 'music' 
              ? 'scale-105 shadow-lg' 
              : ''
          }`}
          style={{ 
            left: `${widgets.music.x}%`, 
            top: `${widgets.music.y}%`,
            transform: 'translate(-50%, -50%)',
            filter: hoveredWidget === 'music' ? 'brightness(1.2)' : 'brightness(1)',
            transition: widgets.music.isDragging ? 'none' : 'all 0.2s'
          }}
        >
          <div 
            className={`backdrop-blur-md bg-white/10 rounded-3xl p-6 border cursor-move transition-all ${
              hoveredWidget === 'music' ? 'border-blue-400' : 'border-white/20'
            } ${widgets.music.isDragging ? 'opacity-80' : ''}`}
            onMouseDown={(e) => handleWidgetMouseDown(e, 'music')}
          >
            <div className="text-white space-y-3">
              <div className="text-3xl">🎵</div>
              <div className="text-lg font-light">Reproduciendo...</div>
              <div className="text-sm opacity-70">"Chill Vibes Mix"</div>
              <div className="flex gap-3 mt-4">
                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">⏮</button>
                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">⏸</button>
                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">⏭</button>
              </div>
            </div>
          </div>
          {hoveredWidget === 'music' && !widgets.music.isDragging && (
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-400 animate-pulse pointer-events-none" />
          )}
        </div>
      )}

      {/* Botón de menú de widgets */}
      <div 
        className="absolute bottom-8 left-8 cursor-pointer"
        onClick={() => setShowWidgetMenu(!showWidgetMenu)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          className={`backdrop-blur-md bg-white/10 rounded-full p-4 border transition-all ${
            menuHovered ? 'border-blue-400 scale-110' : 'border-white/20'
          } ${showWidgetMenu ? 'bg-blue-500/30' : ''}`}
          style={{
            boxShadow: menuHovered ? '0 0 30px rgba(59, 130, 246, 0.5)' : 'none'
          }}
        >
          <div className="text-3xl">⚙️</div>
        </div>
      </div>

      {/* Menú de gestión de widgets */}
      {showWidgetMenu && (
        <div className="absolute bottom-24 left-8 backdrop-blur-md bg-white/10 rounded-3xl p-6 border border-white/20 max-w-sm">
          <h3 className="text-white text-xl font-light mb-4">Widgets Disponibles</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableWidgets.map((widget) => {
              const isActive = widgets[widget.id]?.visible;
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${widget.color} rounded-2xl p-4 transition-all transform hover:scale-105 ${
                    isActive ? 'opacity-100 ring-2 ring-white' : 'opacity-50'
                  } ${hoveredMenuItem === widget.id ? 'scale-110 ring-4 ring-blue-400' : ''}`}
                >
                  <div className="text-3xl mb-2">{widget.icon}</div>
                  <div className="text-white text-sm font-light">{widget.name}</div>
                  {isActive && (
                    <div className="text-white text-xs mt-1">✓ Activo</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-white/60 text-xs text-center">
            🤏 Junta y separa dedos sobre un widget para activarlo
          </div>
        </div>
      )}

      {/* Indicador de estado */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="backdrop-blur-md bg-white/10 rounded-full px-6 py-3 border border-white/20">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              cameraActive ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`} />
            <span className="text-white text-sm">
              {handDetected ? (
                isGrabbing ? (grabbedWidgetRef.current ? '✊ Moviendo widget' : '👆 Click!') : hoveredWidget ? '🫳 Mantén para mover' : hoveredMenuItem ? '🤏 Suelta para clickear' : '✋ Mano detectada'
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
            <li>🤏 Junta y suelta dedos = Click</li>
            <li>✊ Mantén dedos juntos = Arrastrar</li>
            <li>⚙️ Clickea el menú para gestionar</li>
            <li>🖱️ O usa el mouse para probar</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SmartMirror;