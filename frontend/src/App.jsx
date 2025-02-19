import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, createContext, useContext } from "react";
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
    <AuthContext.Provider value={authValue}>
      <Router>
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
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
