import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './UserContext';

interface ConnectedUser {
  user_id: string;
  user_name: string;
  color: string;
  status?: string;
  caret?: { pageIndex: number; offset: number };
}

interface Version {
  id: string;
  editor: string;
  timestamp: string;
  summary: string;
  pages: string[];
}

interface Document {
  id: string;
  title: string;
  pages: string[];
  created_at: string;
  updated_at: string;
  versions: Version[];
}

interface DocumentContextType {
  docId: string;
  document: Document | null;
  pages: string[];
  connectedUsers: ConnectedUser[];
  versions: Version[];
  isConnected: boolean;
  updatePages: (pages: string[]) => void;
  saveVersion: (summary: string) => void;
  updateTitle: (title: string) => void;
  setPages: React.Dispatch<React.SetStateAction<string[]>>;
  setCaret: (pageIndex: number, offset: number) => void;
  restoreVersion: (version: Version) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [docId, setDocId] = useState('');
  const [document, setDocument] = useState<Document | null>(null);
  const [pages, setPages] = useState<string[]>(['']);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const isSyncing = useRef(false);
  const firstLoad = useRef(true);

  // Load document
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      let id = params.get('doc');

      if (!id) {
        const res = await fetch(`${API_URL}/api/documents`, { method: 'POST' });
        const doc = await res.json();
        id = doc.id;
        window.history.replaceState({}, '', `?doc=${id}`);
        setDocument(doc);
        setPages(doc.pages);
      } else {
        const res = await fetch(`${API_URL}/api/documents/${id}`);
        const doc = await res.json();
        setDocument(doc);
        setPages(doc.pages);
        setVersions(doc.versions);
      }
      setDocId(id!);
    };
    init();
  }, []);

  // WebSocket sync
  useEffect(() => {
    if (!docId || !user) return;

    const ws = new WebSocket(
      `${WS_URL}/ws/${docId}?user_id=${user.id}&user_name=${encodeURIComponent(user.name)}&color=${encodeURIComponent(user.color)}`
    );
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'document_state':
          setDocument(data.document);
          if (firstLoad.current) {
            setPages(data.document.pages);
            firstLoad.current = false;
          }
          setVersions(data.document.versions);
          break;

        case 'content_update':
          if (data.user_id !== user.id && !isSyncing.current) {
            isSyncing.current = true;
            setPages(data.pages);
            setTimeout(() => (isSyncing.current = false), 80);
          }
          break;

        case 'user_list':
          setConnectedUsers(
            data.users
              .filter((u: any) => u.user_id !== user.id)
              .map((u: any) => ({ ...u }))
          );
          break;

        case 'presence':
          setConnectedUsers((prev) =>
            prev.map((u) =>
              u.user_id === data.user_id
                ? { ...u, caret: data.caret }
                : u
            )
          );
          break;

        case 'version_created':
          setVersions((prev) => [data.version, ...prev]);
          break;
      }
    };

    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, [docId, user]);

  const updatePages = useCallback((newPages: string[]) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || isSyncing.current) return;
    setPages(newPages);
    ws.send(JSON.stringify({ type: 'content_update', pages: newPages }));
  }, []);

  const setCaret = useCallback((pageIndex: number, offset: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'presence', caret: { pageIndex, offset } }));
  }, []);

  const saveVersion = useCallback((summary: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'save_version', summary }));
  }, []);

  const updateTitle = useCallback(async (title: string) => {
    if (!document) return;
    const res = await fetch(`${API_URL}/api/documents/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, pages: document.pages }),
    });
    setDocument(await res.json());
  }, [docId, document]);
  const restoreVersion = useCallback((version: Version) => {
  setPages(version.pages);
  setDocument(prev => prev ? { ...prev, pages: version.pages } : prev);
}, []);


  return (
    <DocumentContext.Provider
      value={{
        docId,
        document,
        pages,
        connectedUsers,
        versions,
        isConnected,
        updatePages,
        saveVersion,
        updateTitle,
        setPages,
        setCaret,
        restoreVersion,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  return useContext(DocumentContext)!;
}
