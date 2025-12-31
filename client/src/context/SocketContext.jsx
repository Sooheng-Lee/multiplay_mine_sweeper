import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // 개발 모드에서는 현재 호스트의 3001 포트로 연결
    // 프로덕션 모드에서는 같은 origin 사용
    const getSocketUrl = () => {
      if (import.meta.env.PROD) {
        return window.location.origin;
      }
      // 개발 모드: 현재 접속한 호스트명의 3001 포트로 연결
      // localhost로 접속하면 localhost:3001로 연결
      // IP로 접속하면 해당 IP:3001로 연결
      const host = window.location.hostname;
      return `http://${host}:3001`;
    };
    
    const socketUrl = getSocketUrl();
    console.log('Connecting to socket server:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    connected,
    emit: (event, data) => socket?.emit(event, data),
    on: (event, callback) => {
      socket?.on(event, callback);
      return () => socket?.off(event, callback);
    },
    off: (event, callback) => socket?.off(event, callback)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
