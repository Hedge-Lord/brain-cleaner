// // import { useState } from "react";
// // import { Link, useNavigate } from "react-router-dom";
// // import { useAuth } from "../App";
// // import "./MainPage.css";

// // const MainPage = () => {
// //   const navigate = useNavigate();
// //   const { user, logout } = useAuth();
// //   const [selectedFile, setSelectedFile] = useState(null);
// //   const [previousVideos, setPreviousVideos] = useState([]);

// //   const handleLogout = () => {
// //     logout();
// //     navigate("/login");
// //   };

// //   const handleFileUpload = (e) => {
// //     setSelectedFile(e.target.files[0]);
// //   };

// //   const handleConversion = async () => {
// //     if (!selectedFile) return;
// //     // Add PDF to video conversion logic here
// //   };

// //   return (
// //     <div className="main-page">
// //       <nav className="navbar">
// //         <div className="nav-left">
// //           <Link to="/main">Home</Link>
// //           <Link to="/exec-order">Exec Order</Link>
// //         </div>
// //         <div className="nav-right">
// //           <span className="user-email">{user?.email}</span>
// //           <button onClick={handleLogout} className="logout-btn">
// //             Logout
// //           </button>
// //         </div>
// //       </nav>

// //       <div className="converter-section">
// //         <h1>PDF to Video Converter</h1>
// //         <div className="upload-container">
// //           <input
// //             type="file"
// //             accept=".pdf"
// //             onChange={handleFileUpload}
// //             id="pdf-upload"
// //           />
// //           <label htmlFor="pdf-upload" className="upload-btn">
// //             {selectedFile ? selectedFile.name : "Select PDF"}
// //           </label>
// //           {selectedFile && (
// //             <button onClick={handleConversion} className="convert-btn">
// //               Convert to Video
// //             </button>
// //           )}
// //         </div>
// //       </div>

// //       <div className="previous-videos">
// //         <h2>Your Previous Videos</h2>
// //         <div className="video-grid">
// //           {previousVideos.map((video, index) => (
// //             <div key={index} className="video-card">
// //               <video controls>
// //                 <source src={video.url} type="video/mp4" />
// //               </video>
// //               <p>{video.title}</p>
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default MainPage;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "./MainPage.css";

const DashedBox = () => {
  // Inline styles for the outer dashed box
  const outsideStyle = {
    width: "400px",
    height: "150px",
    borderStyle: "dashed",
    borderWidth: "3px",
    position: "relative"
  };

  // Inline styles for the white inner box
  const insideStyle = {
    backgroundColor: "white",
    width: "404px",
    height: "154px",
    position: "absolute",
    top: "-2px",
    left: "-2px"
  };

  return (
    <div style={outsideStyle}>
      <div style={insideStyle} />
    </div>
  );
};

const MainPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFileUpload = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleConversion = () => {
    if (!selectedFile) return;
    // TODO: Add your PDF-to-brainrot conversion logic here
  };

  const handleSave = () => {
    // TODO: Add your save logic here
  };

  return (
    <div className="main-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          {/* Replace this with a logo or text as desired */}
          <span className="brand">clnr</span>

          {/* Figma links */}
          <Link to="/videos">my videos</Link>
          <Link to="/team">meet the team</Link>
        </div>
        <div className="nav-right">
          {/* Greeting */}
          <span className="user-greeting">hi, {user?.name || "name"}</span>
          <button onClick={handleLogout} className="logout-btn">
            log out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="converter-section">
        <h1>turn pdfs to brainrot</h1>
        <div className="upload-container">
          {/* Display file name if selected, otherwise show “nothing here!” text */}

          
          {!selectedFile ? (
            <p>nothing here! select a file to convert</p>
          ) : (
            <p>{selectedFile.name}</p>
          )}

          {/* Convert button */}
          <div>
          <button onClick={handleConversion} className="convert-btn">
            convert
          </button>
          </div>

          {/* Save button */}
          <div>
          <button onClick={handleSave} className="save-btn">
            save
          </button>
          </div>

          {/* Hidden file input (or visible if you prefer) */}
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            id="pdf-upload"
            style={{ display: "none" }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer>
        <p>made possible with chunkr.ai</p>
      </footer>
    </div>
  );
};

export default MainPage;

