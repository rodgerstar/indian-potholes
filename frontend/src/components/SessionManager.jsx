import React from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

const SessionManager = ({ children }) => {
  // Initialize session timeout (30 minutes)
  useSessionTimeout(30);

  return <>{children}</>;
};

export default SessionManager; 