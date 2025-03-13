const AWS = require("aws-sdk");
require("dotenv").config();

console.log('[AWS] Initializing S3 client with region:', process.env.AWS_REGION);
const s3 = new AWS.S3({  // AWS Credentials
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.getUploadURL = async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting getUploadURL request`);

  try {
    const { fileName, fileType } = req.body;
    console.log(`[${requestId}] Request parameters:`, {
      fileName,
      fileType,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (!fileName || !fileType) {
      console.error(`[${requestId}] Missing required parameters`);
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const key = `uploads/${Date.now()}-${fileName}`;
    console.log(`[${requestId}] Generating S3 key:`, key);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 600, // URL valid for 600 seconds
    };

    console.log(`[${requestId}] S3 parameters:`, {
      bucket: params.Bucket,
      contentType: params.ContentType,
      expires: params.Expires
    });

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    console.log(`[${requestId}] Successfully generated presigned URL`);
    
    // Log URL length and partial URL for debugging (avoid logging full URL for security)
    console.log(`[${requestId}] URL details:`, {
      length: uploadURL.length,
      prefix: uploadURL.split('?')[0],
      expiresIn: '600 seconds'
    });

    res.json({ uploadURL });
    console.log(`[${requestId}] Request completed successfully`);
  } catch (error) {
    console.error(`[${requestId}] Error generating upload URL:`, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      params: req.body
    });

    // Check for specific AWS errors
    if (error.code === 'CredentialsError') {
      console.error(`[${requestId}] AWS credentials error - please check environment variables`);
      return res.status(500).json({ error: 'AWS authentication failed' });
    }

    res.status(500).json({ 
      error: "Failed to generate upload URL",
      requestId // Include requestId for tracking
    });
  }
};