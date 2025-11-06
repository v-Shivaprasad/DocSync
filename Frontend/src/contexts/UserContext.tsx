import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type User = {
  id: string;
  name: string;
  isAdmin: boolean;
  color: string;
};

type UserContextType = {
  user: User | null;
  login: (name: string, id: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B801', '#5F4B8B',
  '#E67E22', '#2ECC71', '#9B59B6', '#34495E', '#1ABC9C'
];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // ✅ Load user from localStorage on refresh
  useEffect(() => {
    const stored = localStorage.getItem("collab-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (name: string, id: string) => {
    const color = userColors[Math.floor(Math.random() * userColors.length)];
    const newUser = {
      id,
      name,
      isAdmin: name.toLowerCase() === 'admin',
      color
    };
    setUser(newUser);
    localStorage.setItem("collab-user", JSON.stringify(newUser)); // ✅ Save to localStorage
  };

  // ✅ Optional logout
  const logout = () => {
    localStorage.removeItem("collab-user");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
