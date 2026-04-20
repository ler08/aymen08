import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, username } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          username,
          role: 'client'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Generate token
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        username: data.username,
        role: data.role,
        plan: data.plan
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        username: data.username,
        role: data.role,
        plan: data.plan,
        avatar: data.avatar
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET CURRENT USER
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      username: data.username,
      role: data.role,
      plan: data.plan,
      avatar: data.avatar,
      companyName: data.company_name
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
