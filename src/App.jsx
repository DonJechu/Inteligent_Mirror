import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Battery, Sun, X, Settings, Music as MusicIcon, EyeOff, Loader2, Moon, Plus, Minus, RotateCcw, Power, Check, Palette, Maximize, Calendar, Mail, Clock, CloudRain, Wind, Disc } from 'lucide-react';
import useSmartMirrorLogic, { WIDGET_REGISTRY } from './useSmartMirrorLogic';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// UTILS
const cn = (...inputs) => twMerge(clsx(inputs));

// ==========================================
// 🎨 DEFINICIÓN DE TEMAS (PERFILES)
// ==========================================
const THEMES = {
  stark: {
    name: 'J.A.R.V.I.S.',
    font: 'font-mono',
    bg: 'bg-black',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/50',
    panel: 'bg-cyan-950/10 backdrop-blur-md border border-cyan-500/30',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    shape: 'rounded-sm',
    iconAnim: 'animate-pulse',
    cursor: '#06b6d4'
  },
  minimal: {
    name: 'Pure',
    font: 'font-sans tracking-tight',
    bg: 'bg-zinc-950', // Casi negro, muy elegante
    accent: 'text-white',
    border: 'border-white/10',
    panel: 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl',
    glow: 'shadow-none',
    shape: 'rounded-[2rem]',
    iconAnim: '',
    cursor: '#ffffff'
  },
  cyber: {
    name: 'Night City',
    font: 'font-mono uppercase italic',
    bg: 'bg-slate-900',
    accent: 'text-pink-500',
    border: 'border-pink-500',
    panel: 'bg-slate-900/80 border-l-4 border-pink-500 shadow-[5px_5px_0px_rgba(0,0,0,0.5)]',
    glow: 'drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]',
    shape: 'rounded-none skew-x-[-10deg]', // Forma inclinada
    iconAnim: 'animate-glitch',
    cursor: '#ec4899'
  },
  zen: {
    name: 'Harmony',
    font: 'font-serif',
    bg: 'bg-[#1a1816]', // Café muy oscuro
    accent: 'text-amber-200',
    border: 'border-amber-900/30',
    panel: 'bg-[#2a2622]/60 backdrop-blur-sm border border-amber-900/20',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.1)]',
    shape: 'rounded-[3rem] rounded-tl-none', // Forma orgánica
    iconAnim: 'animate-float',
    cursor: '#fbbf24'
  }
};

// ==========================================
// 🧩 WIDGETS INTELIGENTES (Se adaptan al tema)
// ==========================================

const WidgetContainer = ({ children, theme, className, ...props }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={cn(theme.panel, theme.shape, "p-6 relative overflow-hidden transition-colors duration-500", className)}
    {...props}
  >
    {children}
    {/* Decoración extra para STARK */}
    {theme.name === 'J.A.R.V.I.S.' && (
      <>
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
      </>
    )}
  </motion.div>
);

const WIDGET_COMPONENTS = {
  time: ({ data, theme, formatTime, formatDate }) => (
    <div className={cn("text-center transition-all", data.isDragging ? "opacity-50" : "")}>
      <motion.div 
        layoutId="clock-time"
        className={cn("text-8xl font-light leading-none", theme.accent, theme.name === 'Night City' && "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500")}
      >
        {formatTime(data.time)}
      </motion.div>
      <div className={cn("text-xl mt-2 opacity-80 uppercase tracking-widest", theme.font)}>
        {formatDate(data.time)}
      </div>
    </div>
  ),

  weather: ({ data, theme }) => (
    <WidgetContainer theme={theme} className="flex items-center gap-6 min-w-[280px]">
      <div className={cn("relative", theme.name === 'Harmony' && "animate-float")}>
        <Sun className={cn("w-16 h-16", theme.iconAnim, theme.accent)} strokeWidth={1.5} />
        {/* Decoración climática */}
        {theme.name === 'Pure' && <CloudRain className="absolute -bottom-2 -right-2 w-8 h-8 text-blue-300" />}
      </div>
      <div>
        <div className={cn("text-5xl font-light", theme.accent)}>{Math.round(data.temp)}°</div>
        <div className={cn("text-xs opacity-60 uppercase tracking-wider", theme.font)}>{data.condition}</div>
      </div>
    </WidgetContainer>
  ),

  search: ({ data, theme }) => (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(theme.panel, theme.shape, "max-w-2xl mx-auto p-8 flex flex-col items-center text-center backdrop-blur-xl border-t-2", theme.border)}
    >
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6 relative", theme.bg)}>
        <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", theme.bg === 'bg-black' ? 'bg-cyan-500' : 'bg-white')}></div>
        <div className={cn("w-3 h-12 rounded-full absolute animate-spin-slow", theme.accent === 'text-cyan-400' ? 'bg-cyan-500' : 'bg-gray-500')}></div>
      </div>
      <h2 className={cn("text-3xl mb-2", theme.font, theme.accent)}>
        {data.result === 'Escuchando...' ? 'Escuchando...' : 'Analizando...'}
      </h2>
      <p className="text-xl text-white/80 italic">"{data.query}"</p>
      {data.result && data.result !== 'Escuchando...' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 pt-6 border-t border-white/10 w-full text-lg leading-relaxed"
        >
          {data.result}
        </motion.div>
      )}
    </motion.div>
  ),

  status: ({ theme }) => (
    <WidgetContainer theme={theme} className="px-4 py-2 flex gap-6">
      <div className="flex items-center gap-2">
        <Wifi size={18} className={theme.accent} />
        <span className="text-xs font-mono">ONLINE</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <Battery size={18} className="text-green-400" />
        <span className="text-xs font-mono">100%</span>
      </div>
    </WidgetContainer>
  ),

  news: ({ theme }) => (
    <WidgetContainer theme={theme} className="w-96">
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", theme.name === 'Night City' ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white')}>
          BREAKING
        </span>
        <span className="text-[10px] opacity-50">CNN GLOBAL</span>
      </div>
      <p className={cn("text-lg leading-snug", theme.font)}>
        "Inteligencia Artificial revoluciona la domótica en 2025..."
      </p>
    </WidgetContainer>
  ),

  music: ({ theme }) => (
    <WidgetContainer theme={theme} className="flex items-center gap-4 w-80">
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden", theme.accent === 'text-white' ? 'bg-white/20' : 'bg-black/50')}>
        <Disc className={cn("w-8 h-8 animate-spin-slow", theme.accent)} />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-bold truncate", theme.accent)}>Midnight City</div>
        <div className="text-xs opacity-60 truncate">M83 • Hurry Up, We're Dreaming</div>
        <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
          <div className={cn("h-full w-2/3 rounded-full", theme.name === 'Pure' ? 'bg-white' : 'bg-current text-cyan-500')} />
        </div>
      </div>
    </WidgetContainer>
  ),

  notifications: ({ data, theme }) => (
    <div className="flex flex-col gap-3 w-80">
      <AnimatePresence>
        {data.items?.map((notif, index) => (
          <WidgetContainer 
            key={notif.id || index}
            theme={theme}
            className="py-3 px-4 flex items-start gap-3 backdrop-blur-xl"
          >
            <div className={cn("p-2 rounded-full shrink-0", theme.name === 'J.A.R.V.I.S.' ? 'bg-cyan-900/30' : 'bg-white/10')}>
              {notif.app === 'WhatsApp' ? <div className="text-green-400 font-bold">WA</div> : <Mail size={14} />}
            </div>
            <div>
              <div className="flex justify-between items-baseline w-full">
                <span className={cn("text-xs font-bold", theme.accent)}>{notif.app}</span>
                <span className="text-[9px] opacity-40">{notif.time}</span>
              </div>
              <p className="text-sm leading-tight mt-1 opacity-90">{notif.message}</p>
            </div>
          </WidgetContainer>
        ))}
      </AnimatePresence>
    </div>
  ),

  calendar: ({ data, theme }) => (
    <WidgetContainer theme={theme} className="w-80 group hover:scale-105 transition-transform">
      <div className={cn("flex items-center justify-between mb-4 border-b pb-2", theme.border)}>
        <div className="flex items-center gap-2">
          <Calendar size={18} className={theme.accent} />
          <span className={cn("text-xs font-bold tracking-widest", theme.font)}>AGENDA</span>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded", theme.name === 'Pure' ? 'bg-black text-white' : 'bg-white/10')}>HOY</span>
      </div>
      <div className="space-y-4">
        {data.events?.slice(0, 3).map((evt, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("text-xs font-bold", theme.accent)}>{evt.time.split(':')[0]}</span>
              <div className={cn("w-0.5 h-full mt-1 bg-gradient-to-b from-current to-transparent opacity-20", theme.accent)} />
            </div>
            <div>
              <div className="text-sm font-medium">{evt.title}</div>
              <div className="text-[10px] opacity-50">Sala de conferencias B</div>
            </div>
          </div>
        ))}
        {(!data.events || data.events.length === 0) && <div className="text-xs opacity-50 italic">Tiempo libre...</div>}
      </div>
    </WidgetContainer>
  ),

  mail: ({ data, theme }) => (
    <WidgetContainer theme={theme} className="w-72">
      <div className="flex items-center justify-between mb-3">
        <Mail size={18} className={theme.accent} />
        <div className="flex -space-x-2">
          {[1,2,3].map(i => <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-black bg-gray-600 flex items-center justify-center text-[8px]", theme.border)}>{i}</div>)}
        </div>
      </div>
      <div className="space-y-2">
        {data.emails?.slice(0,2).map((email, i) => (
          <div key={i} className={cn("p-2 rounded cursor-pointer transition-colors", theme.name === 'Pure' ? 'hover:bg-black/5' : 'hover:bg-white/5')}>
            <div className="text-xs font-bold truncate">{email.from}</div>
            <div className="text-[10px] opacity-70 truncate">{email.subject}</div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  )
};

// ==========================================
// 🚀 COMPONENTE PRINCIPAL
// ==========================================
const SmartMirror = () => {
  const {
    time, weather, handDetected, faceDetected, isStandby, bootPhase, widgets, 
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, config, updateConfig, isDayTime, applyPreset,
    focusMode, sessionComplete, focusTime, viewMode, agendaScrollRef
  } = useSmartMirrorLogic();

  const activeTheme = THEMES[config.theme] || THEMES.stark;

  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  // PANTALLA DE REINICIO
  if (bootPhase === 'booting') return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-cyan-500 font-mono">
      <Loader2 className="w-16 h-16 animate-spin mb-8" />
      <div className="text-xl tracking-[0.5em] animate-pulse">INICIALIZANDO SISTEMA...</div>
    </div>
  );

  // PANTALLA STANDBY
  if (isStandby && bootPhase === 'standby') return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center opacity-30 animate-pulse">
        <div className="text-9xl font-thin text-white font-mono">{formatTime(time)}</div>
      </div>
    </div>
  );

  return (
    <div 
      className={cn("relative w-full h-screen overflow-hidden transition-all duration-1000", activeTheme.bg, activeTheme.font, "text-white")}
      style={{ opacity: config.opacity, transform: `scale(${config.scale})` }}
    >
      <video ref={videoRef} autoPlay playsInline className="hidden" />

      {/* FONDO ANIMADO SEGÚN TEMA */}
      <div className="absolute inset-0 pointer-events-none">
        {config.theme === 'stark' && <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />}
        {config.theme === 'cyber' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.1),_transparent_70%)] animate-pulse" />}
        {config.theme === 'zen' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.05),_transparent_50%)]" />}
      </div>

      {/* CURSOR GESTUAL */}
      {handDetected && (
        <motion.div 
          className="absolute z-50 pointer-events-none"
          animate={{ x: `${handPosition.x}vw`, y: `${handPosition.y}vh`, scale: isGrabbing ? 0.5 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ translateX: '-50%', translateY: '-50%' }}
        >
          <div 
            className="w-6 h-6 rounded-full border-2 border-white backdrop-blur-sm" 
            style={{ backgroundColor: activeTheme.cursor, boxShadow: `0 0 20px ${activeTheme.cursor}` }} 
          />
        </motion.div>
      )}

      {/* UI PRINCIPAL */}
      <AnimatePresence>
        {!focusMode && Object.entries(widgets).map(([key, widget]) => {
          if (!widget.visible) return null;
          const Component = WIDGET_COMPONENTS[key];
          
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: widget.scale || 1, x: `${widget.x}vw`, y: `${widget.y}vh` }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className={cn("absolute transform -translate-x-1/2 -translate-y-1/2", widget.isDragging ? "z-50 cursor-grabbing scale-110" : "z-10 cursor-grab")}
              onMouseDown={(e) => handleWidgetMouseDown(e, key)}
              style={{ left: 0, top: 0 }} // Reset default positioning, handled by motion
            >
              <div className={cn("transition-all duration-300", hoveredWidget === key ? "scale-105 brightness-110" : "")} style={hoveredWidget === key ? { boxShadow: activeTheme.glow } : {}}>
                {Component && <Component data={{...widget, time, temp: weather.temp, condition: weather.condition}} theme={activeTheme} formatTime={formatTime} formatDate={formatDate} />}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* MODO FOCUS (POMODORO) */}
      <AnimatePresence>
        {focusMode && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center"
          >
            <div className={cn("w-[500px] h-[500px] rounded-full border-4 flex items-center justify-center relative", activeTheme.border)}>
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: sessionComplete ? 2 : 10, repeat: Infinity, ease: "linear" }}
                className={cn("absolute inset-0 border-t-4 rounded-full", sessionComplete ? "border-green-500" : activeTheme.accent)} 
              />
              <div className="text-center">
                {sessionComplete ? (
                  <div className="text-green-500 text-6xl font-bold">COMPLETADO</div>
                ) : (
                  <>
                    <div className="text-2xl opacity-50 tracking-[1em] mb-4">FOCUS</div>
                    <div className={cn("text-9xl font-thin tabular-nums", activeTheme.accent)}>
                      {Math.floor(focusTime/60).toString().padStart(2,'0')}:{(focusTime%60).toString().padStart(2,'0')}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL DE CONFIGURACIÓN */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-8 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-light tracking-widest text-white">AJUSTES</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
            </div>

            <div className="space-y-10">
              {/* SELECCIÓN DE TEMAS */}
              <section>
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-4">PERFIL VISUAL</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => updateConfig('theme', key)}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300",
                        config.theme === key 
                          ? `bg-white/10 ${theme.border} scale-105` 
                          : "border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full", theme.bg === 'bg-white' ? 'bg-white' : theme.bg, theme.border, "border-2")} />
                      <span className="text-xs font-bold uppercase">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* WIDGETS TOGGLES */}
              <section>
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-4">MÓDULOS ACTIVOS</h3>
                <div className="space-y-2">
                  {Object.values(WIDGET_REGISTRY).map(w => (
                    <div 
                      key={w.id} 
                      onClick={() => toggleWidget(w.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border",
                        widgets[w.id]?.visible ? "bg-white/10 border-white/20" : "border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{w.icon}</span>
                        <span className="text-sm font-medium">{w.name}</span>
                      </div>
                      {widgets[w.id]?.visible && <Check size={16} className="text-green-400" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTÓN DE AJUSTES FLOTANTE */}
      <motion.button 
        whileHover={{ rotate: 90 }}
        onClick={() => setShowSettings(true)} 
        className="absolute top-8 right-8 z-40 p-3 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white/50 hover:text-white hover:border-white/50 transition-colors"
      >
        <Settings size={24} />
      </motion.button>

      {/* INDICADORES DE ESTADO (IA) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] tracking-[0.2em] text-white/30 uppercase">
        <span className={faceDetected ? "text-green-400" : ""}>VISION</span>
        <span>•</span>
        <span className={handDetected ? "text-blue-400" : ""}>GESTURE</span>
        <span>•</span>
        <span className={config.theme === 'stark' ? "text-cyan-400" : "text-white"}>{activeTheme.name} OS</span>
      </div>
    </div>
  );
};

export default SmartMirror;