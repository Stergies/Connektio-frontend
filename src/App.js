import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import SearchDirectory from "./components/SearchDirectory";
import AdminPanel from "./components/AdminPanel";
import Profile from "./components/Profile";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("phonebook_theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("phonebook_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <div className="app-shell" style={{ position: "relative" }}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <SearchDirectory />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <AdminPanel />
            </PrivateRoute>
          }
        />
      </Routes>
      <div style={bottomLogoWrapperStyle}>
        <img src={theme === "dark" ? "/connektio-dark.png" : "/connektio.png"} alt="Connektio" style={logoStyle} />
      </div>
    </div>
  );
}

const bottomLogoWrapperStyle = {
  position: "fixed",
  bottom: 16,
  right: 16,
  zIndex: 20,
  width: 120,
  maxWidth: "16%",
  pointerEvents: "none",
};

const logoStyle = {
  width: "100%",
  height: "auto",
  display: "block",
  borderRadius: 16,
  boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
  opacity: 0.94,
};

export default App;
