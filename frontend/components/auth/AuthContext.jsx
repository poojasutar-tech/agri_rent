"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../../app/utils/domain"; // Adjust path if needed based on your Next.js directory structure

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load auth state from localStorage on mount to prevent SSR hydration mismatch
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("userData");

    if (storedToken) {
      setToken(storedToken);
    }

    if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.warn("Failed to parse stored userData; clearing invalid value.", err);
        localStorage.removeItem("userData");
      }
    }
    setIsInitialized(true);
  }, []);

  /**
   * Login Function
   */
  const login = (access, refresh, userData) => {
    localStorage.setItem("token", access);
    localStorage.setItem("refresh_token", refresh);
    
    // Ensure permissions are stored in user object for easy access
    const userWithPermissions = {
      ...userData,
      permissions: userData.permission_details || { 
        modules: {},
        submodules: {},
        activities: {}
      }
    };
    
    localStorage.setItem("userData", JSON.stringify(userWithPermissions));
    
    setToken(access);
    setUser(userWithPermissions);
  };

  /**
   * Logout Function
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
    // Redirect to login page
    window.location.href = "/admin/login";
  }, []);

  /**
   * Auto-refresh logic (Every 4 minutes)
   * Prevents session expiration while user is active
   */
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken && token) {
        try {
          const res = await api.post("token/refresh/", {
            refresh: refreshToken
          });

          const newAccess = res.data.access;
          localStorage.setItem("token", newAccess);
          setToken(newAccess);
          console.log("JWT Token Refreshed");
        } catch (err) {
          console.error("Session Expired", err);
          logout();
        }
      }
    }, 4 * 60 * 1000); // 4 minutes

    return () => clearInterval(refreshInterval);
  }, [token, logout]);

  /**
   * Idle Timeout Logic (15 minutes of inactivity)
   */
  useEffect(() => {
    if (!token) return;

    let idleTimer;
    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        console.log("User Idle - Logout");
        logout();
      }, TIMEOUT_DURATION);
    };

    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart"
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [token, logout]);

  const isAuthenticated = !!token;

  const getPermission = (code) => {
    return (
      user?.permissions?.submodules?.[code] ||
      user?.permissions?.activities?.[code] ||
      user?.permissions?.modules?.[code] ||
      null
    );
  };

  const hasPermission = (code, action) => {
    const perm = getPermission(code);
    return perm?.[action] === "Yes";
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, hasPermission, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);