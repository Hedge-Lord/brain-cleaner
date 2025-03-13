const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Get API key from environment variable - you'll need to add this to your .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to extract text from Chunkr API response (reused from original controller)
const extractTextFromChunkr = (chunkrData) => {
  if (!chunkrData || !chunkrData.output || !chunkrData.output.chunks) {
    throw new Error('Invalid Chunkr data structure');
  }

  // Collect only the markdown or content from each segment
  const segments = chunkrData.output.chunks.flatMap(chunk => {
    return (chunk.segments || []).map(segment => {
      return segment.markdown ? segment.markdown : segment.content ? segment.content : '';
    });
  }).filter(text => text.trim() !== '');

  let combinedText = segments.join("\n\n").split(/\s+/);
  // Extract first 4000 words of text from Chunkr's response
  const max_script_length = 4500;
  if (combinedText.length > max_script_length) {
    combinedText = combinedText.slice(0, max_script_length).join(" ");
  }

  // Return a JSON object with the extracted segments as an array,
  // and also a combined string if needed.
  return {
    segments: segments,
    combinedText: combinedText
  };
};

// Function to generate a video script using Gemini 2.0 Flash
exports.generateVideoScript = async (chunkrData) => {
  try {
    const extractedText = extractTextFromChunkr(chunkrData);

    // Get the generative model (Gemini 2.0 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Define prompt for script generation (similar to the OpenAI version)
    const prompt = `
      You are an AI scriptwriter. Convert the following text into a natural, engaging video script that is meant to be spoken aloud. 
      Do not include any meta information such as timestamps, narrator labels, stage directions, sound effects, or visual cues—only the spoken narration. 
      Maintain technical accuracy while keeping the script easy to understand and conversational for a general audience. 
      Limit the script to around 1 minute (~700 words max).
      Format your output as plain text. Include only the text of the script, and just the text. Nothing else.

      Here is the input text:
      ${extractedText.combinedText}
    `;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text; // Return script as text
  } catch (error) {
    console.error("Error generating video script with Gemini:", error);
    throw error;
  }
};
