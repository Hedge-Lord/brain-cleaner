require('dotenv').config();
const Creatomate = require('creatomate');
const fetch = require('node-fetch');

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
const TEST_SCRIPT = `Space exploration has come a long way since the first moon landing. Today, private companies are launching rockets into orbit with incredible precision. Scientists are planning missions to Mars, dreaming of establishing the first human colony on another planet. The James Webb telescope is revealing mysteries of distant galaxies, showing us views of the cosmos we've never seen before. What amazing discoveries await us in the final frontier?`;

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

async function textToSpeech(text, i) {

  // Text to speech
  const speech = await polly.synthesizeSpeech({
    OutputFormat: 'mp3',
    Text: text,
    VoiceId: 'Matthew',
  });

  // Get the marks at which words are spoken
  const speechMarks = await polly.synthesizeSpeech({
    OutputFormat: 'json',
    Text: text,
    VoiceId: 'Matthew',
    SpeechMarkTypes: ['word'],
  });

  // Convert the AudioStream buffer to marks
  let marks = [];
  if (speechMarks.AudioStream) {
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
  }

  // Upload the audio file to S3 and make it publicly accessible
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
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `speech/part${i}.mp3`,
  });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return { text, uploadLocation: presignedUrl, textMarks: marks };
}

const apiKey = process.env.CREATOMATE_API_KEY;
console.log('Creatomate API Key:', process.env.CREATOMATE_API_KEY);
if (!apiKey) {
  console.error('\n\n⚠️  Please set the CREATOMATE_API_KEY environment variable');
  process.exit(1);
}

function splitIntoSentences(script) {
  // Match sentences that end with a period, exclamation mark, or question mark
  const sentences = script.match(/[^.!?]+[.!?]+/g);

  // Check if the script is not null and map each sentence to trim whitespace
  return sentences ? sentences.map(sentence => sentence.trim()) : [];
}

const client = new Creatomate.Client(apiKey);
const slides = splitIntoSentences(TEST_SCRIPT);

async function run() {

  console.log('Converting text to speech using AWS Polly...');

  // Convert each text to speech
  const spokenTexts = await Promise.all(slides.map((text, i) => textToSpeech(text, i)));

  console.log('Creating video with Creatomate...');

  // Create the video
  const source = new Creatomate.Source({
    outputFormat: 'mp4',
    width: 720,
    height: 1280,

    elements: [

      ...spokenTexts.map(({ text, uploadLocation, textMarks }) => (

        new Creatomate.Composition({

          // Play all compositions sequentially by putting them on the same track
          track: 1,

          elements: [

            // Attach the speech audio clip
            new Creatomate.Audio({
              source: uploadLocation,
            }),

            new Creatomate.Text({
              width: '90%',
              height: '90%',
              fillColor: 'rgba(255,255,255,0.1)',
              fontWeight: 800,
              yAlignment: '50%',

              // Create keyframes for each spoken word
              text: textMarks.map((mark) => {

                // The spoken part
                const spoken = text.substring(0, mark.start);

                // The word being spoken right now
                const word = text.substring(mark.start, mark.end);

                // What hasn't been said yet
                const notSpoken = text.substring(mark.end);

                // Create styled text
                const highlightedText = `[color rgba(255,255,255,0.6)]${spoken}[/color]`
                  + `[color #fff]${word}[/color]`
                  + notSpoken;

                return new Creatomate.Keyframe(highlightedText, mark.time / 1000);
              }),
            }),

          ],
        })
      )),

      // Progress bar
      new Creatomate.Rectangle({
        x: '0%',
        y: '0%',
        width: '100%',
        height: '3%',
        xAnchor: '0%',
        yAnchor: '0%',
        fillColor: 'rgba(255,255,255,0.8)',
        animations: [
          new Creatomate.Wipe({
            xAnchor: '0%',
            fade: false,
            easing: 'linear',
          }),
        ],
      }),
    ],
  });

  // Render the video
  const renders = await client.render({ source });

  console.log('Completed:', renders);
}

// If this file is run directly (not imported), execute the run function
if (require.main === module) {
  console.log('Starting video generation with test script...');
  console.log('Script split into sentences:', slides);
  run()
    .catch(error => console.error('Error during execution:', error));
}

async function generateVideo(script) {
  const client = new Creatomate.Client(process.env.CREATOMATE_API_KEY);
  if (!process.env.CREATOMATE_API_KEY) {
    throw new Error('Creatomate API key not found in environment variables');
  }

  const slides = splitIntoSentences(script);
  console.log('Converting text to speech using AWS Polly...');

  // Convert each text to speech
  const spokenTexts = await Promise.all(slides.map((text, i) => textToSpeech(text, i)));

  console.log('Creating video with Creatomate...');

  // Create the video
  const source = new Creatomate.Source({
    outputFormat: 'mp4',
    width: 720,
    height: 1280,

    elements: [
      ...spokenTexts.map(({ text, uploadLocation, textMarks }) => (
        new Creatomate.Composition({
          track: 1,
          elements: [
            new Creatomate.Audio({
              source: uploadLocation,
            }),
            new Creatomate.Text({
              width: '90%',
              height: '90%',
              fillColor: 'rgba(255,255,255,0.1)',
              fontWeight: 800,
              yAlignment: '50%',
              text: textMarks.map((mark) => {
                const spoken = text.substring(0, mark.start);
                const word = text.substring(mark.start, mark.end);
                const notSpoken = text.substring(mark.end);
                const highlightedText = `[color rgba(255,255,255,0.6)]${spoken}[/color]`
                  + `[color #fff]${word}[/color]`
                  + notSpoken;
                return new Creatomate.Keyframe(highlightedText, mark.time / 1000);
              }),
            }),
          ],
        })
      )),
      new Creatomate.Rectangle({
        track: 2,
        x: '0%',
        y: '0%',
        width: '100%',
        height: '3%',
        xAnchor: '0%',
        yAnchor: '0%',
        fillColor: 'rgba(255,255,255,0.8)',
        animations: [
          new Creatomate.Wipe({
            xAnchor: '0%',
            fade: false,
            easing: 'linear',
          }),
        ],
      }),
    ],
  });

  // Render the video
  const renders = await client.render({ source });
  
  if (renders[0].status === 'failed') {
    throw new Error(`Video generation failed: ${renders[0].errorMessage}`);
  }

  // Download the video from Creatomate
  console.log('Downloading video from Creatomate...');
  const videoResponse = await fetch(renders[0].url);
  
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
  }
  
  const videoBuffer = await videoResponse.buffer();
  
  // Generate a unique filename using timestamp
  const timestamp = new Date().getTime();
  const videoKey = `videos/video_${timestamp}.mp4`;
  
  // Upload the video to S3
  console.log('Uploading video to AWS S3...');
  const uploadResult = await new Upload({
    client: s3,
    params: {
      Body: videoBuffer,
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: videoKey,
      ContentType: 'video/mp4',
    },
  }).done();
  
  // Generate a pre-signed URL for the video in S3 (valid for 24 hours)
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: videoKey,
  });
  const s3Url = await getSignedUrl(s3, command, { expiresIn: 86400 });

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