// Socket.io client for chat functionality
let socket;
let clientId;

function initializeSocket() {
  // Connect to socket.io server
  socket = io();
  
  // Generate a unique client ID
  clientId = 'client_' + Date.now();
  
  // Handle connection
  socket.on('connect', () => {
    console.log('Connected to chat server');
  });
  
  // Handle incoming messages
  socket.on('chat message', (data) => {
    // Add message to chat interface
    if (window.addMessage) {
      window.addMessage(data.from, data.message);
    }
  });
  
  // For staff dashboard
  socket.on('staff message', (data) => {
    // Handle incoming client message in staff dashboard
    if (window.addClientMessage) {
      window.addClientMessage(data.from, data.message);
    }
  });
}

// Function to send message to chatbot or staff
function sendChatMessage(message, to = null) {
  if (!socket) return;
  
  socket.emit('chat message', {
    from: clientId,
    to: to,
    message: message
  });
}

// Initialize socket when document is ready
document.addEventListener('DOMContentLoaded', initializeSocket);