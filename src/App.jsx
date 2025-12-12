import React from 'react';
import { Wifi, Battery, Sun, X, Settings, Music as MusicIcon, EyeOff, Loader2, Moon, Plus, Minus, RotateCcw, Power, Check, Palette, Maximize, Calendar, Mail, Clock, CloudRain, Disc, AlertTriangle } from 'lucide-react';
import useSmartMirrorLogic, { WIDGET_REGISTRY } from './useSmartMirrorLogic';

// ==========================================
// 🎨 DEFINICIÓN DE TEMAS
// ==========================================
const THEMES = {
  stark: {
    name: 'J.A.R.V.I.S.',
    font: 'font-mono',
    bg: 'bg-black',
    textMain: 'text-white',
    textAccent: 'text-cyan-400',
    border: 'border-cyan-500/50',
    panel: 'bg-cyan-950/20 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    cursor: '#06b6d4',
    shape: 'rounded-sm'
  },
  minimal: {
    name: 'Clean',
    font: 'font-sans',
    bg: 'bg-zinc-950',
    textMain: 'text-zinc-100',
    textAccent: 'text-white',
    border: 'border-white/10',
    panel: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl',
    cursor: '#ffffff',
    shape: 'rounded-[2rem]'
  },
  cyber: {
    name: 'Cyberpunk',
    font: 'font-mono italic',
    bg: 'bg-slate-900',
    textMain: 'text-pink-50',
    textAccent: 'text-pink-500',
    border: 'border-pink-500',
    panel: 'bg-slate-900/80 border-l-4 border-pink-500 shadow-[5px_5px_0px_rgba(0,0,0,0.5)]',
    cursor: '#ec4899',
    shape: 'rounded-none skew-x-[-5deg]'
  },
  zen: {
    name: 'Zen',
    font: 'font-serif',
    bg: 'bg-[#1c1917]',
    textMain: 'text-stone-200',
    textAccent: 'text-amber-200',
    border: 'border-amber-900/30',
    panel: 'bg-[#292524]/60 backdrop-blur-sm border border-amber-900/20 shadow-lg',
    cursor: '#fbbf24',
    shape: 'rounded-tl-[2rem] rounded-br-[2rem]'
  }
};

const WidgetContainer = ({ children, theme, className, ...props }) => (
  <div className={`${theme.panel} ${theme.shape} p-6 relative transition-all duration-300 ${className}`} {...props}>
    {children}
    {theme.name === 'J.A.R.V.I.S.' && (
      <>
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
      </>
    )}
  </div>
);

const WIDGET_COMPONENTS = {
  time: ({ data, theme, formatTime, formatDate }) => (
    <div className={`text-center transition-all duration-300 ${data.isDragging ? "opacity-50 scale-110" : ""}`}>
      <div className={`text-8xl font-light leading-none ${theme.textAccent} drop-shadow-lg`}>{formatTime(data.time)}</div>
      <div className={`text-xl mt-2 opacity-80 uppercase tracking-widest ${theme.font} ${theme.textMain}`}>{formatDate(data.time)}</div>
    </div>
  ),
  weather: ({ data, theme }) => (
    <WidgetContainer theme={theme} className="flex items-center gap-6 min-w-[280px]">
      <Sun className={`w-16 h-16 ${theme.textAccent} animate-spin-slow`} strokeWidth={1.5} />
      <div>
        <div className={`text-5xl font-light ${theme.textMain}`}>{Math.round(data.temp)}°</div>
        <div className={`text-xs opacity-60 uppercase tracking-wider ${theme.textMain}`}>{data.condition}</div>
      </div>
    </WidgetContainer>
  ),
  status: ({ theme }) => (
    <WidgetContainer theme={theme} className="px-4 py-2 flex gap-6">
      <div className="flex items-center gap-2"><Wifi size={18} className={theme.textAccent} /><span className={`text-xs ${theme.textMain}`}>ONLINE</span></div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2"><Battery size={18} className="text-green-400" /><span className={`text-xs ${theme.textMain}`}>100%</span></div>
    </WidgetContainer>
  ),
  search: ({ data, theme }) => (
    <div className={`${theme.panel} ${theme.shape} max-w-2xl mx-auto p-8 flex flex-col items-center text-center backdrop-blur-xl border-t-2 ${theme.border}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 relative animate-pulse ${theme.textAccent} border border-current`}>
        <div className={`w-2 h-10 rounded-full bg-current`} />
      </div>
      <h2 className={`text-3xl mb-2 ${theme.font} ${theme.textAccent}`}>
        {data.result === 'Escuchando...' ? 'Escuchando...' : 'Procesando...'}
      </h2>
      <p className={`text-xl italic opacity-80 ${theme.textMain}`}>"{data.query}"</p>
      {data.result && data.result !== 'Escuchando...' && (
        <div className={`mt-6 pt-6 border-t border-white/10 w-full text-lg leading-relaxed ${theme.textMain}`}>
          {data.result}
        </div>
      )}
    </div>
  ),
  news: ({ theme }) => (
    <WidgetContainer theme={theme} className="w-96">
      <div className="flex justify-between mb-3"><span className="text-[10px] bg-red-500 px-2 py-1 rounded-full text-white font-bold">LIVE</span><span className={`text-[10px] ${theme.textMain}`}>CNN</span></div>
      <p className={`text-lg leading-snug ${theme.textMain}`}>"IA Revoluciona el mercado de espejos..."</p>
    </WidgetContainer>
  ),
  music: ({ theme, data }) => (
    <WidgetContainer theme={theme} className="flex items-center gap-4 w-80">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/10 ${theme.textAccent}`}><Disc className="w-8 h-8 animate-spin-slow" /></div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold truncate ${theme.textAccent}`}>{data.track?.title || "Sin música"}</div>
        <div className={`text-xs opacity-60 truncate ${theme.textMain}`}>{data.track?.artist || "Esperando..."}</div>
      </div>
    </WidgetContainer>
  ),
  notifications: ({ data, theme }) => (
    <div className="flex flex-col gap-3 w-80">
      {data.items?.map((notif, i) => (
        <WidgetContainer key={i} theme={theme} className="py-3 px-4 flex items-start gap-3">
          <div className="p-2 rounded-full bg-white/10"><Mail size={14} className={theme.textAccent} /></div>
          <div>
            <div className="flex justify-between w-full"><span className={`text-xs font-bold ${theme.textAccent}`}>{notif.app}</span><span className={`text-[9px] opacity-40 ${theme.textMain}`}>{notif.time}</span></div>
            <p className={`text-sm opacity-90 ${theme.textMain}`}>{notif.message}</p>
          </div>
        </WidgetContainer>
      ))}
    </div>
  ),
  calendar: ({ data, theme }) => (
    <WidgetContainer theme={theme} className="w-80 group hover:scale-105 transition-transform cursor-pointer">
      <div className={`flex justify-between mb-4 border-b pb-2 ${theme.border}`}>
        <div className="flex gap-2"><Calendar size={18} className={theme.textAccent} /><span className={`text-xs font-bold ${theme.textMain}`}>AGENDA</span></div>
        <span className="text-xs bg-white/10 px-2 rounded text-white">HOY</span>
      </div>
      <div className="space-y-4">
        {data.events?.slice(0, 3).map((evt, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center"><span className={`text-xs font-bold ${theme.textAccent}`}>{evt.time.split(':')[0]}</span><div className="w-0.5 h-full bg-white/20" /></div>
            <div><div className={`text-sm font-medium ${theme.textMain}`}>{evt.title}</div><div className={`text-[10px] opacity-50 ${theme.textMain}`}>Sala B</div></div>
          </div>
        ))}
        {!data.events?.length && <div className={`text-xs opacity-50 ${theme.textMain}`}>Sin eventos próximos</div>}
      </div>
      <div className={`mt-2 text-[9px] text-center opacity-0 group-hover:opacity-100 transition-opacity animate-pulse ${theme.textAccent}`}>PELLIZCA PARA ABRIR</div>
    </WidgetContainer>
  ),
  mail: ({ data, theme }) => (
    <WidgetContainer theme={theme} className="w-72">
      <div className="flex justify-between mb-3"><Mail size={18} className={theme.textAccent} /><div className="flex -space-x-2 text-[8px]"><div className="w-6 h-6 rounded-full bg-gray-600 border flex items-center justify-center text-white">1</div></div></div>
      <div className="space-y-2">
        {data.emails?.slice(0,2).map((email, i) => (
          <div key={i} className="p-2 rounded hover:bg-white/5"><div className={`text-xs font-bold ${theme.textMain}`}>{email.from}</div><div className={`text-[10px] opacity-70 ${theme.textMain}`}>{email.subject}</div></div>
        ))}
      </div>
    </WidgetContainer>
  )
};

const FullAgendaView = ({ calendarData, theme, scrollRef }) => (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-20 bg-black/95 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out]">
        <div className="w-full h-full max-w-5xl flex flex-col">
            <div className={`flex items-end justify-between border-b-2 ${theme.border} pb-6 mb-10`}>
                <div><h1 className={`text-6xl font-thin tracking-tighter ${theme.textMain}`}>AGENDA</h1><p className={`text-xl ${theme.textAccent} tracking-[0.5em] uppercase mt-2`}>VISTA DETALLADA</p></div>
                <div className="text-right"><div className={`text-4xl ${theme.font} ${theme.textMain}`}>{new Date().toLocaleDateString('es-MX', {weekday:'long'})}</div><div className={`text-xl opacity-60 ${theme.textMain}`}>{new Date().toLocaleDateString('es-MX', {day:'numeric', month:'long'})}</div></div>
            </div>
            <div ref={scrollRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto content-start pb-20 no-scrollbar">
                {calendarData.events?.length > 0 ? calendarData.events.map((evt, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${theme.border} bg-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors`}>
                        <div>
                            <div className={`text-xs font-bold px-2 py-1 rounded w-max mb-3 ${evt.type === 'personal' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>{evt.type || 'REUNIÓN'}</div>
                            <h3 className={`text-3xl font-light mb-2 leading-tight ${theme.textMain}`}>{evt.title}</h3>
                        </div>
                        <div className={`text-2xl ${theme.font} ${theme.textAccent} flex items-center gap-3`}><Clock size={24} /> {evt.time}</div>
                    </div>
                )) : <div className="col-span-2 flex flex-col items-center justify-center h-full opacity-30 space-y-4"><Calendar size={64} className={theme.textMain} /><div className={`text-2xl italic ${theme.textMain}`}>No hay misiones programadas.</div></div>}
            </div>
            <div className={`mt-10 pt-6 border-t ${theme.border} flex justify-between items-center text-xs opacity-50 ${theme.textMain}`}><span className="animate-pulse">PELLIZCA Y ARRASTRA PARA SCROLL • CLICK PARA SALIR</span><span>MIRRORLINK SYNC ACTIVE</span></div>
        </div>
    </div>
);

const SmartMirror = () => {
  const {
    time, weather, handDetected, faceDetected, isStandby, bootPhase, widgets, 
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, config, updateConfig, focusMode, sessionComplete, focusTime, 
    interactionProgress, interactionType, resetToFactory, viewMode, agendaScrollRef
  } = useSmartMirrorLogic();

  const activeTheme = THEMES[config.theme] || THEMES.stark;
  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  if (bootPhase === 'booting') return <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-cyan-500 font-mono"><Loader2 className="w-16 h-16 animate-spin mb-8" /><div className="text-xl animate-pulse">REINICIANDO...</div></div>;
  if (isStandby && bootPhase === 'standby') return <div className="w-full h-screen bg-black flex items-center justify-center"><div className="text-9xl font-thin text-white font-mono opacity-30 animate-pulse">{formatTime(time)}</div></div>;

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-all duration-1000 ${activeTheme.bg} ${activeTheme.font}`} style={{ opacity: config.opacity, transform: `scale(${config.scale})` }}>
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      
      <div className="absolute inset-0 pointer-events-none">
        {config.theme === 'stark' && <div className="absolute inset-0 bg-scanlines opacity-10" />}
        {config.theme === 'cyber' && <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-transparent animate-pulse" />}
      </div>

      {handDetected && (
        <div className="absolute z-50 pointer-events-none transition-transform duration-100 ease-out" 
             style={{ left: `${handPosition.x}%`, top: `${handPosition.y}%`, transform: `translate(-50%, -50%) scale(${isGrabbing ? 0.8 : 1})` }}>
          <div className="relative">
            <div className="w-6 h-6 rounded-full border-2 border-white backdrop-blur-sm" style={{ backgroundColor: activeTheme.cursor, boxShadow: `0 0 20px ${activeTheme.cursor}` }} />
            {interactionProgress > 0 && (
              <svg className="absolute top-[-10px] left-[-10px] w-[44px] h-[44px] rotate-[-90deg]">
                <circle cx="22" cy="22" r="20" stroke="white" strokeWidth="4" fill="transparent" strokeOpacity="0.2" />
                <circle cx="22" cy="22" r="20" stroke={activeTheme.cursor} strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * interactionProgress) / 100} />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* WIDGETS CON POSICIONAMIENTO CORREGIDO */}
      {!focusMode && viewMode === 'dashboard' && Object.entries(widgets).map(([key, widget]) => {
          if (!widget.visible) return null;
          const Component = WIDGET_COMPONENTS[key];
          return (
            <div
              key={key}
              className={`absolute transition-all duration-300 ease-out ${widget.isDragging ? 'z-50 cursor-grabbing scale-110' : 'z-10 cursor-grab'}`}
              // 🔥 AQUÍ ESTÁ EL TRUCO: left/top en % + translate(-50%, -50%)
              style={{ left: `${widget.x}%`, top: `${widget.y}%`, transform: 'translate(-50%, -50%) scale(' + (widget.scale || 1) + ')' }}
              onMouseDown={(e) => handleWidgetMouseDown(e, key)}
            >
              <div className={`transition-all duration-300 ${hoveredWidget === key ? "scale-105 brightness-110" : ""}`}>
                {Component && <Component data={{...widget, time, temp: weather.temp, condition: weather.condition}} theme={activeTheme} formatTime={formatTime} formatDate={formatDate} />}
              </div>
            </div>
          );
      })}

      {viewMode === 'agenda' && <FullAgendaView calendarData={widgets.calendar || { events: [] }} theme={activeTheme} formatTime={formatTime} scrollRef={agendaScrollRef} />}

      {focusMode && (
          <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center">
            <div className={`w-[500px] h-[500px] rounded-full border-4 flex items-center justify-center relative ${activeTheme.border}`}>
              <div className={`absolute inset-0 border-t-4 rounded-full animate-spin-slow ${sessionComplete ? "border-green-500" : activeTheme.textAccent}`} />
              <div className="text-center">
                {sessionComplete ? <div className="text-green-500 text-6xl font-bold">COMPLETADO</div> : <><div className="text-2xl opacity-50 tracking-[1em] mb-4 text-white">FOCUS</div><div className={`text-9xl font-thin tabular-nums ${activeTheme.textAccent}`}>{Math.floor(focusTime/60).toString().padStart(2,'0')}:{(focusTime%60).toString().padStart(2,'0')}</div></>}
              </div>
            </div>
          </div>
      )}

      {showSettings && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center animate-[fadeIn_0.3s]" onClick={() => setShowSettings(false)}>
            <div className={`bg-gray-900 border ${activeTheme.border} w-11/12 max-w-6xl p-8 shadow-2xl h-5/6 overflow-y-auto rounded-xl`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                    <h2 className="text-3xl font-light tracking-widest text-white">AJUSTES DEL SISTEMA</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full text-white"><X /></button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">TEMA VISUAL</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(THEMES).map(([key, theme]) => (
                                    <button key={key} onClick={() => updateConfig('theme', key)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${config.theme === key ? `bg-white/10 ${theme.border}` : "border-gray-800 hover:bg-white/5"}`}>
                                        <Palette size={24} className={config.theme === key ? theme.textAccent.replace('text-', 'text-') : 'text-gray-500'} />
                                        <span className="uppercase text-xs font-bold text-white">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div><h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">WIDGETS</h3>
                            <div className="grid grid-cols-2 gap-3">{Object.values(WIDGET_REGISTRY).map(w => (
                                <div key={w.id} onClick={() => toggleWidget(w.id)} className={`p-3 rounded border flex items-center justify-between cursor-pointer ${widgets[w.id]?.visible ? `bg-blue-500/20 border-blue-500` : 'border-gray-800 opacity-50'}`}>
                                    <div className="flex items-center gap-3 text-white"><span>{w.icon}</span><span className="text-sm">{w.name}</span></div>
                                    {widgets[w.id]?.visible && <Check size={14} className="text-blue-400" />}
                                </div>
                            ))}</div>
                        </div>
                        <div><h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">PELIGRO</h3>
                            <button onClick={resetToFactory} className="w-full py-4 border border-red-500 text-red-500 rounded-xl hover:bg-red-500/10 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"><AlertTriangle size={16}/> RESTAURAR FÁBRICA</button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      )}

      <button onClick={() => setShowSettings(true)} className="absolute top-8 right-8 z-40 p-3 rounded-full bg-black/50 border border-white/10 hover:border-white transition-colors"><Settings size={24} className="text-white" /></button>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] tracking-[0.2em] text-white/30 uppercase">
        <span className={faceDetected ? "text-green-400" : ""}>VISION</span>•<span className={handDetected ? "text-blue-400" : ""}>GESTURE</span>•<span className={config.theme === 'stark' ? "text-cyan-400" : "text-white"}>{activeTheme.name} OS</span>
      </div>
    </div>
  );
};

export default SmartMirror;