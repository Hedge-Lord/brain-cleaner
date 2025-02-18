const multer = require("multer");
const fetch = require("node-fetch");
const { generateVideoScript } = require("./scriptGeneration.controller");


// Set up Multer for file uploads (stores files in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const CHUNKR_API_KEY = process.env.CHUNKR_API_KEY;

// Function to check Chunkr task status
const getTaskStatus = async (task_id) => {
    try {
        const options = {
            method: "GET",
            headers: {
                Authorization: CHUNKR_API_KEY,
            },
        };

        const response = await fetch(`https://api.chunkr.ai/api/v1/task/${task_id}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Chunkr API Error: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (error) {
        console.error("Error retrieving task status:", error);
        throw error;
    }
};

exports.processPdf = async (req, res) => {
    console.log("Received file:", req.file);
    console.log("Received body:", req.body);

    try {
        let fileContent;
        let file_name;

        // ✅ Case 1: If a file is uploaded (multipart/form-data)
        if (req.file) {
            file_name = req.file.originalname;
            fileContent = req.file.buffer.toString("base64"); // Convert file to base64
            console.log("Processing PDF file upload:", file_name);
        }
        // ✅ Case 2: If a JSON request is received (base64)
        else if (req.body.file && req.body.file_name) {
            file_name = req.body.file_name;
            fileContent = req.body.file; // JSON request already contains base64 file
            console.log("Processing JSON request:", file_name);
        }
        // ❌ No file or JSON data found in request
        else {
            return res.status(400).json({ error: "Missing file or JSON data in request" });
        }

        // Send the file data to Chunkr API
        const options = {
            method: "POST",
            headers: { Authorization: CHUNKR_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
                chunk_processing: null,
                expires_in: 123,
                file: fileContent,
                file_name: file_name,
                high_resolution: false,
                ocr_strategy: null,
                pipeline: null,
                segment_processing: null,
                segmentation_strategy: null
            }),
        };

       const response = await fetch("https://api.chunkr.ai/api/v1/task/parse", options);
const data = await response.json();
console.log("Chunkr API response:", data);

if (!response.ok) {
    return res.status(500).json({ error: "Failed to process PDF" });
}

// ✅ Extract text from Chunkr's response
let extractedText = "";
if (data.output && data.output.chunks) {
    data.output.chunks.forEach(chunk => {
        chunk.segments.forEach(segment => {
            extractedText += segment.text + " ";
        });
    });
} else {
    return res.status(500).json({ error: "Invalid Chunkr response format" });
}

console.log("🔥 Extracted Text for Script:", extractedText.substring(0, 500) + "...");

// ✅ Send extracted text to OpenAI to generate script
const script = await generateVideoScript(data);

// ✅ Return the final script in JSON format
return res.status(200).json({
    message: "Video script generated successfully",
    script: script
});


    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({ error: "Failed to process PDF" });
    }
};

// Export Multer middleware for routes
exports.upload = upload;

const express = require("express");
const router = express.Router();
const { upload, processPdf } = require("../controllers/pdfToBrainrot.controller");

// ✅ Route accepts both file uploads and JSON
router.post("/", upload.single("file"), processPdf);

module.exports = router;
