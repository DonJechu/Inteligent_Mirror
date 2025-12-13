export const THEMES = {
  stark: {
    name: 'J.A.R.V.I.S.',
    font: 'font-mono',
    bg: 'bg-black',
    // Usamos colores cyan más eléctricos y gradientes sutiles
    textMain: 'text-cyan-100',
    textAccent: 'text-cyan-400',
    border: 'border-cyan-500/40',
    borderColor: 'border-cyan-500',
    // Panel con gradiente sutil para dar volumen
    panel: 'bg-gradient-to-br from-cyan-950/40 to-black/60 border border-cyan-500/30 backdrop-blur-md',
    cursor: '#22d3ee', // Cyan brillante
    bgActive: 'bg-cyan-500/20',
    // Glow más intenso para parecer holograma
    glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3),_inset_0_0_10px_rgba(34,211,238,0.1)]',
    shape: 'rounded-sm border-t-2', // Borde superior más grueso estilo HUD
    animation: 'animate-pulse-slow'
  },
  minimal: {
    name: 'Braun',
    font: 'font-sans tracking-tight',
    bg: 'bg-neutral-950',
    textMain: 'text-neutral-200',
    textAccent: 'text-white',
    border: 'border-white/5',
    borderColor: 'border-white',
    // Estilo "Frosted Glass" puro de Apple
    panel: 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl',
    cursor: '#ffffff',
    bgActive: 'bg-white/15',
    glow: 'shadow-none',
    shape: 'rounded-[2rem]'
  },
  cyber: {
    name: 'Neon City',
    font: 'font-mono uppercase italic',
    bg: 'bg-slate-900',
    textMain: 'text-fuchsia-100',
    textAccent: 'text-fuchsia-500',
    border: 'border-fuchsia-500',
    borderColor: 'border-fuchsia-500',
    // Estilo agresivo con bordes cortados
    panel: 'bg-slate-900/90 border-l-4 border-r-4 border-fuchsia-500 clip-path-polygon', 
    cursor: '#d946ef',
    bgActive: 'bg-fuchsia-500/30',
    glow: 'drop-shadow-[0_0_15px_rgba(217,70,239,0.6)]',
    shape: 'rounded-none'
  },
  zen: {
    name: 'Oasis',
    font: 'font-serif',
    bg: 'bg-[#1c1917]',
    textMain: 'text-stone-300',
    textAccent: 'text-orange-200',
    border: 'border-orange-900/20',
    borderColor: 'border-orange-900',
    // Textura orgánica y cálida
    panel: 'bg-[#292524]/80 backdrop-blur-sm border border-orange-500/10 shadow-lg',
    cursor: '#fdba74',
    bgActive: 'bg-orange-500/10',
    glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]', // Sombra suave en vez de brillo
    shape: 'rounded-3xl'
  }
};