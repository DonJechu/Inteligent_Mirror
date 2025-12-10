import React from 'react';
import { Wifi, Battery, Sun, X, Settings, Music as MusicIcon, CloudRain, Wind } from 'lucide-react';
// Importamos la lógica restaurada
import useSmartMirrorLogic from './useSmartMirrorLogic';

const SmartMirror = () => {
  // Extraemos los estados y funciones de TU lógica original
  const {
    time, weather, cameraActive, handDetected, widgets,
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings,
    videoRef, handleWidgetMouseDown, toggleWidget, setWidgets
  } = useSmartMirrorLogic();

  // Configuración solo VISUAL (Iconos, Nombres, Descripciones)
  const availableWidgets = [
    { id: 'time', name: 'Reloj Maestro', icon: '🕐', description: 'Sincronización' },
    { id: 'weather', name: 'Atmósfera', icon: '☀️', description: 'Sensores' },
    { id: 'status', name: 'Sistemas', icon: '📶', description: 'Diagnóstico' },
    { id: 'news', name: 'Feed Global', icon: '📰', description: 'Noticias' },
    { id: 'music', name: 'Audio', icon: '🎵', description: 'Media' },
  ];

  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const getGlow = (color = 'cyan') => ({ boxShadow: `0 0 30px rgba(${color === 'cyan' ? '6, 182, 212' : '236, 72, 153'}, 0.3)` });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-cyan-100 selection:bg-cyan-500/30">
      {/* Elemento de video oculto requerido por MediaPipe */}
      <video ref={videoRef} autoPlay playsInline className="hidden" />

      {/* --- FONDO FUTURISTA (Visual) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-black to-black animate-pulse" style={{animationDuration: '4s'}} />
        <div className="w-full h-full opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* --- CURSOR DE MANO (Usando tu lógica de posición) --- */}
      {handDetected && (
        <div 
          className="absolute w-6 h-6 rounded-full pointer-events-none z-50"
          style={{ 
            left: `${handPosition.x}%`, 
            top: `${handPosition.y}%`,
            transform: `translate(-50%, -50%) scale(${isGrabbing ? 0.8 : 1})`,
            backgroundColor: isGrabbing ? '#ec4899' : '#06b6d4', // Rosa al agarrar, Cyan normal
            boxShadow: `0 0 40px ${isGrabbing ? '#ec4899' : '#06b6d4'}, 0 0 10px white`,
            border: '2px solid white',
            transition: 'background-color 0.1s' // Transición rápida solo color
          }}
        />
      )}

      {/* --- WIDGETS (Con diseño x1000) --- */}

      {/* 1. RELOJ */}
      {widgets.time?.visible && (
        <div 
          className={`absolute transition-transform duration-100 ${widgets.time.isDragging ? 'z-50 cursor-grabbing' : 'z-10 cursor-grab'}`}
          style={{ left: `${widgets.time.x}%`, top: `${widgets.time.y}%`, transform: `translate(-50%, -50%) scale(${widgets.time.scale})` }}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'time')}
        >
          <div className={`text-center p-8 rounded-full transition-all duration-300 ${hoveredWidget === 'time' ? 'bg-cyan-900/10 backdrop-blur-sm' : ''}`}
               style={hoveredWidget === 'time' ? getGlow() : {}}>
            <div className="text-8xl font-thin tracking-tighter text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
              {formatTime(time)}
            </div>
            <div className="text-xl text-cyan-400 font-light tracking-[0.5em] uppercase mt-2 border-t border-cyan-500/30 pt-2">
               {formatDate(time)}
            </div>
          </div>
        </div>
      )}

      {/* 2. CLIMA */}
      {widgets.weather?.visible && (
        <div 
          className={`absolute transition-transform duration-100 ${widgets.weather.isDragging ? 'z-50' : 'z-10'}`}
          style={{ left: `${widgets.weather.x}%`, top: `${widgets.weather.y}%`, transform: `translate(-50%, -50%) scale(${widgets.weather.scale})` }}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'weather')}
        >
          <div className={`backdrop-blur-xl bg-black/40 rounded-3xl p-6 border border-cyan-500/20 shadow-2xl transition-all duration-300 ${hoveredWidget === 'weather' ? 'border-cyan-400/60' : ''}`}
               style={hoveredWidget === 'weather' ? getGlow() : {}}>
            <div className="flex items-center gap-6">
              <Sun className="w-16 h-16 text-yellow-400 animate-[spin_10s_linear_infinite]" />
              <div>
                <div className="text-6xl font-light text-white">{Math.round(weather.temp)}°</div>
                <div className="text-cyan-400 text-sm tracking-widest uppercase">{weather.condition}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ESTADO */}
      {widgets.status?.visible && (
        <div 
          className={`absolute ${widgets.status.isDragging ? 'z-50' : 'z-10'}`}
          style={{ left: `${widgets.status.x}%`, top: `${widgets.status.y}%`, transform: `translate(-50%, -50%) scale(${widgets.status.scale})` }}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'status')}
        >
          <div className="flex gap-3">
            <div className={`p-3 rounded-xl bg-black/40 border border-cyan-500/30 backdrop-blur-md transition-all ${hoveredWidget === 'status' ? 'border-cyan-400 bg-cyan-900/20' : ''}`}>
               <Wifi className="w-6 h-6 text-cyan-400" />
            </div>
            <div className={`p-3 rounded-xl bg-black/40 border border-cyan-500/30 backdrop-blur-md transition-all ${hoveredWidget === 'status' ? 'border-cyan-400 bg-cyan-900/20' : ''}`}>
               <Battery className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* 4. NOTICIAS */}
      {widgets.news?.visible && (
        <div 
          className={`absolute max-w-md w-full ${widgets.news.isDragging ? 'z-50' : 'z-10'}`}
          style={{ left: `${widgets.news.x}%`, top: `${widgets.news.y}%`, transform: `translate(-50%, -50%) scale(${widgets.news.scale})` }}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'news')}
        >
          <div className={`backdrop-blur-xl bg-gradient-to-r from-black/60 to-transparent border-l-4 border-cyan-500 p-4 transition-all duration-500 ${hoveredWidget === 'news' ? 'border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : ''}`}>
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">EN VIVO</div>
                <div className="text-cyan-500/50 text-xs">GLOBAL NEWS</div>
             </div>
             <div className="text-xl text-white font-light leading-tight">"SpaceX aterriza en Marte con éxito..."</div>
          </div>
        </div>
      )}

      {/* 5. MUSICA */}
      {widgets.music?.visible && (
        <div 
          className={`absolute w-80 ${widgets.music.isDragging ? 'z-50' : 'z-10'}`}
          style={{ left: `${widgets.music.x}%`, top: `${widgets.music.y}%`, transform: `translate(-50%, -50%) scale(${widgets.music.scale})` }}
          onMouseDown={(e) => handleWidgetMouseDown(e, 'music')}
        >
          <div className={`backdrop-blur-xl bg-black/50 rounded-2xl p-5 border border-cyan-500/20 relative ${hoveredWidget === 'music' ? 'border-cyan-400/50' : ''}`}
               style={hoveredWidget === 'music' ? getGlow('pink') : {}}>
             <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg bg-cyan-900/50 flex items-center justify-center border border-cyan-500/30">
                    <MusicIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <div className="text-xs text-cyan-500 uppercase tracking-widest mb-1">Reproduciendo</div>
                    <div className="text-white font-medium">Cyberpunk 2077</div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- PANEL DE CONFIGURACIÓN (HUD) --- */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
           <div className="bg-black/80 border border-cyan-500/40 w-4/5 max-w-4xl p-8 shadow-[0_0_100px_rgba(6,182,212,0.2)]" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-end mb-8 border-b border-cyan-900 pb-4">
                   <h2 className="text-4xl text-white font-thin tracking-[0.2em]">SISTEMA</h2>
                   <button onClick={() => setShowSettings(false)}><X className="text-cyan-500" /></button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   {availableWidgets.map(widget => (
                       <div key={widget.id} onClick={() => toggleWidget(widget.id)}
                            className={`p-4 border cursor-pointer transition-all ${widgets[widget.id]?.visible ? 'bg-cyan-900/20 border-cyan-400' : 'border-gray-800'}`}>
                           <div className="text-3xl mb-2">{widget.icon}</div>
                           <div className="text-cyan-300 font-bold">{widget.name}</div>
                           {widgets[widget.id]?.visible && <div className="text-xs text-cyan-500 mt-2">ACTIVO</div>}
                       </div>
                   ))}
               </div>
           </div>
        </div>
      )}

      {/* BOTÓN CONFIGURACIÓN */}
      <button onClick={() => setShowSettings(true)} className="absolute top-8 right-8 p-3 rounded-full border border-cyan-900 bg-black/50 text-cyan-700 hover:text-cyan-400 z-40">
         <Settings size={24} />
      </button>

      {/* BARRA DE ESTADO INFERIOR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
         <div className="backdrop-blur-md bg-black/30 border border-cyan-900/50 rounded-full px-8 py-2 flex items-center gap-4 text-xs font-mono text-cyan-500/80 shadow-lg">
             <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-900'}`} />
             <span>{handDetected ? (isGrabbing ? 'MOVIENDO WIDGET' : (hoveredWidget ? 'WIDGET DETECTADO' : 'MANO DETECTADA')) : 'ESPERANDO...'}</span>
         </div>
      </div>
    </div>
  );
};

export default SmartMirror;