import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SavedVideos.css";

const SavedVideos = () => {
  // Example data - replace with your actual video data
  const [videos] = useState([
    { id: 1, title: "video 1", thumbnail: "thumbnail1.jpg" },
    { id: 2, title: "video 2", thumbnail: "thumbnail2.jpg" },
    { id: 3, title: "video 3", thumbnail: "thumbnail3.jpg" },
    { id: 4, title: "video 4", thumbnail: "thumbnail4.jpg" },
    // Add more videos as needed
  ]);

  return (
    <div className="saved-videos">
      <nav className="nav-bar">
        <div className="nav-left">
          <Link to="/main" className="nav-link">Home</Link>
          <Link to="/saved-videos" className="nav-link active">Saved</Link>
        </div>
        <div className="nav-right">
          <Link to="/profile" className="nav-link">Profile</Link>
        </div>
      </nav>

      <h1 className="page-title">my videos</h1>

      <div className="video-grid">
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            <div className="video-thumbnail">
              {/* Replace with actual thumbnail/video player */}
              <div className="placeholder-thumbnail"></div>
            </div>
            <h3 className="video-title">{video.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedVideos;

