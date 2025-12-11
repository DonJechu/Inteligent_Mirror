import React from 'react';
import { Wifi, Battery, Sun, X, Settings, Music as MusicIcon, EyeOff, Loader2, Moon, Plus, Minus, RotateCcw, Power, Check, Palette, Maximize } from 'lucide-react';
import useSmartMirrorLogic, { WIDGET_REGISTRY, PRESETS } from './useSmartMirrorLogic';

// ==========================================
// 🧩 SISTEMA DE COMPONENTES WIDGET (FÁCIL PARA DEVS)
// ==========================================
// Para agregar un widget nuevo:
// 1. Agregalo a WIDGET_REGISTRY en el archivo de lógica.
// 2. Define su diseño visual aquí.
const WIDGET_COMPONENTS = {
  time: ({ data, theme, formatTime, formatDate }) => (
    <div className={`text-center p-8 rounded-full transition-all duration-300 ${data.isDragging ? theme.bgActive : ''}`}>
      <div className={`text-8xl font-thin tracking-tighter text-white drop-shadow-lg`}>{formatTime(data.time)}</div>
      <div className={`text-xl ${theme.textAccent} font-light tracking-[0.5em] uppercase mt-2 border-t ${theme.border} pt-2`}>{formatDate(data.time)}</div>
      <div className={`text-[10px] ${theme.textAccent} mt-2 opacity-50`}>PELLIZCA PARA FOCUS</div>
    </div>
  ),
  weather: ({ data, theme }) => (
    <div className={`backdrop-blur-xl bg-black/40 rounded-3xl p-6 border ${theme.border} shadow-2xl flex items-center gap-6`}>
      <Sun className={`w-16 h-16 ${theme.textAccent} animate-[spin_10s_linear_infinite]`} />
      <div>
        <div className="text-6xl font-light text-white">{Math.round(data.temp)}°</div>
        <div className={`${theme.textAccent} text-sm tracking-widest uppercase`}>{data.condition}</div>
      </div>
    </div>
  ),
  status: ({ theme }) => (
    <div className="flex gap-3">
      <div className={`p-3 rounded-xl bg-black/40 border ${theme.border} backdrop-blur-md`}><Wifi className={`w-6 h-6 ${theme.textAccent}`} /></div>
      <div className={`p-3 rounded-xl bg-black/40 border ${theme.border} backdrop-blur-md`}><Battery className="w-6 h-6 text-green-400" /></div>
    </div>
  ),
  news: ({ theme }) => (
    <div className={`backdrop-blur-xl bg-gradient-to-r from-black/60 to-transparent border-l-4 ${theme.borderColor} p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">EN VIVO</div>
        <div className={`${theme.textDim} text-xs`}>GLOBAL NEWS</div>
      </div>
      <div className="text-xl text-white font-light leading-tight">"Sistema optimizado para desarrolladores..."</div>
    </div>
  ),
  music: ({ theme }) => (
    <div className={`backdrop-blur-xl bg-black/50 rounded-2xl p-5 border ${theme.border} relative flex gap-4 items-center`}>
      <div className={`w-16 h-16 rounded-lg bg-black/50 flex items-center justify-center border ${theme.border}`}>
        <MusicIcon className={`w-8 h-8 ${theme.textAccent} animate-pulse`} />
      </div>
      <div>
        <div className={`${theme.textAccent} text-xs uppercase tracking-widest mb-1`}>Reproduciendo</div>
        <div className="text-white font-medium">Neural Flow</div>
      </div>
    </div>
  )
};

const SmartMirror = () => {
  const {
    time, weather, cameraActive, handDetected, faceDetected, isStandby, bootPhase, widgets, 
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, config, updateConfig, isDayTime, applyPreset,
    focusMode, interactionProgress, interactionType, focusTime, sessionComplete
  } = useSmartMirrorLogic();

  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatFocusTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // 🎨 MOTOR DE TEMAS
  const THEME_PALETTES = {
    stark: { // IRON MAN
      day: { textAccent: 'text-cyan-400', border: 'border-cyan-500/30', borderColor: 'border-cyan-500', bgActive: 'bg-cyan-900/20', cursor: '#06b6d4', cursorGrab: '#ec4899', scanLine: 'bg-cyan-500/20', textDim: 'text-cyan-600/60', glow: '0 0 30px rgba(6, 182, 212, 0.3)' },
      night: { textAccent: 'text-amber-500', border: 'border-amber-600/30', borderColor: 'border-amber-600', bgActive: 'bg-amber-900/20', cursor: '#f59e0b', cursorGrab: '#ef4444', scanLine: 'bg-amber-500/10', textDim: 'text-amber-700/60', glow: '0 0 30px rgba(245, 158, 11, 0.2)' }
    },
    tron: { // RETRO NEON
      day: { textAccent: 'text-blue-400', border: 'border-blue-500', borderColor: 'border-blue-500', bgActive: 'bg-blue-900/40', cursor: '#3b82f6', cursorGrab: '#ffffff', scanLine: 'bg-blue-500/50', textDim: 'text-blue-400/60', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
      night: { textAccent: 'text-purple-400', border: 'border-purple-500', borderColor: 'border-purple-500', bgActive: 'bg-purple-900/40', cursor: '#a855f7', cursorGrab: '#ffffff', scanLine: 'bg-purple-500/50', textDim: 'text-purple-400/60', glow: '0 0 20px rgba(168, 85, 247, 0.5)' }
    },
    zen: { // MINIMALISTA
      day: { textAccent: 'text-white', border: 'border-white/10', borderColor: 'border-white', bgActive: 'bg-white/10', cursor: '#ffffff', cursorGrab: '#cccccc', scanLine: 'bg-transparent', textDim: 'text-gray-400', glow: 'none' },
      night: { textAccent: 'text-gray-400', border: 'border-white/5', borderColor: 'border-gray-500', bgActive: 'bg-white/5', cursor: '#666666', cursorGrab: '#999999', scanLine: 'bg-transparent', textDim: 'text-gray-600', glow: 'none' }
    }
  };

  const currentPalette = THEME_PALETTES[config.theme] || THEME_PALETTES.stark;
  const theme = isDayTime ? currentPalette.day : currentPalette.night;

  // --- RENDERIZADORES ---
  if (isStandby && bootPhase === 'standby') return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-${isDayTime ? 'gray' : 'black'}-900/20 via-black to-black animate-pulse`} style={{animationDuration: '8s'}} />
      <div className="text-center z-10 opacity-30">
        <div className={`text-8xl font-thin ${theme.textAccent} animate-pulse tracking-widest`}>{formatTime(time)}</div>
        <div className={`flex items-center justify-center gap-2 mt-8 ${theme.textDim} text-xs tracking-[0.5em] uppercase`}>
           {isDayTime ? <EyeOff size={14} /> : <Moon size={14} />} <span>Standby</span>
        </div>
      </div>
    </div>
  );

  if (bootPhase === 'booting') return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center relative font-mono text-white">
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <div className="z-20 text-center space-y-6">
        <div className={`w-24 h-24 border-4 ${theme.border} rounded-full animate-spin flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
           <Loader2 className={`w-10 h-10 ${theme.textAccent} animate-pulse`} />
        </div>
        <div className={`${theme.textAccent} text-2xl font-light tracking-[0.3em] animate-pulse`}>REINICIANDO SISTEMA</div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-white selection:bg-white/20" 
         style={{ opacity: config.opacity, transform: `scale(${config.scale})`, transformOrigin: 'center' }}>
      <video ref={videoRef} autoPlay playsInline className="hidden" />

      {/* Fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isDayTime ? 'from-gray-800' : 'from-black'} via-black to-black`} />
        {!focusMode && <div className={`w-full h-full opacity-10 ${config.theme === 'stark' ? '' : 'hidden'}`} style={{backgroundImage: `linear-gradient(${theme.borderColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.borderColor} 1px, transparent 1px)`, backgroundSize: '40px 40px'}} />}
      </div>

      {/* Hot Corners */}
      <div className={`absolute top-0 left-0 p-4 transition-opacity duration-300 ${interactionType === 'reload' ? 'opacity-100' : 'opacity-0'}`}><RotateCcw className="text-red-500 w-10 h-10 animate-spin" /></div>
      <div className={`absolute bottom-0 right-0 p-4 transition-opacity duration-300 ${interactionType === 'standby' ? 'opacity-100' : 'opacity-0'}`}><Power className="text-red-500 w-10 h-10 animate-pulse" /></div>

      {/* Cursor */}
      {handDetected && (
        <div className="absolute pointer-events-none z-50 flex items-center justify-center" 
             // 🔴 CORRECCIÓN: Quitamos transiciones lentas de left/top para movimiento instantáneo
             style={{ left: `${handPosition.x}%`, top: `${handPosition.y}%`, transition: 'transform 0.1s', transform: `translate(-50%, -50%) scale(${isGrabbing ? 0.8 : 1})` }}>
          {interactionProgress > 0 && (
             <svg className="absolute w-20 h-20 -rotate-90" viewBox="0 0 36 36">
               <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
               <path className={interactionType === 'focus' ? 'text-green-400' : 'text-red-500'} strokeDasharray={`${interactionProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
             </svg>
          )}
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: isGrabbing ? theme.cursorGrab : theme.cursor, boxShadow: `0 0 20px ${theme.cursor}`, border: '2px solid white' }} />
        </div>
      )}

      {/* Focus Mode */}
      {focusMode && (
          <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in">
              <div className={`w-96 h-96 border-4 ${sessionComplete ? 'border-green-500' : theme.border} rounded-full flex items-center justify-center relative`}>
                  <div className={`absolute inset-0 border-t-4 ${sessionComplete ? 'border-green-400' : theme.textAccent} rounded-full animate-spin`} style={{animationDuration: sessionComplete ? '1s' : '4s'}} />
                  <div className="text-center">
                      {sessionComplete ? (
                          <div className="animate-in fade-in zoom-in"><div className="text-green-500 text-6xl mb-2">✓</div><div className="text-2xl text-green-400 font-bold">COMPLETADO</div></div>
                      ) : (
                          <><div className={`text-2xl ${theme.textDim} tracking-widest uppercase mb-2`}>FOCUS</div><div className={`text-8xl ${theme.textAccent} font-thin tabular-nums`}>{formatFocusTime(focusTime)}</div></>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Widgets */}
      {!focusMode && Object.entries(widgets).map(([key, widget]) => {
          if (!widget.visible) return null;
          const Component = WIDGET_COMPONENTS[key];
          if (!Component) return null;

          return (
            <div key={key} 
                 // 🔴 CORRECCIÓN AQUI: Duración dinámica. Si arrastras = 0ms (instante). Si no = 1000ms (física suave)
                 className={`absolute transition-all cubic-bezier(0.34, 1.56, 0.64, 1) ${widget.isDragging ? 'duration-0 z-50 cursor-grabbing' : 'duration-1000 z-10 cursor-grab'}`}
                 style={{ left: `${widget.x}%`, top: `${widget.y}%`, transform: `translate(-50%, -50%) scale(${widget.scale})` }}
                 onMouseDown={(e) => handleWidgetMouseDown(e, key)}>
                 <div className={`transition-all duration-300 ${hoveredWidget === key ? theme.bgActive : ''}`} style={hoveredWidget === key ? {boxShadow: theme.glow} : {}}>
                    <Component data={{...widget, time, temp: weather.temp, condition: weather.condition}} theme={theme} formatTime={formatTime} formatDate={formatDate} />
                 </div>
            </div>
          );
      })}

      {/* Panel de Configuración */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center animate-in fade-in" onClick={() => setShowSettings(false)}>
           <div className={`bg-gray-900 border ${theme.border} w-11/12 max-w-6xl p-8 shadow-2xl h-5/6 overflow-y-auto rounded-xl`} onClick={e => e.stopPropagation()}>
               
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                   <h2 className="text-3xl font-light tracking-widest text-white">AJUSTES DEL SISTEMA</h2>
                   <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   
                   {/* APARIENCIA */}
                   <div className="space-y-8">
                       <div>
                           <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">TEMA VISUAL</h3>
                           <div className="grid grid-cols-3 gap-4">
                               {['stark', 'tron', 'zen'].map(t => (
                                   <button key={t} onClick={() => updateConfig('theme', t)}
                                           className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${config.theme === t ? `bg-white/10 border-${theme.borderColor}` : 'border-gray-800 hover:border-gray-600'}`}>
                                       <Palette size={24} className={config.theme === t ? theme.textAccent : 'text-gray-600'} />
                                       <span className="uppercase text-xs font-bold">{t}</span>
                                   </button>
                               ))}
                           </div>
                       </div>

                       <div>
                           <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">INTERFAZ GLOBAL</h3>
                           <div className="space-y-6">
                               <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3"><EyeOff size={18} /> <span className="text-sm">Opacidad</span></div>
                                   <input type="range" min="0.5" max="1" step="0.1" value={config.opacity} onChange={(e) => updateConfig('opacity', e.target.value)} className="w-40 accent-cyan-500" />
                               </div>
                               <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3"><Maximize size={18} /> <span className="text-sm">Escala UI</span></div>
                                   <input type="range" min="0.8" max="1.2" step="0.1" value={config.scale} onChange={(e) => updateConfig('scale', e.target.value)} className="w-40 accent-cyan-500" />
                               </div>
                           </div>
                       </div>

                       <div>
                           <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">PRESETS (MODOS)</h3>
                           <div className="grid grid-cols-3 gap-4">
                               <button onClick={() => applyPreset('default')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs">REINICIO</button>
                               <button onClick={() => applyPreset('morning')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs">☀️ MAÑANA</button>
                               <button onClick={() => applyPreset('zen')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs">🧘 ZEN</button>
                           </div>
                       </div>
                   </div>

                   {/* WIDGETS & HORARIO */}
                   <div className="space-y-8">
                        <div>
                            <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">GESTIÓN DE WIDGETS</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(WIDGET_REGISTRY).map(w => (
                                    <div key={w.id} onClick={() => toggleWidget(w.id)} 
                                         className={`p-3 rounded border flex items-center justify-between cursor-pointer ${widgets[w.id]?.visible ? `bg-${theme.borderColor}/20 border-${theme.borderColor}` : 'border-gray-800 opacity-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span>{w.icon}</span>
                                            <span className="text-sm">{w.name}</span>
                                        </div>
                                        {widgets[w.id]?.visible && <Check size={14} className={theme.textAccent} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">CICLO CIRCADIANO</h3>
                            <div className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center mb-2">
                                <span className="text-sm flex gap-2 items-center"><Sun size={14}/> Inicio Día</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateConfig('dayStart', config.dayStart - 1)}><Minus size={14}/></button>
                                    <span className="font-mono text-xl">{config.dayStart}:00</span>
                                    <button onClick={() => updateConfig('dayStart', config.dayStart + 1)}><Plus size={14}/></button>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-sm flex gap-2 items-center"><Moon size={14}/> Inicio Noche</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateConfig('nightStart', config.nightStart - 1)}><Minus size={14}/></button>
                                    <span className="font-mono text-xl">{config.nightStart}:00</span>
                                    <button onClick={() => updateConfig('nightStart', config.nightStart + 1)}><Plus size={14}/></button>
                                </div>
                            </div>
                        </div>
                   </div>
               </div>
           </div>
        </div>
      )}

      {/* Botón Flotante Settings */}
      <button onClick={() => setShowSettings(true)} className={`absolute top-8 right-8 p-3 rounded-full border border-white/20 bg-black/50 hover:bg-white/10 z-40 transition-all hover:rotate-90`}>
         <Settings size={24} className="text-white" />
      </button>

      {/* Barra Estado */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-md bg-black/40 border border-white/10 rounded-full px-6 py-2 flex items-center gap-6 text-[10px] uppercase tracking-widest text-white/50">
         <span className={faceDetected ? theme.textAccent : ''}>VISION: {faceDetected ? 'ON' : 'OFF'}</span>
         <span className="w-px h-3 bg-white/10" />
         <span className={handDetected ? theme.textAccent : ''}>HAND: {handDetected ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
};

export default SmartMirror;