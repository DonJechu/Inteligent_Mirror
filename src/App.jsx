import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Loader2, EyeOff, Moon, RotateCcw, Power } from 'lucide-react';
import useSmartMirrorLogic from './hooks/useSmartMirrorLogic';
import { THEMES } from './config/themes';
import { WIDGET_COMPONENTS } from './components/Widgets';
import FullAgendaView from './components/FullAgendaView';
import SettingsPanel from './components/SettingsPanel';

const SmartMirror = () => {
  const {
    time, weather, handDetected, faceDetected, isStandby, bootPhase, widgets, 
    handPosition, isGrabbing, hoveredWidget, showSettings, setShowSettings, videoRef, 
    handleWidgetMouseDown, toggleWidget, config, updateConfig, applyPreset,
    focusMode, interactionProgress, interactionType, focusTime, sessionComplete,
    viewMode, agendaScrollRef, isDayTime, resetToFactory
  } = useSmartMirrorLogic();

  const activeTheme = THEMES[config.theme] || THEMES.stark;
  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatFocusTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (bootPhase === 'booting') return <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white font-mono"><Loader2 className="w-16 h-16 animate-spin mb-8 text-cyan-500" /><div className="text-xl animate-pulse tracking-widest">INICIALIZANDO...</div></div>;
  if (isStandby && bootPhase === 'standby') return <div className="w-full h-screen bg-black flex items-center justify-center"><div className="text-9xl font-thin text-white font-mono opacity-30 animate-pulse">{formatTime(time)}</div></div>;

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-all duration-1000 text-white ${activeTheme.bg} ${activeTheme.font}`} style={{ opacity: config.opacity, transform: `scale(${config.scale})` }}>
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      
      {/* Fondo */}
      <div className="absolute inset-0 pointer-events-none">
        {config.theme === 'stark' && <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] opacity-10" />}
      </div>

      {/* Cursores */}
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

      {/* WIDGETS - CORRECCIÓN DE CENTRADO */}
      <AnimatePresence>
        {!focusMode && viewMode === 'dashboard' && Object.entries(widgets).map(([key, widget]) => {
          if (!widget.visible) return null;
          const Component = WIDGET_COMPONENTS[key];
          return (
            <motion.div
              key={key}
              // 1. POSICIÓN BASE (CSS): Ubica el punto de anclaje
              style={{ 
                position: 'absolute',
                left: `${widget.x}%`, 
                top: `${widget.y}%`,
                zIndex: widget.isDragging ? 50 : 10
              }}
              // 2. CENTRADO (MOTION): Mueve el widget para que su centro coincida con el punto de anclaje
              initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.9 }}
              animate={{ 
                x: "-50%", 
                y: "-50%", 
                opacity: 1, 
                scale: widget.scale || 1 
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              
              className={widget.isDragging ? "cursor-grabbing" : "cursor-grab"}
              onMouseDown={(e) => handleWidgetMouseDown(e, key)}
            >
              <div className={`transition-all duration-300 ${hoveredWidget === key ? "scale-105 brightness-110" : ""}`} style={hoveredWidget === key ? {boxShadow: activeTheme.glow} : {}}>
                <Component 
                    data={{...widget, time, temp: weather.temp, condition: weather.condition}} 
                    theme={activeTheme} 
                    formatTime={formatTime} 
                    formatDate={formatDate} 
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {viewMode === 'agenda' && <FullAgendaView calendarData={widgets.calendar || { events: [] }} theme={activeTheme} formatTime={formatTime} scrollRef={agendaScrollRef} />}

      <AnimatePresence>
        {focusMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center">
            <div className={`w-[500px] h-[500px] rounded-full border-4 flex items-center justify-center relative ${activeTheme.border}`}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: sessionComplete ? 2 : 10, repeat: Infinity, ease: "linear" }} className={`absolute inset-0 border-t-4 rounded-full ${sessionComplete ? "border-green-500" : activeTheme.textAccent}`} />
              <div className="text-center">
                {sessionComplete ? <div className="text-green-500 text-6xl font-bold">COMPLETADO</div> : <><div className="text-2xl opacity-50 tracking-[1em] mb-4 text-white">FOCUS</div><div className={`text-9xl font-thin tabular-nums ${activeTheme.textAccent}`}>{formatFocusTime(focusTime)}</div></>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsPanel show={showSettings} onClose={() => setShowSettings(false)} config={config} updateConfig={updateConfig} applyPreset={applyPreset} widgets={widgets} toggleWidget={toggleWidget} theme={activeTheme} resetToFactory={resetToFactory} />

      <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowSettings(true)} className="absolute top-8 right-8 z-40 p-3 rounded-full bg-black/50 border border-white/10 hover:border-white transition-colors"><Settings size={24} className="text-white" /></motion.button>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] tracking-[0.2em] text-white/30 uppercase">
        <span className={faceDetected ? "text-green-400" : ""}>VISION</span>•<span className={handDetected ? "text-blue-400" : ""}>GESTURE</span>•<span className={config.theme === 'stark' ? "text-cyan-400" : "text-white"}>{activeTheme.name} OS</span>
      </div>
    </div>
  );
};

export default SmartMirror;