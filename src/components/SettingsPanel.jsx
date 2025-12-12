import React from 'react';
import { X, Palette, EyeOff, Maximize, Check, AlertTriangle } from 'lucide-react';
import { THEMES } from '../config/themes';
import { WIDGET_REGISTRY } from '../config/constants';

const SettingsPanel = ({ show, onClose, config, updateConfig, applyPreset, widgets, toggleWidget, theme, resetToFactory }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center animate-[fadeIn_0.3s]" onClick={onClose}>
        <div className={`bg-gray-900 border ${theme.border} w-11/12 max-w-6xl p-8 shadow-2xl h-5/6 overflow-y-auto rounded-xl`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                <h2 className="text-3xl font-light tracking-widest text-white">AJUSTES DEL SISTEMA</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">TEMA VISUAL</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(THEMES).map(([key, t]) => (
                                <button key={key} onClick={() => updateConfig('theme', key)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${config.theme === key ? `bg-white/10 ${theme.border}` : "border-gray-800 hover:bg-white/5"}`}>
                                    <Palette size={24} className={config.theme === key ? theme.textAccent : 'text-gray-500'} />
                                    <span className="uppercase text-xs font-bold text-white">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">INTERFAZ GLOBAL</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-3"><EyeOff size={18} /> <span className="text-sm">Opacidad</span></div>
                                <input type="range" min="0.5" max="1" step="0.1" value={config.opacity} onChange={(e) => updateConfig('opacity', e.target.value)} className="w-40 accent-cyan-500" />
                            </div>
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-3"><Maximize size={18} /> <span className="text-sm">Escala UI</span></div>
                                <input type="range" min="0.8" max="1.2" step="0.1" value={config.scale} onChange={(e) => updateConfig('scale', e.target.value)} className="w-40 accent-cyan-500" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-xs tracking-widest uppercase mb-4">PRESETS</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <button onClick={() => applyPreset('default')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs text-white">REINICIO</button>
                            <button onClick={() => applyPreset('morning')} className="p-3 bg-gray-800 rounded hover:bg-gray-700 text-xs text-white">☀️ MAÑANA</button>
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
  );
};

export default SettingsPanel;