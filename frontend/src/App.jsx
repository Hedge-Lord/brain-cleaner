import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, createContext, useContext, useEffect } from "react";
import "./App.css";
import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import ExecOrderPage from "./pages/ExecOrderPage";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Fake user database
// const FAKE_USERS = [{ email: "test@test.com", password: "test123" }];
const API_URL = 'http://localhost:3000/api/v1';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const authValue = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        {loading ? (
          <LoadingPage />
        ) : (
          <Routes>
            <Route path="/" element={<LoadingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/main"
              element={isAuthenticated ? <MainPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/exec-order"
              element={
                isAuthenticated ? <ExecOrderPage /> : <Navigate to="/login" />
              }
            />
          </Routes>
        )}
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
