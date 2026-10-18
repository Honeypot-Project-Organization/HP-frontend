import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UNAUTHORIZED_EVENT, clearToken, getToken, login as apiLogin } from "../lib/api.js";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const onUnauth = () => setAuthed(false);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauth);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauth);
  }, []);

  const login = useCallback(async (u, p) => {
    await apiLogin(u, p);
    setAuthed(true);
  }, []);
  const logout = useCallback(() => {
    clearToken();
    setAuthed(false);
  }, []);

  const value = useMemo(() => ({ authed, login, logout }), [authed, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
