import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './Tooltip.css';

const Tooltip = ({ 
  children, 
  content, 
  placement = 'top', 
  theme = 'default',
  interactive = false,
  delay = [200, 100],
  maxWidth = 300,
  ...props 
}) => {
  return (
    <Tippy
      content={content}
      placement={placement}
      theme={theme}
      interactive={interactive}
      delay={delay}
      maxWidth={maxWidth}
      {...props}
    >
      {children}
    </Tippy>
  );
};

export default Tooltip;