export const WIDGET_REGISTRY = {
  time: { id: 'time', name: 'Reloj Maestro', icon: '🕐', category: 'SISTEMA', priority: 1, locked: true },
  weather: { id: 'weather', name: 'Atmósfera', icon: '☀️', category: 'AMBIENTE', priority: 2 },
  search: { id: 'search', name: 'Jarvis AI', icon: '🎙️', category: 'INTELIGENCIA', priority: 0, visible: false },
  status: { id: 'status', name: 'Sistemas', icon: '📶', category: 'SISTEMA', priority: 3 },
  news: { id: 'news', name: 'Feed Global', icon: '📰', category: 'INFO', priority: 4 },
  music: { id: 'music', name: 'Audio', icon: '🎵', category: 'MEDIA', priority: 5, isDynamic: true },
  notifications: { id: 'notifications', name: 'Centro de Mensajes', icon: '💬', category: 'COMUNICACIÓN', priority: 6, isDynamic: true },
  calendar: { id: 'calendar', name: 'Agenda Diaria', icon: '📅', category: 'PRODUCTIVIDAD', priority: 7, locked: true },
  mail: { id: 'mail', name: 'Buzón Prioritario', icon: '✉️', category: 'PRODUCTIVIDAD', priority: 8 },
};

export const PRESETS = {
  default: {
    time: { x: 50, y: 50, visible: true, scale: 1.5 },
    weather: { x: 20, y: 20, visible: true, scale: 1 },
    status: { x: 90, y: 5, visible: true, scale: 0.9 },
    news: { x: 50, y: 85, visible: true, scale: 1 },
    music: { x: 80, y: 80, visible: true, scale: 1 },
    notifications: { x: 85, y: 50, visible: true, scale: 1, items: [] },
    calendar: { x: 20, y: 50, visible: true, scale: 1, events: [] },
    mail: { x: 20, y: 80, visible: true, scale: 1, emails: [] },
    search: { x: 50, y: 30, visible: false, scale: 1, query: '', result: '' }
  },
  morning: { 
    time: { x: 50, y: 15, visible: true, scale: 1 },
    weather: { x: 85, y: 20, visible: true, scale: 1 },
    status: { x: 90, y: 5, visible: true, scale: 0.8 },
    news: { x: 50, y: 85, visible: true, scale: 1 },
    music: { x: 10, y: 90, visible: false, scale: 1 },
    notifications: { x: 90, y: 80, visible: true, scale: 1, items: [] },
    calendar: { x: 25, y: 50, visible: true, scale: 1.2, events: [] },
    mail: { x: 75, y: 50, visible: true, scale: 1.1, emails: [] },
    search: { x: 50, y: 30, visible: false, scale: 1, query: '', result: '' }
  }
};

// MODO ZEN POR DEFECTO
export const DEFAULT_CONFIG = { 
    dayStart: 6, 
    nightStart: 19, 
    theme: 'zen', 
    opacity: 1, 
    scale: 1 
};