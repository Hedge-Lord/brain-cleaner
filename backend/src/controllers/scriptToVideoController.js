require('dotenv').config();
const Creatomate = require('creatomate');
// Replace the fetch import with this dynamic import
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const {
    Polly,
} = require('@aws-sdk/client-polly');

const {
    Upload,
} = require('@aws-sdk/lib-storage');

const {
    S3,
    GetObjectCommand
} = require('@aws-sdk/client-s3');

const {
    getSignedUrl
} = require('@aws-sdk/s3-request-presigner');

// Test script - a fun example about space exploration
const TEST_SCRIPT_LOWER = `Yeeked rn off of 11 yerks feeling super. Feeling like chief yeef.`;
const TEST_SCRIPT = TEST_SCRIPT_LOWER.toUpperCase();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('AWS credentials and S3 bucket name not found in environment variables. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME');
}

const polly = new Polly({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const s3 = new S3({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function textToSpeech(text, i, requestId) {
    console.log(`[${requestId}] Starting text-to-speech conversion for part ${i}`);

    // Text to speech
    console.log(`[${requestId}] Generating speech audio with Polly`);
    const speech = await polly.synthesizeSpeech({
        OutputFormat: 'mp3',
        Text: text,
        VoiceId: 'Matthew',
    });

    // Get the marks at which words are spoken
    console.log(`[${requestId}] Generating speech marks for timing`);
    const speechMarks = await polly.synthesizeSpeech({
        OutputFormat: 'json',
        Text: text,
        VoiceId: 'Matthew',
        SpeechMarkTypes: ['word'],
    });

    // Convert the AudioStream buffer to marks
    let marks = [];
    if (speechMarks.AudioStream) {
        console.log(`[${requestId}] Processing speech marks from audio stream`);
        const chunks = [];
        for await (const chunk of speechMarks.AudioStream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        marks = buffer
            .toString('utf8')
            .split('\n')
            .filter(mark => mark.length > 0)
            .map(mark => JSON.parse(mark));
        
        console.log(`[${requestId}] Processed ${marks.length} speech marks`);
    }

    // Upload the audio file to S3 and make it publicly accessible
    console.log(`[${requestId}] Uploading audio to S3: speech/part${i}.mp3`);
    const upload = await new Upload({
        client: s3,
        params: {
            Body: speech.AudioStream,
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `speech/part${i}.mp3`,
            ContentType: 'audio/mpeg',
        },
    }).done();

    // Generate a pre-signed URL that expires in 1 hour
    console.log(`[${requestId}] Generating pre-signed URL for audio file`);
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `speech/part${i}.mp3`,
    });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    console.log(`[${requestId}] Text-to-speech conversion completed for part ${i}`);
    return { text, uploadLocation: presignedUrl, textMarks: marks };
}

const apiKey = process.env.CREATOMATE_API_KEY;
if (!apiKey) {
    console.error('\n\n⚠️  Please set the CREATOMATE_API_KEY environment variable');
    process.exit(1);
}

// Function to split a script into sentences first, then into word pairs
function splitIntoWordPairs(script) {
    // First split into sentences
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [];
    const trimmedSentences = sentences.map(sentence => sentence.trim());

    // Now split each sentence into words and then pair them
    const wordPairs = [];
    for (const sentence of trimmedSentences) {
        const words = sentence.split(/\s+/);

        // Group words into pairs (or single if it's the last odd one)
        for (let i = 0; i < words.length; i += 2) {
            if (i + 1 < words.length) {
                // We have a pair
                wordPairs.push(`${words[i]} ${words[i + 1]}`);
            } else {
                // Last word is alone
                wordPairs.push(words[i]);
            }
        }
    }

    return wordPairs;
}

// Helper function to trim punctuation from words
function trimPunctuation(word) {
    return word.replace(/[^\w\s]/g, ''); // Remove non-alphanumeric characters
}

const client = new Creatomate.Client(apiKey);
const wordPairs = splitIntoWordPairs(TEST_SCRIPT);

async function run() {
    const requestId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting video generation with test script`);

    console.log(`[${requestId}] Converting text to speech using AWS Polly`);
    // Convert the entire script to speech first (for smooth audio)
    const fullSpeech = await textToSpeech(TEST_SCRIPT, 'full', requestId);

    // Create word pair segments with their timing information
    const wordPairSegments = [];
    let currentPairIndex = 0;
    const marks = fullSpeech.textMarks;

    console.log(`[${requestId}] Processing ${wordPairs.length} word pairs for timing`);
    // Process all word marks to determine timing for each word pair
    if (marks.length > 0) {
        for (let i = 0; i < wordPairs.length; i++) {
            const words = wordPairs[i].split(/\s+/);
            const wordCount = words.length;

            // Find start and end times for this word pair
            let startMark = null;
            let endMark = null;

            // Look for the starting word
            for (let j = currentPairIndex; j < marks.length; j++) {
                if (trimPunctuation(marks[j].value.toUpperCase()) === trimPunctuation(words[0].toUpperCase())) {
                    startMark = marks[j];
                    currentPairIndex = j;
                    break;
                }
            }

            // Look for the ending word (either second word in pair or single word)
            if (wordCount === 2) {
                for (let j = currentPairIndex + 1; j < marks.length; j++) {
                    if (trimPunctuation(marks[j].value.toUpperCase()) === trimPunctuation(words[1].toUpperCase())) {
                        endMark = marks[j];
                        currentPairIndex = j + 1; // Move past this word
                        break;
                    }
                }
            } else {
                // Single word, end time is the end of this word
                endMark = startMark;
                currentPairIndex += 1;
            }

            if (startMark && endMark) {
                // Calculate duration for this word pair
                const startTime = startMark.time / 1000; // Convert to seconds
                const endTime = (endMark.time + endMark.duration) / 1000; // End time including the duration of the word

                wordPairSegments.push({
                    text: wordPairs[i],
                    startTime,
                    endTime,
                    duration: endTime - startTime
                });
            } else {
                console.error(`[${requestId}] Error: Could not find marks for word pair "${wordPairs[i]}"`);
            }
        }
    }

    // Validate all timing data
    console.log(`[${requestId}] Validating timing data for ${wordPairSegments.length} segments`);
    const hasTrimIssues = wordPairSegments.some(segment => {
        return segment.duration <= 0 || segment.duration > 10; // Assume anything over 10 seconds for a word pair is an error
    });

    if (hasTrimIssues) {
        console.error(`[${requestId}] Error: Invalid timing values detected. Aborting render to save credits.`);
        throw new Error('Invalid timing values. Video duration would be incorrect.');
    }

    // Ensure minimum duration for the last word pair
    if (wordPairSegments.length > 0) {
        const lastPair = wordPairSegments[wordPairSegments.length - 1];
        if (lastPair.duration < 0.5) {  // If duration is less than 0.5 seconds
            console.log(`[${requestId}] Adjusting duration of last word pair to minimum threshold`);
            const minDuration = 0.7;  // Set a minimum duration
            lastPair.duration = minDuration;
            lastPair.endTime = lastPair.startTime + minDuration;
        }
    }

    // Calculate total video duration - last word pair end time
    const totalDuration = wordPairSegments.length > 0
        ? wordPairSegments[wordPairSegments.length - 1].endTime + 0.5 // Add 0.5 seconds buffer
        : 0;

    // Log all timing info for debugging
    console.log(`[${requestId}] Timing information for word pairs:`);
    wordPairSegments.forEach((segment, index) => {
        console.log(`[${requestId}] Word pair ${index + 1}: "${segment.text}" - Start: ${segment.startTime}s, End: ${segment.endTime}s, Duration: ${segment.duration}s`);
    });
    console.log(`[${requestId}] Total video duration: ${totalDuration}s`);

    console.log(`[${requestId}] Creating video with Creatomate`);

    // Create the video with continuous gameplay and changing text overlays
    const source = new Creatomate.Source({
        outputFormat: 'mp4',
        width: 720,
        height: 1280,
        duration: totalDuration,

        elements: [
            // Background gameplay video (continuous)
            new Creatomate.Video({
                source: 'https://brainclnr.s3.us-east-2.amazonaws.com/MCgameplay.mp4',
                track: 1, // Place on track 1 (background)
                duration: totalDuration, // Make it last for the entire video
                // If the gameplay is shorter than the speech, set it to loop
                loop: true
            }),

            // Add the full audio track
            new Creatomate.Audio({
                source: fullSpeech.uploadLocation,
                track: 2, // Place on track 2 (audio)
            }),

            // Create a text element for each word pair
            ...wordPairSegments.map((segment, index) => (
                new Creatomate.Text({
                    track: 3, // Place all text on track 3 (foreground)
                    time: segment.startTime, // Start showing this text at the calculated start time
                    duration: segment.duration, // Show for the calculated duration
                    width: '70%',
                    height: '30%',
                    fillColor: '#ffffff',
                    fontWeight: 800,
                    fontFamily: 'Rubik',
                    fontSize: '8vw',
                    fontStyle: 'italic',
                    xAlignment: '50%',
                    yAlignment: '50%',
                    text: segment.text,
                    backgroundColor: 'transparent',
                    strokeColor: '#000000',
                    strokeWidth: '2',
                    borderRadius: '10',
                })
            )),
        ],
    });

    // Render the video
    console.log(`[${requestId}] Sending render request to Creatomate`);
    const renders = await client.render({ source });

    if (renders[0].status === 'failed') {
        console.error(`[${requestId}] Video render failed:`, {
            error: renders[0].errorMessage,
            renderId: renders[0].id
        });
        throw new Error(`Video generation failed: ${renders[0].errorMessage}`);
    }

    // Download the video from Creatomate
    console.log(`[${requestId}] Downloading video from Creatomate`);
    const videoResponse = await fetch(renders[0].url);

    if (!videoResponse.ok) {
        console.error(`[${requestId}] Failed to download video:`, {
            status: videoResponse.status,
            statusText: videoResponse.statusText
        });
        throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.buffer();

    // Generate a unique filename using timestamp
    const timestamp = new Date().getTime();
    const videoKey = `videos/video_${timestamp}.mp4`;

    // Upload the video to S3
    console.log(`[${requestId}] Uploading video to AWS S3: ${videoKey}`);
    const uploadResult = await new Upload({
        client: s3,
        params: {
            Body: videoBuffer,
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: videoKey,
            ContentType: 'video/mp4',
        },
    }).done();
    console.log(`[${requestId}] Video upload completed`);

    // Generate a pre-signed URL for the video in S3 (valid for 24 hours)
    console.log(`[${requestId}] Generating pre-signed URL for video`);
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: videoKey,
    });
    const s3Url = await getSignedUrl(s3, command, { expiresIn: 86400 });

    console.log(`[${requestId}] Video generation process completed successfully`);
    return {
        creatomateUrl: renders[0].url,
        s3Url: s3Url,
        s3Key: videoKey,
        status: renders[0].status,
        id: renders[0].id
    };
}

// Export the main function
exports.generateVideo = generateVideo;

// If this file is run directly, use the test script
if (require.main === module) {
    console.log('Starting video generation with test script...');
    generateVideo(TEST_SCRIPT)
        .then(result => console.log('Completed:', result))
        .catch(error => console.error('Error during execution:', error));
}