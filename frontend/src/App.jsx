import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import "./App.css";
import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import ExecOrderPage from "./pages/ExecOrderPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
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
  );
}

export default App;
