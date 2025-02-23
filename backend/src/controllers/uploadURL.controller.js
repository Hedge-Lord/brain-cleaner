const AWS = require("aws-sdk");
require("dotenv").config();

const s3 = new AWS.S3({  // AWS Credentials
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.getUploadURL = async (req, res) => {
    // console.log("Succesfully reached getUploadURL:", req.file);
  try {
    const { fileName, fileType } = req.body;

    console.log("Generating pre-signed URL for:", fileName, fileType);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${fileName}`,
      ContentType: fileType,
      Expires: 600, // URL valid for 600 seconds
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    console.log(uploadURL);

    res.json({ uploadURL });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};