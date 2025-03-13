const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
console.log('[Auth] Initializing auth controller');

exports.register = async (req, res) => {
  const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting user registration`);

  const { email, password } = req.body;
  console.log(`[${requestId}] Registration attempt for email: ${email.substring(0, 3)}...${email.split('@')[1]}`);

  try {
    if (!email || !password) {
      console.warn(`[${requestId}] Registration failed - Missing credentials`);
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log(`[${requestId}] Checking for existing user`);
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.warn(`[${requestId}] Registration failed - User already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    console.log(`[${requestId}] Generated verification token, expires: ${tokenExpires}`);

    // Hash the password
    console.log(`[${requestId}] Hashing password`);
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`[${requestId}] Inserting new user into database`);
    const result = await db.query(
      'INSERT INTO users (email, password, verification_token, verification_token_expires) VALUES ($1, $2, $3, $4) RETURNING id, email, verification_token',
      [email, hashedPassword, verificationToken, tokenExpires]
    );
    
    const userId = result.rows[0].id;
    console.log(`[${requestId}] User created successfully, ID: ${userId}`);
    
    console.log(`[${requestId}] Sending verification email`);
    await sendVerificationEmail(email, verificationToken);
    
    console.log(`[${requestId}] Generating JWT token`);
    const payload = { id: userId, email: result.rows[0].email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    console.log(`[${requestId}] Registration completed successfully`);
    return res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: {
        id: userId,
        email: result.rows[0].email,
        isVerified: false
      }
    });
  } catch (err) {
    console.error(`[${requestId}] Registration error:`, {
      error: err.message,
      stack: err.stack,
      email: email.substring(0, 3) + '...' + email.split('@')[1]
    });
    return res.status(500).json({ message: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting login attempt`);

  const { email, password } = req.body;
  console.log(`[${requestId}] Login attempt for email: ${email.substring(0, 3)}...${email.split('@')[1]}`);

  try {
    console.log(`[${requestId}] Querying user from database`);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.warn(`[${requestId}] Login failed - User not found`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log(`[${requestId}] Validating password for user ID: ${user.id}`);
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.warn(`[${requestId}] Login failed - Invalid password for user ID: ${user.id}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_verified && !user.google_id) {
      console.warn(`[${requestId}] Login failed - Email not verified for user ID: ${user.id}`);
      return res.status(401).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    console.log(`[${requestId}] Generating JWT token for user ID: ${user.id}`);
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[${requestId}] Login successful for user ID: ${user.id}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.is_verified
      }
    });
  } catch (err) {
    console.error(`[${requestId}] Login error:`, {
      error: err.message,
      stack: err.stack,
      email: email.substring(0, 3) + '...' + email.split('@')[1]
    });
    res.status(500).json({ message: 'Error logging in' });
  }
};

exports.verifyEmail = async (req, res) => {
  const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { token } = req.query;
  console.log(`[${requestId}] Starting email verification`);

  try {
    console.log(`[${requestId}] Verifying token: ${token.substring(0, 10)}...`);

    console.log(`[${requestId}] Querying user with verification token`);
    const result = await db.query(
      'SELECT * FROM users WHERE verification_token = $1 AND verification_token IS NOT NULL',
      [token]
    );

    if (result.rows.length === 0) {
      console.warn(`[${requestId}] Verification failed - Invalid token`);
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = result.rows[0];
    console.log(`[${requestId}] Found user for verification:`, {
      id: user.id,
      email: user.email.substring(0, 3) + '...' + user.email.split('@')[1],
      is_verified: user.is_verified
    });

    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      console.warn(`[${requestId}] Verification failed - Token expired for user ID: ${user.id}`);
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    if (user.is_verified) {
      console.warn(`[${requestId}] Verification failed - User ID ${user.id} already verified`);
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    console.log(`[${requestId}] Updating user verification status`);
    await db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL, verification_token_expires = NULL WHERE id = $1 AND verification_token = $2',
      [user.id, token]
    );

    console.log(`[${requestId}] Email verification completed successfully for user ID: ${user.id}`);
    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(`[${requestId}] Verification error:`, {
      error: err.message,
      stack: err.stack,
      token: token.substring(0, 10) + '...'
    });
    return res.status(500).json({ message: 'Error verifying email' });
  }
};

exports.resendVerification = async (req, res) => {
  const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { email } = req.body;
  console.log(`[${requestId}] Starting verification resend for email: ${email.substring(0, 3)}...${email.split('@')[1]}`);

  try {
    console.log(`[${requestId}] Querying user from database`);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.warn(`[${requestId}] Resend failed - User not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      console.warn(`[${requestId}] Resend failed - User ID ${user.id} already verified`);
      return res.status(400).json({ message: 'Email is already verified' });
    }

    console.log(`[${requestId}] Generating new verification token for user ID: ${user.id}`);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log(`[${requestId}] Updating verification token in database`);
    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, tokenExpires, user.id]
    );

    console.log(`[${requestId}] Sending new verification email`);
    await sendVerificationEmail(email, verificationToken);

    console.log(`[${requestId}] Verification email resent successfully for user ID: ${user.id}`);
    return res.json({ message: 'Verification email sent successfully' });
  } catch (err) {
    console.error(`[${requestId}] Resend verification error:`, {
      error: err.message,
      stack: err.stack,
      email: email.substring(0, 3) + '...' + email.split('@')[1]
    });
    return res.status(500).json({ message: 'Error resending verification email' });
  }
};

exports.getProfile = async (req, res) => {
  const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting profile fetch for user ID: ${req.user.id}`);

  try {
    console.log(`[${requestId}] Querying user profile from database`);
    const user = await db.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
    
    if (user.rows.length === 0) {
      console.warn(`[${requestId}] Profile fetch failed - User ID ${req.user.id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`[${requestId}] Profile fetched successfully for user ID: ${req.user.id}`);
    return res.status(200).json({ user: user.rows[0] });
  } catch (err) {
    console.error(`[${requestId}] Profile fetch error:`, {
      error: err.message,
      stack: err.stack,
      userId: req.user.id
    });
    return res.status(500).json({ message: 'Server error' });
  }
};
