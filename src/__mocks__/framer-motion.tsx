import React from 'react';

// Mock framer-motion to render a plain div with all non-motion props
const motion = {
  div: React.forwardRef<HTMLDivElement, Record<string, unknown>>(
    ({ children, animate, transition, initial, exit, variants, whileHover, whileTap, whileFocus, whileDrag, whileInView, layout, layoutId, ...props }, ref) => {
      // Suppress unused var warnings
      void animate;
      void transition;
      void initial;
      void exit;
      void variants;
      void whileHover;
      void whileTap;
      void whileFocus;
      void whileDrag;
      void whileInView;
      void layout;
      void layoutId;

      return (
        <div ref={ref} {...props}>
          {children as React.ReactNode}
        </div>
      );
    }
  ),
};

export { motion };
