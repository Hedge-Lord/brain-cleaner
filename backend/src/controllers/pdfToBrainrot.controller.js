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
    try {
        // Extract file URL and name from request body
        const { file, file_name } = req.body;
        if (!file || !file_name) {
            return res.status(400).json({ error: "Missing 'file' or 'file_name' in request body" });
        }

        // Send PDF to Chunkr API for processing
        console.log('Processing PDF:', file_name);
        const options = {
            method: 'POST',
            headers: {Authorization: CHUNKR_API_KEY, 'Content-Type': 'application/json'},
            body: JSON.stringify({
                chunk_processing: null,
                expires_in: 123,
                file: file,
                file_name: file_name,
                high_resolution: false,
                ocr_strategy: null,
                pipeline: null,
                segment_processing: null,
                segmentation_strategy: null
            }),
          };

          console.log('Sending PDF to Chunkr API', options);

        const response = await fetch("https://api.chunkr.ai/api/v1/task/parse", options);

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}. Response body: ${text}`);
        }

        const data = await response.json();
        console.log('Chunkr API response:', data);

        if (!response.ok) {
            console.error('Failed to process PDF');
            return res.status(500).json({ error: 'Failed to process PDF' });
        } else {
            const task_id = data.task_id;
            console.log('Getting task status for task_id:', task_id);

            let status = "Starting";
            let taskData = null;
            let num_tries = 0;
            while (status === "Starting" || status === "Processing") {
                taskData = await getTaskStatus(task_id);
                status = taskData.status;
                num_tries++;
                console.log(`Retrying in 5 seconds. Current task status: ${status}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                if (num_tries === 10) throw new Error('Task processing timed out');
            }
            if (status === "Failed") {
                console.error("Task failed:", taskData);
                return res.status(500).json({ error: "Task processing failed", task_status: taskData });
            }
            if (status === "Cancelled") {
                console.error("Task cancelled:", taskData);
                return res.status(500).json({ error: "Task processing cancelled", task_status: taskData });
            }
            if (status === "Succeeded") {
                console.log("Task succeeded:", taskData);
    try {
        // Send the taskData to OpenAI for script generation
        const script = await generateVideoScript(taskData);
        
        return res.status(200).json({
            message: 'PDF processing and script generation completed successfully',
            script: script, // openAI part
            chunkr_data: taskData
        });
    } catch (error) {
        console.error('Error generating script:', error);
        return res.status(500).json({ 
            error: 'Script generation failed',
            chunkr_data: taskData  // Still return Chunkr data even if script gen fails
        });
    }
            }
        }
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }

    return;


    

    console.log(" RAW Chunkr API Response:", text); // Print full response

    try {
        const data = JSON.parse(text); // Try parsing as JSON
        console.log("Chunkr API Parsed Response:", data);

        if (!response.ok) {
            return res.status(500).json({ error: "Failed to process PDF", raw_response: data });
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

        console.log(" Extracted Text for Script:", extractedText.substring(0, 500) + "...");

        // ✅ Send extracted text to OpenAI to generate script
        const script = await generateVideoScript(data);

        // ✅ Return the final script in JSON format
        return res.status(200).json({
            message: "Video script generated successfully",
            script: script
        });

    } catch (error) {
        console.error("🔥 Error Parsing JSON:", error);
        return res.status(500).json({ error: "Invalid JSON response from Chunkr", raw_response: text });
    }
}


// // Export Multer middleware for routes
// exports.upload = upload;

// const express = require("express");
// const router = express.Router();
// const { upload, processPdf } = require("../controllers/pdfToBrainrot.controller");

// // ✅ Route accepts both file uploads and JSON
// router.post("/", upload.single("file"), processPdf);

// module.exports = router;
