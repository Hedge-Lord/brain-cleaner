import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "./MainPage.css";

const BACKEND_URL = import.meta.env.BACKEND_URL;

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

  const getS3UploadURL = async (file) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      console.log("res", res);
  
      if (!res.ok) throw new Error("Failed to fetch S3 upload URL");
      const { uploadURL } = await res.json();
      return uploadURL;
    } catch (error) {
      console.error("Error getting S3 upload URL:", error);
      return null;
    }
  };
  
  const uploadFileToS3 = async (uploadURL, file) => {
    try {
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      console.log("PDF uploaded to S3");
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw error;
    }
  };

  const handleConversion = async () => {
    if (!selectedFile) return;
  
    try {
      console.log("handleConversion");
      // Generate a pre-signed (temporary) URL without credentials
      const s3UploadURL = await getS3UploadURL(selectedFile);
      console.log("S3 Upload URL:", s3UploadURL);
      if (!s3UploadURL) throw new Error("Failed to get S3 upload URL");
  
      // Upload file to S3 using pre-signed URL
      await uploadFileToS3(s3UploadURL, selectedFile);
      const fileUrl = s3UploadURL.split("?")[0]; // Get public file URL (remove query params if any)

      console.log("File URL:", fileUrl);
  
      // Send file URL to backend for processing
      const response = await fetch(`http://localhost:3000/api/v1/pdftobrainrot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: fileUrl, file_name: selectedFile.name }),
      });
  
      if (!response.ok) throw new Error("Backend processing failed");
  
      const result = await response.json();
      console.log("Conversion successful:", result);
  
    } catch (error) {
      console.error("Error during conversion:", error);
    }
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
