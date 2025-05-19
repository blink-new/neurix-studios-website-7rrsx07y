import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { verifyToken } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Dashboard route protection
app.get('/dashboard', verifyToken, (req, res) => {
  res.sendFile(join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/dashboard/*', verifyToken, (req, res) => {
  const path = req.path.replace('/dashboard/', '');
  res.sendFile(join(__dirname, 'public', 'dashboard', `${path}.html`));
});

// Chat socket.io
io.on('connection', (socket) => {
  console.log('User connected', socket.id);
  
  socket.on('chat message', (data) => {
    if (data.to === 'staff') {
      // Send to all staff
      io.emit('staff message', data);
    } else if (data.to) {
      // Send to specific client
      io.to(data.to).emit('chat message', data);
    } else {
      // Send to chatbot
      const response = handleChatbot(data.message);
      socket.emit('chat message', {
        from: 'bot',
        message: response
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Simple chatbot handling
function handleChatbot(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! How can I help you today?";
  } else if (lowerMessage.includes('service') || lowerMessage.includes('services')) {
    return "We offer website design, development, and digital marketing services. Would you like to know more or talk to a staff member?";
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "Our pricing varies based on project requirements. Would you like to talk to a staff member for a custom quote?";
  } else if (lowerMessage.includes('contact')) {
    return "You can reach us via email at contact@neurix.com or click the 'Talk to Staff' button to chat with someone directly.";
  } else {
    return "I'm not sure I understand. Would you like to speak with a staff member for more help?";
  }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});