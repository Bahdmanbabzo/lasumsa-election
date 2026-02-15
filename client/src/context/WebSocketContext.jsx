import { createContext, useContext } from 'react';

// This context is now a no-op wrapper.
// Supabase Realtime is used directly in components that need it (e.g., LiveResults).
const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  // No WebSocket connection needed. Supabase handles realtime.
  return (
    <WebSocketContext.Provider value={{ lastMessage: null, isConnected: true, subscribe: () => () => {} }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}
