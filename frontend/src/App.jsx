import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import useAuthStore from "./auth/useAuthStore";
import "./App.css";

function App() {
  const { initializeAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth();

    // Debug auth state
    console.log("App - Auth initialized");
    console.log("App - Token:", localStorage.getItem("authToken"));
    console.log("App - User:", localStorage.getItem("user"));
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <div className="App">
        <AppRouter />
      </div>
    </BrowserRouter>
  );
}

export default App;
