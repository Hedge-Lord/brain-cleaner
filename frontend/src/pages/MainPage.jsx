import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "./MainPage.css";

const MainPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previousVideos, setPreviousVideos] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFileUpload = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleConversion = async () => {
    if (!selectedFile) return;
    // Add PDF to video conversion logic here
  };

  return (
    <div className="main-page">
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/main">Home</Link>
          <Link to="/exec-order">Exec Order</Link>
        </div>
        <div className="nav-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="converter-section">
        <h1>PDF to Video Converter</h1>
        <div className="upload-container">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="upload-btn">
            {selectedFile ? selectedFile.name : "Select PDF"}
          </label>
          {selectedFile && (
            <button onClick={handleConversion} className="convert-btn">
              Convert to Video
            </button>
          )}
        </div>
      </div>

      <div className="previous-videos">
        <h2>Your Previous Videos</h2>
        <div className="video-grid">
          {previousVideos.map((video, index) => (
            <div key={index} className="video-card">
              <video controls>
                <source src={video.url} type="video/mp4" />
              </video>
              <p>{video.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainPage;
