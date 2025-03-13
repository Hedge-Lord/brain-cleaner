const fetch = require("node-fetch");
require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('[Script] Initializing script generation controller');
console.log('[Script] OpenAI API key configured:', OPENAI_API_KEY ? 'Present' : 'Missing');

// Function to extract text from Chunkr API response
// const extractTextFromChunkr = (chunkrData) => {
//     let extractedText = "";
//     chunkrData.output.chunks.forEach(chunk => {
//         chunk.segments.forEach(segment => {
//             extractedText += segment.text + " "; // Combine all text
//         });
//     });
//     return extractedText.trim();
// };

// function2: 

const extractTextFromChunkr = (chunkrData, requestId) => {
    console.log(`[${requestId}] Starting text extraction from Chunkr data`);
    
    if (!chunkrData || !chunkrData.output || !chunkrData.output.chunks) {
      console.error(`[${requestId}] Invalid Chunkr data structure:`, {
        hasData: !!chunkrData,
        hasOutput: chunkrData?.output,
        hasChunks: chunkrData?.output?.chunks
      });
      throw new Error('Invalid Chunkr data structure');
    }
  
    console.log(`[${requestId}] Processing ${chunkrData.output.chunks.length} chunks`);
    
    // Collect only the markdown or content from each segment
    const segments = chunkrData.output.chunks.flatMap(chunk => {
      return (chunk.segments || []).map(segment => {
        return segment.markdown ? segment.markdown : segment.content ? segment.content : '';
      });
    }).filter(text => text.trim() !== '');

    console.log(`[${requestId}] Extracted ${segments.length} text segments`);

    let combinedText = segments.join("\n\n").split(/\s+/);
    const max_script_length = 4500;
    
    console.log(`[${requestId}] Text statistics:`, {
      totalWords: combinedText.length,
      maxLength: max_script_length,
      willTruncate: combinedText.length > max_script_length
    });

    // Extract first 4000 words of text from Chunkr's response
    if (combinedText.length > max_script_length) {
      console.log(`[${requestId}] Truncating text from ${combinedText.length} to ${max_script_length} words`);
      combinedText = combinedText.slice(0, max_script_length).join(" ");
    } else {
      combinedText = combinedText.join(" ");
    }
  
    console.log(`[${requestId}] Text extraction completed:`, {
      segmentsCount: segments.length,
      combinedTextLength: combinedText.length
    });

    // Return a JSON object with the extracted segments as an array,
    // and also a combined string if needed.
    return {
      segments: segments,
      combinedText: combinedText
    };
};
  

// Function to generate a video script using OpenAI
exports.generateVideoScript = async (chunkrData) => {
    const requestId = `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting video script generation`);

    try {
        console.log(`[${requestId}] Extracting text from Chunkr data`);
        const extractedText = extractTextFromChunkr(chunkrData, requestId);

        console.log(`[${requestId}] Preparing OpenAI prompt with ${extractedText.combinedText.length} characters of text`);
        
        // Define OpenAI prompt for script generation
        const prompt = `
          You are an AI scriptwriter. Convert the following text into a natural, engaging video script that is meant to be spoken aloud. 
          Do not include any meta information such as timestamps, narrator labels, stage directions, sound effects, or visual cues—only the spoken narration. 
          Maintain technical accuracy while keeping the script easy to understand and conversational for a general audience. 
          Limit the script to around 1 minute (~700 words max).
          Format your output as plain text. Include only the text of the script, and just the text. Nothing else.

          Here is the input text:
          ${extractedText.combinedText}
        `;

        console.log(`[${requestId}] Sending request to OpenAI API`);
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
        
        if (!response.ok) {
            console.error(`[${requestId}] OpenAI API error:`, {
                statusCode: response.status,
                error: data
            });
            throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
        }

        const generatedScript = data.choices[0].message.content;
        console.log(`[${requestId}] Successfully generated script:`, {
            wordCount: generatedScript.split(/\s+/).length,
            charCount: generatedScript.length
        });

        return generatedScript;
    } catch (error) {
        console.error(`[${requestId}] Error generating video script:`, {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
