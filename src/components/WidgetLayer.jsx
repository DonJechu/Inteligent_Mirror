import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WIDGET_COMPONENTS } from './Widgets';

// MEMOIZACIÓN: Este componente solo se repinta si cambian los widgets o el hover
const WidgetLayer = memo(({ widgets, activeTheme, hoveredWidget, time, weather, formatTime, formatDate, handleMouseDown }) => {
  return (
    <AnimatePresence>
      {Object.entries(widgets).map(([key, widget]) => {
        if (!widget.visible) return null;
        const Component = WIDGET_COMPONENTS[key];
        if (!Component) return null;

        return (
          <motion.div
            key={key}
            // Posicionamiento
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ 
                opacity: 1, 
                scale: widget.scale || 1,
                x: "-50%", y: "-50%" // Centrado
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }} // Animación fluida
            style={{ 
                position: 'absolute', 
                left: `${widget.x}%`, 
                top: `${widget.y}%`,
                zIndex: widget.isDragging ? 50 : 10
            }}
            className={widget.isDragging ? "cursor-grabbing" : "cursor-grab"}
            onMouseDown={(e) => handleMouseDown(e, key)}
          >
            <div className={`transition-all duration-300 ${hoveredWidget === key ? "scale-105 brightness-110" : ""}`}>
              {/* Pasamos los datos necesarios */}
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
  );
}, (prevProps, nextProps) => {
    // FUNCIÓN DE COMPARACIÓN PERSONALIZADA PARA RENDIMIENTO
    // Solo re-renderizar si cambiaron los widgets, el tema, o el tiempo (minuto)
    // NO re-renderizar si solo cambió la posición del cursor (handPosition) en el padre
    return (
        prevProps.widgets === nextProps.widgets &&
        prevProps.hoveredWidget === nextProps.hoveredWidget &&
        prevProps.time === nextProps.time &&
        prevProps.activeTheme === nextProps.activeTheme
    );
});

export default WidgetLayer;