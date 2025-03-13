const multer = require("multer");
const fetch = require("node-fetch");
const { generateVideoScript } = require("./scriptGeneration.controller");
const { generateVideo } = require("./scriptToVideoController");

console.log('[PDF] Initializing PDF to Brainrot controller');

// Set up Multer for file uploads (stores files in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const CHUNKR_API_KEY = process.env.CHUNKR_API_KEY;
console.log('[PDF] Chunkr API key configured:', CHUNKR_API_KEY ? 'Present' : 'Missing');

// Function to check Chunkr task status
const getTaskStatus = async (task_id, requestId) => {
    console.log(`[${requestId}] Checking Chunkr task status for task ID: ${task_id}`);
    try {
        const options = {
            method: "GET",
            headers: {
                Authorization: CHUNKR_API_KEY,
            },
        };

        console.log(`[${requestId}] Making request to Chunkr API for task status`);
        const response = await fetch(`https://api.chunkr.ai/api/v1/task/${task_id}`, options);
        const data = await response.json();

        if (!response.ok) {
            console.error(`[${requestId}] Chunkr API error:`, {
                statusCode: response.status,
                error: data
            });
            throw new Error(`Chunkr API Error: ${JSON.stringify(data)}`);
        }

        console.log(`[${requestId}] Received task status:`, {
            taskId: task_id,
            status: data.status,
            progress: data.progress
        });
        return data;
    } catch (error) {
        console.error(`[${requestId}] Error retrieving task status:`, {
            error: error.message,
            stack: error.stack,
            taskId: task_id
        });
        throw error;
    }
};

exports.processPdf = async (req, res) => {
    const requestId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting PDF processing request`);

    try {
        const { file, file_name } = req.body;
        console.log(`[${requestId}] Processing request parameters:`, {
            hasFile: !!file,
            fileName: file_name,
            fileSize: file ? Buffer.from(file, 'base64').length : 0
        });

        if (!file || !file_name) {
            console.warn(`[${requestId}] Missing required parameters:`, {
                hasFile: !!file,
                hasFileName: !!file_name
            });
            return res.status(400).json({ error: "Missing 'file' or 'file_name' in request body" });
        }

        console.log(`[${requestId}] Preparing Chunkr API request for file: ${file_name}`);
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

        console.log(`[${requestId}] Sending PDF to Chunkr API`);
        const response = await fetch("https://api.chunkr.ai/api/v1/task/parse", options);

        const contentType = response.headers.get("content-type");
        console.log(`[${requestId}] Chunkr API response content type: ${contentType}`);

        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error(`[${requestId}] Unexpected response type from Chunkr API:`, {
                expectedType: 'application/json',
                receivedType: contentType,
                responseText: text.substring(0, 200) + '...'
            });
            throw new Error(`Expected JSON but got ${contentType}. Response body: ${text}`);
        }

        const data = await response.json();
        console.log(`[${requestId}] Chunkr API initial response:`, {
            taskId: data.task_id,
            status: data.status
        });

        if (!response.ok) {
            console.error(`[${requestId}] Chunkr API request failed:`, {
                statusCode: response.status,
                error: data
            });
            return res.status(500).json({ error: 'Failed to process PDF' });
        }

        const task_id = data.task_id;
        console.log(`[${requestId}] Starting task status polling for task ID: ${task_id}`);

        let status = "Starting";
        let taskData = null;
        let num_tries = 0;
        while (status === "Starting" || status === "Processing") {
            taskData = await getTaskStatus(task_id, requestId);
            status = taskData.status;
            num_tries++;
            console.log(`[${requestId}] Task status check #${num_tries}:`, {
                status,
                progress: taskData.progress
            });
            
            if (num_tries === 10) {
                console.error(`[${requestId}] Task processing timed out after ${num_tries} attempts`);
                throw new Error('Task processing timed out');
            }
            
            console.log(`[${requestId}] Waiting 5 seconds before next status check`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        if (status === "Failed") {
            console.error(`[${requestId}] Task processing failed:`, taskData);
            return res.status(500).json({ error: "Task processing failed", task_status: taskData });
        }
        if (status === "Cancelled") {
            console.error(`[${requestId}] Task processing cancelled:`, taskData);
            return res.status(500).json({ error: "Task processing cancelled", task_status: taskData });
        }
        if (status === "Succeeded") {
            console.log(`[${requestId}] Task processing succeeded, starting script generation`);
            try {
                console.log(`[${requestId}] Generating video script from Chunkr data`);
                const script = await generateVideoScript(taskData);
                
                console.log(`[${requestId}] Generating video from script`);
                const videoResult = await generateVideo(script);
                
                console.log(`[${requestId}] Process completed successfully:`, {
                    scriptLength: script.length,
                    hasVideoUrl: !!videoResult.creatomateUrl,
                    hasS3Url: !!videoResult.s3Url
                });

                return res.status(200).json({
                    message: 'PDF processing, script generation, and video generation completed successfully',
                    script: script,
                    chunkr_data: taskData,
                    video_url: videoResult.creatomateUrl,
                    s3_video_url: videoResult.s3Url,
                    s3_video_key: videoResult.s3Key
                });
            } catch (error) {
                console.error(`[${requestId}] Error in script/video generation:`, {
                    error: error.message,
                    stack: error.stack,
                    phase: error.message.includes('script') ? 'script_generation' : 'video_generation'
                });
                return res.status(500).json({ 
                    error: 'Script or video generation failed',
                    details: error.message,
                    chunkr_data: taskData
                });
            }
        }
    } catch (error) {
        console.error(`[${requestId}] Error processing PDF:`, {
            error: error.message,
            stack: error.stack,
            fileName: file_name
        });
        res.status(500).json({ error: 'Failed to process PDF', details: error.message });
    }
};

// Export Multer middleware
exports.upload = upload;

// const express = require("express");
// const router = express.Router();
// const { upload, processPdf } = require("../controllers/pdfToBrainrot.controller");

// // ✅ Route accepts both file uploads and JSON
// router.post("/", upload.single("file"), processPdf);

// module.exports = router;
