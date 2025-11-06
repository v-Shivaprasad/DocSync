/**
 * API Client for interacting with the backend REST API
 */

const API_URL = 'http://localhost:8000';

interface Document {
  id: string;
  title: string;
  pages: string[];
  created_at: string;
  updated_at: string;
  versions?: Version[];
}

interface Version {
  id: string;
  editor: string;
  timestamp: string;
  summary: string;
  pages: string[];
}

interface DocumentUpdate {
  pages: string[];
  user_id: string;
  user_name: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Document operations
  async createDocument(title: string = 'Untitled Document'): Promise<Document> {
    return this.request<Document>('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getDocument(docId: string): Promise<Document> {
    return this.request<Document>(`/api/documents/${docId}`);
  }

  async listDocuments(): Promise<Document[]> {
    return this.request<Document[]>('/api/documents');
  }

  async updateDocument(
    docId: string,
    update: DocumentUpdate
  ): Promise<Document> {
    return this.request<Document>(`/api/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  async deleteDocument(docId: string): Promise<void> {
    return this.request<void>(`/api/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  // Version operations
  async getVersions(docId: string): Promise<Version[]> {
    return this.request<Version[]>(`/api/documents/${docId}/versions`);
  }

  async restoreVersion(docId: string, versionId: string): Promise<Document> {
    return this.request<Document>(
      `/api/documents/${docId}/versions/${versionId}/restore`,
      {
        method: 'POST',
      }
    );
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types
export type { Document, Version, DocumentUpdate };

// React hooks for API calls
import { useState, useEffect } from 'react';

export function useDocument(docId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    api
      .getDocument(docId)
      .then((doc) => {
        if (mounted) {
          setDocument(doc);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [docId]);

  const refresh = async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const doc = await api.getDocument(docId);
      setDocument(doc);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { document, loading, error, refresh };
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    api
      .listDocuments()
      .then((docs) => {
        if (mounted) {
          setDocuments(docs);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { documents, loading, error, refresh };
}

export function useVersions(docId: string | null) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    api
      .getVersions(docId)
      .then((vers) => {
        if (mounted) {
          setVersions(vers);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [docId]);

  const refresh = async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const vers = await api.getVersions(docId);
      setVersions(vers);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { versions, loading, error, refresh };
}