import { useNavigate } from "react-router-dom";
import "./LoadingPage.css";

const LoadingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="loading-page">
      <div className="loading-content">
        <h1>Welcome to Brain Cleaner</h1>
        <p>Transform your PDFs into engaging video content</p>
        <button className="get-started-btn" onClick={() => navigate("/login")}>
          Login to Get Started
        </button>
      </div>
    </div>
  );
};

export default LoadingPage;
