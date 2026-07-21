import React, { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("phonebook_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("phonebook_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("phonebook_user");
    setUser(null);
  };

  const updateUserData = (updatedUser) => {
    const merged = { ...(user || {}), ...updatedUser };
    localStorage.setItem("phonebook_user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
