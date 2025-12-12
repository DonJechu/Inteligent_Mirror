import React from 'react';
import { Calendar, Clock } from 'lucide-react';

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

export default FullAgendaView;