import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
  }

  async connect() {
    try {
      // Retrieve the access token from AsyncStorage
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Create socket connection
      this.socket = io('http://video_call_app.aorko.me', {
        auth: {
          token: accessToken
        },
        transports: ['websocket'], // Recommended for React Native
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Socket connection event handlers
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      return this.socket;
    } catch (error) {
      console.error('Error setting up socket:', error);
      throw error;
    }
  }

  // Send a text message
  sendMessage(receiverId, content, conversationId = null) {
    if (this.socket) {
      this.socket.emit('sendMessage', { 
        receiverId, 
        content, 
        conversationId 
      });
    }
  }

  // Send a file
  sendFile(receiverId, file, fileType, filename, mimeType) {
    if (this.socket) {
      this.socket.emit('sendFile', {
        receiverId,
        file,
        fileType,
        filename,
        mimeType
      });
    }
  }

  // Listen for message received
  onMessageReceived(callback) {
    if (this.socket) {
      this.socket.on('messageReceived', callback);
    }
  }

  // Listen for user status
  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('userStatus', callback);
    }
  }

  // Handle typing status
  sendTypingStatus(receiverId, typing) {
    if (this.socket) {
      this.socket.emit('typing', { receiverId, typing });
    }
  }

  // Listen for typing status
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
