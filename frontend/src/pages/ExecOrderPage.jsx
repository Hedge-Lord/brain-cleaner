import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ExecOrderPage.css";

const ExecOrderPage = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    // Fetch preloaded brainrot videos
    // This would be replaced with actual API call
    setVideos([
      { id: 1, title: "Brainrot Video 1", url: "/video1.mp4" },
      { id: 2, title: "Brainrot Video 2", url: "/video2.mp4" },
      // Add more videos
    ]);
  }, []);

  return (
    <div className="exec-order-page">
      <nav className="navbar">
        <Link to="/main">Home</Link>
        <Link to="/exec-order">Exec Order</Link>
      </nav>

      <div className="video-feed">
        <h1>Brainrot Videos</h1>
        <div className="video-scroll">
          {videos.map((video) => (
            <div key={video.id} className="video-container">
              <video controls loop className="video-player">
                <source src={video.url} type="video/mp4" />
              </video>
              <h3>{video.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecOrderPage;
