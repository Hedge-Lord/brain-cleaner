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
    return extractedText.trim();
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
        if (!response.ok) throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);

        return data.choices[0].message.content; // Return script as text
    } catch (error) {
        console.error("Error generating video script:", error);
        throw error;
    }
};
