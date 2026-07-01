import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/http";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem("ataraxia_token");
  });

  const logout = () => {
    sessionStorage.removeItem("ataraxia_token");
    sessionStorage.removeItem("ataraxia_instance_id");
    setIsLoggedIn(false);
  };

  const login = (token: string) => {
    sessionStorage.setItem("ataraxia_token", token);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    const checkServerInstance = async () => {
      try {
        const response = await api.get("/health");
        const currentInstanceId = response.data.instanceId;
        const storedInstanceId = sessionStorage.getItem("ataraxia_instance_id");

        if (isLoggedIn) {
          if (storedInstanceId && storedInstanceId !== currentInstanceId) {
            console.log("[Auth] Server instance changed, logging out...");
            logout();
          } else if (!storedInstanceId) {
            // First time check while logged in, store the current instance
            sessionStorage.setItem("ataraxia_instance_id", currentInstanceId);
          }
        } else {
          // Even if not logged in, keep track of current instance to detect changes later
          sessionStorage.setItem("ataraxia_instance_id", currentInstanceId);
        }
      } catch (error) {
        console.error("[Auth] Failed to check server instance", error);
      }
    };

    checkServerInstance();
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
