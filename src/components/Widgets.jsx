import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Battery, Sun, Calendar, Mail, Clock, Disc } from 'lucide-react';
import WidgetContainer from './WidgetContainer';

export const WIDGET_COMPONENTS = {
  time: ({ data, theme, formatTime, formatDate }) => (
    <div className={`text-center transition-all duration-300 ${data.isDragging ? "opacity-50 scale-110" : ""}`}>
      <motion.div className={`text-8xl font-light leading-none ${theme.textAccent} drop-shadow-lg`}>
        {formatTime(data.time)}
      </motion.div>
      <div className={`text-xl mt-2 opacity-80 uppercase tracking-widest ${theme.font} ${theme.textMain}`}>
        {formatDate(data.time)}
      </div>
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

  search: ({ data, theme }) => (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`${theme.panel} ${theme.shape} max-w-2xl mx-auto p-8 flex flex-col items-center text-center backdrop-blur-xl border-t-2 ${theme.border}`}
    >
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 relative animate-pulse ${theme.bg}`}>
        <div className={`w-2 h-10 rounded-full ${theme.textAccent === 'text-cyan-400' ? 'bg-cyan-500' : 'bg-white'}`}></div>
      </div>
      <h2 className={`text-3xl mb-2 ${theme.font} ${theme.textAccent}`}>
        {data.result === 'Escuchando...' ? 'Escuchando...' : 'Procesando...'}
      </h2>
      <p className={`text-xl italic opacity-80 ${theme.textMain}`}>"{data.query}"</p>
      {data.result && data.result !== 'Escuchando...' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-6 pt-6 border-t border-white/10 w-full text-lg leading-relaxed ${theme.textMain}`}>
          {data.result}
        </motion.div>
      )}
    </motion.div>
  ),

  status: ({ theme }) => (
    <WidgetContainer theme={theme} className="px-4 py-2 flex gap-6">
      <div className="flex items-center gap-2"><Wifi size={18} className={theme.textAccent} /><span className={`text-xs ${theme.textMain}`}>ONLINE</span></div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2"><Battery size={18} className="text-green-400" /><span className={`text-xs ${theme.textMain}`}>100%</span></div>
    </WidgetContainer>
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
          <WidgetContainer key={i} theme={theme} className="py-3 px-4 flex items-start gap-3 backdrop-blur-xl">
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