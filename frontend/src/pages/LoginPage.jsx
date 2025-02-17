import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        const result = await register(formData.email, formData.password);
        if (result.success) {
          navigate("/main");
        } else {
          setError(result.error || "Registration failed");
        }
      } else {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate("/main");
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back
      </button>
      <div className="login-form-container">
        <h1>{isRegistering ? "Create Account" : "Login to Brain Cleaner"}</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading
              ? isRegistering
                ? "Creating Account..."
                : "Logging in..."
              : isRegistering
              ? "Create Account"
              : "Login"}
          </button>
        </form>
        <div className="auth-switch">
          {isRegistering ? (
            <p>
              Already have an account?{" "}
              <button
                className="text-button"
                onClick={() => setIsRegistering(false)}
              >
                Login here
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                className="text-button"
                onClick={() => setIsRegistering(true)}
              >
                Create one here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
