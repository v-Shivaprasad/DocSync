import { useEffect, useRef, useState } from 'react';

interface User {
  user_id: string;
  user_name: string;
  color: string;
  status: string;
}

interface UseWebSocketProps {
  docId: string;
  userId: string;
  userName: string;
  onContentUpdate: (pages: string[]) => void;
  onUsersUpdate: (users: User[]) => void;
  onVersionCreated?: (version: any) => void;
}

export const useWebSocket = ({
  docId,
  userId,
  userName,
  onContentUpdate,
  onUsersUpdate,
  onVersionCreated,
}: UseWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const userColor = useRef(`#${Math.floor(Math.random()*16777215).toString(16)}`);

  const connect = () => {
    const ws = new WebSocket(
      `ws://localhost:8000/ws/${docId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}&color=${userColor.current}`
    );

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'document_state':
          onContentUpdate(data.document.pages);
          break;

        case 'content_update':
          if (data.user_id !== userId) {
            onContentUpdate(data.pages);
          }
          break;

        case 'user_list':
          onUsersUpdate(data.users);
          break;

        case 'version_created':
          if (onVersionCreated) {
            onVersionCreated(data.version);
          }
          break;

        case 'cursor_position':
          // Handle cursor position from other users
          // You can implement cursor visualization here
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [docId]);

  const sendContentUpdate = (pages: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'content_update',
        pages,
      }));
    }
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_status',
        is_typing: isTyping,
      }));
    }
  };

  const sendCursorPosition = (position: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_position',
        position,
      }));
    }
  };

  const saveVersion = (summary: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'save_version',
        summary,
      }));
    }
  };

  return {
    isConnected,
    sendContentUpdate,
    sendTypingStatus,
    sendCursorPosition,
    saveVersion,
  };
};