const fetch = require("node-fetch");
require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to extract text from Chunkr API response
const extractTextFromChunkr = (chunkrData) => {
    let extractedText = "";
    chunkrData.output.chunks.forEach(chunk => {
        chunk.segments.forEach(segment => {
            extractedText += segment.text + " "; // Combine all text
        });
    });

    extractedText = extractedText.trim(); // Clean up spaces

    // Log the extracted text to see what we are sending to OpenAI
    console.log("Extracted Text from Chunkr API:", extractedText);

    return extractedText;
};

// Function to generate a video script using OpenAI
exports.generateVideoScript = async (chunkrData) => {
    try {
        // Extract full text from Chunkr's response
        const extractedText = extractTextFromChunkr(chunkrData);

        // Define OpenAI prompt for script generation
        const prompt = `
        You are an AI scriptwriter. Convert the following text into a **natural, engaging video script**.
        - Maintain **technical accuracy** but make it **easy to understand**.
        - The script should feel **conversational** and **engaging for a general audience**.
        - Limit the script to **around 1 minute** (~700 words max).

        Here is the input text:
        ${extractedText}
        `;

        // Log the prompt being sent to OpenAI
        console.log("OpenAI Prompt:", prompt);

        // Send request to OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "system", content: prompt }]
            }),
        });

        const data = await response.json();

        // Log the full response from OpenAI
        console.log("Full OpenAI API Response:", JSON.stringify(data, null, 2));

        // Handle API errors
        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
        }

        // Log the final output (generated script)
        console.log("Generated Video Script:", data.choices[0].message.content);

        return data.choices[0].message.content; // Return script as text
    } catch (error) {
        console.error("Error generating video script:", error);
        throw error;
    }
};

