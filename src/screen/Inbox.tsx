import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axiosInstance from '../utils/axiosInstance'; 
import SocketService from '../utils/socketService';

export default function PersonalInbox({ route, navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Extracting conversationId from the route
  const { conversationId , participant } = route.params;
  console.log('Participant:', participant);

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();

    // Set up socket message listener
    SocketService.onMessageReceived((newMessage) => {
      // Only add the message if it belongs to this conversation
      if (newMessage.conversationId === conversationId) {
        setMessages((prevMessages) => [
          {
            id: newMessage._id,
            content: newMessage.messageContent.content,
            sender: 'other',
          },
          ...prevMessages,
        ]);
      }
    });

    // Cleanup socket listener when component unmounts
    return () => {
      // Remove the message received listener
      SocketService.socket?.off('messageReceived');
    };
  }, [page, conversationId]);

  const fetchMessages = async () => {
    if (!hasNextPage) return; // Stop if no more pages to fetch
    setLoading(true);
    try {
      const response = await axiosInstance.post('/message/get-messages', {
        conversationId,
        page,
        limit: 20,
      });

      if (response.data.success) {
        const newMessages = response.data.data.messages.map((msg) => ({
          id: msg._id,
          content: msg.messageContent.content,
          sender: msg.senderId === conversationId ? 'me' : 'other',
        }));

        setMessages((prevMessages) => [...newMessages, ...prevMessages]);
        setHasNextPage(response.data.data.pagination.hasNextPage);
      } else {
        console.error('Error fetching messages:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const receiverId = participant._id;
      console.log('Sending message to:', receiverId);
      // Use SocketService to send message
      SocketService.sendMessage(receiverId, input, conversationId);

      // Optimistically add the message to the UI
      setMessages([
        {
          id: Date.now().toString(),
          content: input,
          sender: 'me',
        },
        ...messages,
      ]);
      setInput('');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <LinearGradient colors={['#1a2634', '#0f141c']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Image 
              source={{ uri: 'https://via.placeholder.com/50' }} // Replace with actual profile picture
              style={styles.profilePicture}
            />
            <Text style={styles.headerTitle}>Chat with Alex</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="phone" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="video-camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          inverted
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading && <ActivityIndicator size="small" color="#1c7a76" />}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="camera" size={24} color="#1c7a76" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="image" size={24} color="#1c7a76" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="microphone" size={24} color="#1c7a76" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#8e8e93"
            value={input}
            onChangeText={(text) => setInput(text)}
          />
          {input.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <FontAwesome name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.defaultEmoji}>🙂</Text>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '75%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1c7a76',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#fff',
    marginHorizontal: 8,
  },
  defaultEmoji: {
    fontSize: 24,
    color: '#1c7a76',
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#1c7a76',
    borderRadius: 20,
  },
});
