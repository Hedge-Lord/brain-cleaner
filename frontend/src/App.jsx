import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext } from "react";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import ExecOrderPage from "./pages/ExecOrderPage";
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import "./App.css";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Fake user database
const FAKE_USERS = [{ email: "test@test.com", password: "test123" }];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = FAKE_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      setIsAuthenticated(true);
      setUser({ email: foundUser.email });
      return { success: true };
    }
    return { success: false, error: "Invalid email or password!" };
  };

  const register = async (email, password) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (FAKE_USERS.some((u) => u.email === email)) {
      return { success: false, error: "User already exists" };
    }

    FAKE_USERS.push({ email, password });
    setIsAuthenticated(true);
    setUser({ email });
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const authValue = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/main" 
            element={
              <ProtectedRoute>
                <MainPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/exec-order" 
            element={
              <ProtectedRoute>
                <ExecOrderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/" element={<LoadingPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
