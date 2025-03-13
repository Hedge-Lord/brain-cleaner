const db = require('../db');

console.log('[Videos] Initializing videos controller');

/**
 * Save a video to the database
 */
exports.saveVideo = async (req, res) => {
  const requestId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting video save request`);

  const { userId, title, s3Key, s3Url, creatomateUrl } = req.body;
  console.log(`[${requestId}] Save video request parameters:`, {
    userId,
    title: title || 'Untitled Video',
    s3KeyPrefix: s3Key ? s3Key.substring(0, 20) + '...' : undefined,
    hasS3Url: !!s3Url,
    hasCreatomateUrl: !!creatomateUrl
  });

  if (!userId || !s3Key) {
    console.warn(`[${requestId}] Save video failed - Missing required fields:`, {
      hasUserId: !!userId,
      hasS3Key: !!s3Key
    });
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log(`[${requestId}] Inserting video into database`);
    const result = await db.query(
      'INSERT INTO videos (user_id, title, s3_key, s3_url, creatomate_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title || 'Untitled Video', s3Key, s3Url, creatomateUrl]
    );

    const savedVideo = result.rows[0];
    console.log(`[${requestId}] Video saved successfully:`, {
      videoId: savedVideo.id,
      userId: savedVideo.user_id,
      title: savedVideo.title
    });

    res.status(201).json({ 
      message: 'Video saved successfully',
      video: savedVideo
    });
  } catch (error) {
    console.error(`[${requestId}] Error saving video:`, {
      error: error.message,
      stack: error.stack,
      userId,
      s3KeyPrefix: s3Key ? s3Key.substring(0, 20) + '...' : undefined
    });
    res.status(500).json({ message: 'Failed to save video' });
  }
};

/**
 * Get all videos for a user
 */
exports.getUserVideos = async (req, res) => {
  const requestId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = req.params.userId;
  console.log(`[${requestId}] Starting fetch videos request for user ID: ${userId}`);

  if (!userId) {
    console.warn(`[${requestId}] Fetch videos failed - Missing user ID`);
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    console.log(`[${requestId}] Querying videos from database for user ID: ${userId}`);
    const result = await db.query(
      'SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    console.log(`[${requestId}] Successfully fetched ${result.rows.length} videos for user ID: ${userId}`);
    res.status(200).json({ videos: result.rows });
  } catch (error) {
    console.error(`[${requestId}] Error fetching user videos:`, {
      error: error.message,
      stack: error.stack,
      userId
    });
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
};

/**
 * Delete a video
 */
exports.deleteVideo = async (req, res) => {
  const requestId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { videoId, userId } = req.params;
  console.log(`[${requestId}] Starting video deletion request:`, { videoId, userId });

  if (!videoId || !userId) {
    console.warn(`[${requestId}] Delete video failed - Missing required parameters:`, {
      hasVideoId: !!videoId,
      hasUserId: !!userId
    });
    return res.status(400).json({ message: 'Video ID and User ID are required' });
  }

  try {
    console.log(`[${requestId}] Verifying video ownership`);
    const video = await db.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, userId]
    );

    if (video.rows.length === 0) {
      console.warn(`[${requestId}] Delete video failed - Video not found or unauthorized:`, {
        videoId,
        userId
      });
      return res.status(404).json({ message: 'Video not found or not authorized' });
    }

    console.log(`[${requestId}] Deleting video from database:`, {
      videoId,
      userId,
      title: video.rows[0].title
    });
    
    await db.query('DELETE FROM videos WHERE id = $1', [videoId]);

    console.log(`[${requestId}] Video deleted successfully:`, {
      videoId,
      userId,
      title: video.rows[0].title
    });

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(`[${requestId}] Error deleting video:`, {
      error: error.message,
      stack: error.stack,
      videoId,
      userId
    });
    res.status(500).json({ message: 'Failed to delete video' });
  }
};
