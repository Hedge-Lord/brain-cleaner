const fetch = require("node-fetch");
const express = require("express");
require("dotenv").config();

const CHUNKR_API_KEY = process.env.CHUNKR_API_KEY;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());


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
        } else {
            return data;
        }
    } catch (error) {
        console.error("Error retrieving task status:", error);
        throw error;
    }
};



exports.processPdf = async (req, res) => {
    try {  // TODO: Implement PDF parsing using Chunkr API, script generation via OpenAI API, and video generation logic.
        
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

        const response = await fetch("https://api.chunkr.ai/api/v1/task/parse", options);
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
                for (let chunk of taskData.output.chunks) {
                    for (let segment of chunk.segments) {
                        console.log(segment);
                    }
                }
                return res.status(200).json({
                    message: 'PDF processing completed successfully',
                    // task_status: taskData
                });
            }
        }
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
};