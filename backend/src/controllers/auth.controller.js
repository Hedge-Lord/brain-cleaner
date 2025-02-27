const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    //debugging stuff
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }


    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    console.log('User inserted, generating token...');
    // Generate JWT token
    const payload = { id: result.rows[0].id, email: result.rows[0].email };
    console.log('Token payload:', payload);
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    console.log('Token generated successfully');

    console.log('User registered successfully:', email);
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email
      }
    });
  } catch (err) {
    console.error('Error during registration:', err);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // more debugging 
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('User logged in successfully:', email); 
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await db.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ user: user.rows[0] });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
