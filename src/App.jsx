import React from 'react';
import { Wifi, Battery, Sun, X, Settings, Music as MusicIcon, EyeOff, Loader2, Moon, Plus, Minus, RotateCcw, Power, Check, Palette, Maximize, Calendar, Mail, Clock } from 'lucide-react';
import useSmartMirrorLogic, { WIDGET_REGISTRY, PRESETS } from './useSmartMirrorLogic';

// ==========================================
// 🧩 SISTEMA DE COMPONENTES WIDGET
// ==========================================
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
  ),
  notifications: ({ data, theme }) => (
    <div className="flex flex-col gap-2 w-80 transition-all duration-500">
        <div className={`flex items-center justify-between border-b ${theme.border} pb-1 mb-2 bg-black/40 px-2 rounded`}>
            <span className={`${theme.textAccent} text-[10px] tracking-widest uppercase`}>Incoming Transmission</span>
            <div className={`w-2 h-2 rounded-full ${theme.bgActive} animate-ping`} />
        </div>
        {(!data.items || data.items.length === 0) && (
            <div className={`text-center py-4 ${theme.textDim} text-xs italic opacity-50`}>
                Sin nuevas transmisiones...
            </div>
        )}
        {data.items && data.items.map((notif, index) => (
            <div key={notif.id || index} className={`backdrop-blur-md bg-black/80 border-l-4 ${theme.borderColor} p-3 relative overflow-hidden animate-in slide-in-from-right duration-500 shadow-lg`} style={{animationDelay: `${index * 100}ms`}}>
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{notif.app}</span>
                    <span className={`${theme.textDim} text-[9px] font-mono`}>{notif.time}</span>
                </div>
                <div className="text-sm text-gray-100 font-light leading-snug">{notif.message}</div>
                <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${theme.border} opacity-50`} />
            </div>
        ))}
    </div>
  ),
  calendar: ({ data, theme }) => (
    <div className={`backdrop-blur-xl bg-black/40 rounded-xl p-4 border ${theme.border} w-72 group transition-all duration-300 hover:scale-105 hover:border-${theme.borderColor}`}>
        <div className={`flex items-center gap-2 mb-3 border-b ${theme.border} pb-2`}>
            <Calendar size={16} className={theme.textAccent} />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Agenda Hoy</span>
        </div>
        <div className="space-y-3">
            {data.events?.slice(0,3).map((evt, i) => (
                <div key={i} className="flex gap-3 items-center">
                    <div className={`w-1 h-8 rounded-full ${evt.type === 'urgent' ? 'bg-red-500' : evt.type === 'personal' ? 'bg-green-400' : theme.bgActive}`}></div>
                    <div>
                        <div className="text-sm font-medium text-white line-clamp-1">{evt.title}</div>
                        <div className={`text-[10px] ${theme.textDim} flex items-center gap-1`}>
                            <Clock size={10} /> {evt.time}
                        </div>
                    </div>
                </div>
            ))}
            {(!data.events || data.events.length === 0) && <div className="text-xs text-gray-500 italic">Sin eventos próximos</div>}
        </div>
        <div className={`mt-2 text-[9px] ${theme.textAccent} text-center opacity-0 group-hover:opacity-100 transition-opacity animate-pulse`}>
            PELLIZCA PARA ABRIR
        </div>
    </div>
  ),
  mail: ({ data, theme }) => (
    <div className={`backdrop-blur-xl bg-black/40 rounded-xl p-4 border ${theme.border} w-72`}>
        <div className={`flex items-center justify-between mb-3 border-b ${theme.border} pb-2`}>
            <div className="flex items-center gap-2">
                <Mail size={16} className={theme.textAccent} />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Priority Inbox</span>
            </div>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded">{data.emails?.length || 0}</span>
        </div>
        <div className="space-y-3">
            {data.emails?.map((mail, i) => (
                <div key={i} className="group cursor-pointer">
                    <div className="flex justify-between items-end">
                        <span className={`text-xs font-bold ${theme.textAccent}`}>{mail.from}</span>
                        <span className={`text-[9px] ${theme.textDim}`}>{mail.time}</span>
                    </div>
                    <div className="text-sm text-gray-300 truncate">{mail.subject}</div>
                </div>
            ))}
        </div>
    </div>
  )
};

// 👇 COMPONENTE: PANTALLA DE AGENDA GIGANTE (Con Ref para Scroll)
const FullAgendaView = ({ calendarData, theme, scrollRef }) => (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-20 animate-in fade-in zoom-in duration-500 bg-black/95 backdrop-blur-xl">
        <div className="w-full h-full max-w-5xl flex flex-col">
            <div className={`flex items-end justify-between border-b-2 ${theme.borderColor} pb-6 mb-10`}>
                <div>
                    <h1 className="text-6xl font-thin tracking-tighter text-white">AGENDA</h1>
                    <p className={`text-xl ${theme.textAccent} tracking-[0.5em] uppercase mt-2`}>VISTA DETALLADA</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono text-white">{new Date().toLocaleDateString('es-MX', {weekday:'long'})}</div>
                    <div className={`text-xl ${theme.textDim}`}>{new Date().toLocaleDateString('es-MX', {day:'numeric', month:'long'})}</div>
                </div>
            </div>

            {/* 👇 AQUÍ ESTÁ EL CAMBIO CRÍTICO: ref={scrollRef} */}
            <div ref={scrollRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto content-start pb-20 no-scrollbar">
                {calendarData.events?.length > 0 ? calendarData.events.map((evt, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${theme.border} bg-white/5 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors group`}>
                        <div>
                            <div className={`text-xs font-bold px-2 py-1 rounded w-max mb-3 ${evt.type === 'personal' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                {evt.type || 'REUNIÓN'}
                            </div>
                            <h3 className="text-3xl font-light text-white mb-2 leading-tight group-hover:text-cyan-300 transition-colors">{evt.title}</h3>
                        </div>
                        <div className={`text-2xl font-mono ${theme.textAccent} flex items-center gap-3`}>
                            <Clock size={24} /> {evt.time}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-2 flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                        <Calendar size={64} />
                        <div className="text-2xl italic">No hay misiones programadas.</div>
                    </div>
                )}
            </div>

            <div className={`mt-10 pt-6 border-t ${theme.border} flex justify-between items-center text-xs ${theme.textDim}`}>
                <span className="animate-pulse">PELLIZCA (CLICK) Y ARRASTRA PARA SCROLL • SUELTA RÁPIDO PARA SALIR</span>
                <span>MIRRORLINK SYNC ACTIVE</span>
            </div>
        </div>
    </div>
);

const SmartMirror = () => {
  const {
    time, weather, cameraActive, handDetected, faceDetected, isStandby, bootPhase, widgets, 
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, config, updateConfig, isDayTime, applyPreset,
    focusMode, interactionProgress, interactionType, focusTime, sessionComplete,
    viewMode,
    agendaScrollRef // <--- IMPORTANTE: Recibimos la Ref del scroll
  } = useSmartMirrorLogic();

  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatFocusTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const THEME_PALETTES = {
    stark: { day: { textAccent: 'text-cyan-400', border: 'border-cyan-500/30', borderColor: 'border-cyan-500', bgActive: 'bg-cyan-900/20', cursor: '#06b6d4', cursorGrab: '#ec4899', scanLine: 'bg-cyan-500/20', textDim: 'text-cyan-600/60', glow: '0 0 30px rgba(6, 182, 212, 0.3)' }, night: { textAccent: 'text-amber-500', border: 'border-amber-600/30', borderColor: 'border-amber-600', bgActive: 'bg-amber-900/20', cursor: '#f59e0b', cursorGrab: '#ef4444', scanLine: 'bg-amber-500/10', textDim: 'text-amber-700/60', glow: '0 0 30px rgba(245, 158, 11, 0.2)' } },
    tron: { day: { textAccent: 'text-blue-400', border: 'border-blue-500', borderColor: 'border-blue-500', bgActive: 'bg-blue-900/40', cursor: '#3b82f6', cursorGrab: '#ffffff', scanLine: 'bg-blue-500/50', textDim: 'text-blue-400/60', glow: '0 0 20px rgba(59, 130, 246, 0.5)' }, night: { textAccent: 'text-purple-400', border: 'border-purple-500', borderColor: 'border-purple-500', bgActive: 'bg-purple-900/40', cursor: '#a855f7', cursorGrab: '#ffffff', scanLine: 'bg-purple-500/50', textDim: 'text-purple-400/60', glow: '0 0 20px rgba(168, 85, 247, 0.5)' } },
    zen: { day: { textAccent: 'text-white', border: 'border-white/10', borderColor: 'border-white', bgActive: 'bg-white/10', cursor: '#ffffff', cursorGrab: '#cccccc', scanLine: 'bg-transparent', textDim: 'text-gray-400', glow: 'none' }, night: { textAccent: 'text-gray-400', border: 'border-white/5', borderColor: 'border-gray-500', bgActive: 'bg-white/5', cursor: '#666666', cursorGrab: '#999999', scanLine: 'bg-transparent', textDim: 'text-gray-600', glow: 'none' } }
  };

  const currentPalette = THEME_PALETTES[config.theme] || THEME_PALETTES.stark;
  const theme = isDayTime ? currentPalette.day : currentPalette.night;

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

      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isDayTime ? 'from-gray-800' : 'from-black'} via-black to-black`} />
        {!focusMode && <div className={`w-full h-full opacity-10 ${config.theme === 'stark' ? '' : 'hidden'}`} style={{backgroundImage: `linear-gradient(${theme.borderColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.borderColor} 1px, transparent 1px)`, backgroundSize: '40px 40px'}} />}
      </div>

      <div className={`absolute top-0 left-0 p-4 transition-opacity duration-300 ${interactionType === 'reload' ? 'opacity-100' : 'opacity-0'}`}><RotateCcw className="text-red-500 w-10 h-10 animate-spin" /></div>
      <div className={`absolute bottom-0 right-0 p-4 transition-opacity duration-300 ${interactionType === 'standby' ? 'opacity-100' : 'opacity-0'}`}><Power className="text-red-500 w-10 h-10 animate-pulse" /></div>

      {handDetected && (
        <div className="absolute pointer-events-none z-50 flex items-center justify-center" 
             style={{ left: `${handPosition.x}%`, top: `${handPosition.y}%`, transition: 'transform 0.1s', transform: `translate(-50%, -50%) scale(${isGrabbing ? 0.8 : 1})` }}>
          {interactionProgress > 0 && (
             <svg className="absolute w-20 h-20 -rotate-90" viewBox="0 0 36 36">
               <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
               <path className={interactionType === 'focus' || interactionType === 'agenda' ? 'text-green-400' : 'text-red-500'} strokeDasharray={`${interactionProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
             </svg>
          )}
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: isGrabbing ? theme.cursorGrab : theme.cursor, boxShadow: `0 0 20px ${theme.cursor}`, border: '2px solid white' }} />
        </div>
      )}

      {/* VISTAS DEL SISTEMA */}
      <div className={`absolute inset-0 transition-all duration-500 ${viewMode === 'dashboard' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
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

          {!focusMode && Object.entries(widgets).map(([key, widget]) => {
              if (!widget.visible) return null;
              const Component = WIDGET_COMPONENTS[key];
              if (!Component) return null;

              return (
                <div key={key} 
                     className={`absolute transition-all cubic-bezier(0.34, 1.56, 0.64, 1) ${widget.isDragging ? 'duration-0 z-50 cursor-grabbing' : 'duration-1000 z-10 cursor-grab'}`}
                     style={{ left: `${widget.x}%`, top: `${widget.y}%`, transform: `translate(-50%, -50%) scale(${widget.scale})` }}
                     onMouseDown={(e) => handleWidgetMouseDown(e, key)}>
                     <div className={`transition-all duration-300 ${hoveredWidget === key ? theme.bgActive : ''}`} style={hoveredWidget === key ? {boxShadow: theme.glow} : {}}>
                        <Component data={{...widget, time, temp: weather.temp, condition: weather.condition}} theme={theme} formatTime={formatTime} formatDate={formatDate} />
                     </div>
                </div>
              );
          })}
      </div>

      {viewMode === 'agenda' && (
          <FullAgendaView 
              calendarData={widgets.calendar || { events: [] }} 
              theme={theme} 
              formatTime={formatTime} 
              scrollRef={agendaScrollRef} // <--- AQUÍ SE CONECTA EL CABLE
          />
      )}

      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center animate-in fade-in" onClick={() => setShowSettings(false)}>
           <div className={`bg-gray-900 border ${theme.border} w-11/12 max-w-6xl p-8 shadow-2xl h-5/6 overflow-y-auto rounded-xl`} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                   <h2 className="text-3xl font-light tracking-widest text-white">AJUSTES DEL SISTEMA</h2>
                   <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-8">
                       <div>
                           <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">TEMA VISUAL</h3>
                           <div className="grid grid-cols-3 gap-4">
                               {['stark', 'tron', 'zen'].map(t => (
                                   <button key={t} onClick={() => updateConfig('theme', t)} className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${config.theme === t ? `bg-white/10 border-${theme.borderColor}` : 'border-gray-800 hover:border-gray-600'}`}>
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
                           <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">PRESETS</h3>
                           <div className="grid grid-cols-3 gap-4">
                               <button onClick={() => applyPreset('default')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs">REINICIO</button>
                               <button onClick={() => applyPreset('morning')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs">☀️ MAÑANA</button>
                               <button onClick={() => applyPreset('zen')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs">🧘 ZEN</button>
                           </div>
                       </div>
                   </div>
                   <div className="space-y-8">
                        <div>
                            <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">WIDGETS</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(WIDGET_REGISTRY).map(w => (
                                    <div key={w.id} onClick={() => toggleWidget(w.id)} className={`p-3 rounded border flex items-center justify-between cursor-pointer ${widgets[w.id]?.visible ? `bg-${theme.borderColor}/20 border-${theme.borderColor}` : 'border-gray-800 opacity-50'}`}>
                                        <div className="flex items-center gap-3"><span>{w.icon}</span><span className="text-sm">{w.name}</span></div>
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

      <button onClick={() => setShowSettings(true)} className={`absolute top-8 right-8 p-3 rounded-full border border-white/20 bg-black/50 hover:bg-white/10 z-40 transition-all hover:rotate-90`}>
         <Settings size={24} className="text-white" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-md bg-black/40 border border-white/10 rounded-full px-6 py-2 flex items-center gap-6 text-[10px] uppercase tracking-widest text-white/50">
         <span className={faceDetected ? theme.textAccent : ''}>VISION: {faceDetected ? 'ON' : 'OFF'}</span>
         <span className="w-px h-3 bg-white/10" />
         <span className={handDetected ? theme.textAccent : ''}>HAND: {handDetected ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
};

export default SmartMirror; 