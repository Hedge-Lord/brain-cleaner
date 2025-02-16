import { useState } from "react";
import { Link } from "react-router-dom";
import "./MainPage.css";

const MainPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previousVideos, setPreviousVideos] = useState([]);

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
        <Link to="/main">Home</Link>
        <Link to="/exec-order">Exec Order</Link>
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
            Select PDF
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
