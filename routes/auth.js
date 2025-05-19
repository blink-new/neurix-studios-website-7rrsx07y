import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staffPath = path.join(__dirname, '..', 'data', 'staff.json');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Check for default admin credentials from .env
  const isDefaultAdmin = 
    username === process.env.ADMIN_USERNAME && 
    password === process.env.ADMIN_PASSWORD;
  
  if (isDefaultAdmin) {
    // Create token for default admin
    const token = jwt.sign(
      { 
        id: 1,
        username: 'admin',
        role: 'owner',
        displayName: 'Administrator'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000 // 1 hour
    });
    
    return res.status(200).json({ 
      message: 'Login successful',
      user: {
        username: 'admin',
        displayName: 'Administrator',
        role: 'owner'
      }
    });
  }
  
  try {
    const staff = JSON.parse(fs.readFileSync(staffPath));
    const user = staff.find(s => s.username === username);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000 // 1 hour
    });
    
    res.status(200).json({ 
      message: 'Login successful',
      user: {
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  const { username, displayName, currentPassword, newPassword } = req.body;
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staff = JSON.parse(fs.readFileSync(staffPath));
    const userIndex = staff.findIndex(s => s.id === decoded.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, staff[userIndex].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update user info
    staff[userIndex] = {
      ...staff[userIndex],
      username: username || staff[userIndex].username,
      displayName: displayName || staff[userIndex].displayName
    };
    
    // Update password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      staff[userIndex].password = await bcrypt.hash(newPassword, salt);
    }
    
    fs.writeFileSync(staffPath, JSON.stringify(staff, null, 2));
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add staff member (admin only)
router.post('/staff', async (req, res) => {
  const { username, displayName, password, role } = req.body;
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'owner' && (decoded.role !== 'admin' || role === 'admin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const staff = JSON.parse(fs.readFileSync(staffPath));
    
    // Check if username exists
    if (staff.some(s => s.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Add new staff member
    const newStaff = {
      id: Date.now(),
      username,
      displayName,
      password: hashedPassword,
      role,
      dateAdded: new Date().toISOString()
    };
    
    staff.push(newStaff);
    fs.writeFileSync(staffPath, JSON.stringify(staff, null, 2));
    
    res.status(201).json({ message: 'Staff member added successfully' });
  } catch (error) {
    console.error('Add staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

export default router;