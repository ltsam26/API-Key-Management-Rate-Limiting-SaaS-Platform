import { useState, useEffect, createContext } from "react";
import { getToken, setToken, clearToken } from "../utils/token";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        setUser(payload);
        setTokenState(t);
      } catch {
        clearToken();
        setTokenState(null);
      }
    }
    setReady(true);
  }, []);

  const login = (newToken) => {
    if (!newToken) return;
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser(payload);
      setTokenState(newToken);
    } catch (e) {
      console.error("Invalid token during login", e);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setTokenState(null);
  };

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}