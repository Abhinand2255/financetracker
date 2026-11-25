import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTokens = localStorage.getItem("fintrack_tokens");
    const savedUser = localStorage.getItem("fintrack_user");

    if (savedTokens && savedUser) {
      try {
        setTokens(JSON.parse(savedTokens));
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("fintrack_tokens");
        localStorage.removeItem("fintrack_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login/", { username, password });
    const { access, refresh, user: userData } = res.data;
    const tokenObj = { access, refresh };

    localStorage.setItem("fintrack_tokens", JSON.stringify(tokenObj));
    localStorage.setItem("fintrack_user", JSON.stringify(userData));

    setTokens(tokenObj);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register/", formData);
    const { user: userData, tokens: tokenObj } = res.data;

    localStorage.setItem("fintrack_tokens", JSON.stringify(tokenObj));
    localStorage.setItem("fintrack_user", JSON.stringify(userData));

    setTokens(tokenObj);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      if (tokens?.refresh) {
        await api.post("/auth/logout/", { refresh: tokens.refresh });
      }
    } catch (e) {
      // Ignore error on logout
    } finally {
      localStorage.removeItem("fintrack_tokens");
      localStorage.removeItem("fintrack_user");
      setTokens(null);
      setUser(null);
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("fintrack_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
