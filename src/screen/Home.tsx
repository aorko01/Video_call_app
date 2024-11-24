import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axiosInstance from '../utils/axiosInstance'; // Adjust the import path according to your file structure

const FOCUS_MODES = [
  { id: '1', title: '30 minutes', icon: 'clock-o' },
  { id: '2', title: '1 hour', icon: 'hourglass-half' },
  { id: '3', title: '2 hours', icon: 'hourglass-end' },
  { id: '4', title: 'Until tomorrow', icon: 'moon-o' },
];

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('chats');
  const [focusModeVisible, setFocusModeVisible] = useState(false);
  const [activeFocusMode, setActiveFocusMode] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/message/conversations');
      if (response.data.success) {
        setConversations(response.data.data);
      } else {
        setError('Failed to fetch conversations');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderChatItem = ({ item }) => {
    const conversationId = item._id.conversationWith;
    const lastMessage = item.latestMessage;
    const unreadCount = item.deliveredCount;

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { conversationId })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {conversationId.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.onlineBadge} />
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>User {conversationId.substring(0, 8)}</Text>
            <Text style={styles.chatTime}>
              {formatTimestamp(lastMessage.timestamp)}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={[
              styles.lastMessage,
              unreadCount > 0 && styles.lastMessageWithBadge
            ]} numberOfLines={1}>
              {lastMessage.messageContent.content}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFocusModeItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.focusModeItem,
        activeFocusMode === item.id && styles.focusModeItemActive
      ]}
      onPress={() => setActiveFocusMode(item.id)}
    >
      <FontAwesome 
        name={item.icon} 
        size={24} 
        color={activeFocusMode === item.id ? '#fff' : '#1c7a76'} 
      />
      <Text style={[
        styles.focusModeText,
        activeFocusMode === item.id && styles.focusModeTextActive
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c7a76" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchConversations}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient 
      colors={['#1a2634', '#0f141c']} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.focusButton}
              onPress={() => setFocusModeVisible(true)}
            >
              <FontAwesome 
                name={activeFocusMode ? 'moon-o' : 'bell'} 
                size={20} 
                color={activeFocusMode ? '#1c7a76' : '#fff'} 
              />
              {activeFocusMode && (
                <View style={styles.focusActiveDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
            onPress={() => setActiveTab('chats')}
          >
            <FontAwesome 
              name="comments" 
              size={20} 
              color={activeTab === 'chats' ? '#1c7a76' : '#8e8e93'} 
            />
            <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'calls' && styles.activeTab]}
            onPress={() => setActiveTab('calls')}
          >
            <FontAwesome 
              name="phone" 
              size={20} 
              color={activeTab === 'calls' ? '#1c7a76' : '#8e8e93'} 
            />
            <Text style={[styles.tabText, activeTab === 'calls' && styles.activeTabText]}>
              Calls
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={conversations}
          renderItem={renderChatItem}
          keyExtractor={item => item._id.conversationWith}
          style={styles.chatList}
          refreshing={loading}
          onRefresh={fetchConversations}
        />

        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#24b5b0', '#1c7a76']}
            style={styles.fabGradient}
          >
            <FontAwesome name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Modal
          visible={focusModeVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFocusModeVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Focus Mode</Text>
                <TouchableOpacity 
                  style={styles.modalClose}
                  onPress={() => setFocusModeVisible(false)}
                >
                  <FontAwesome name="times" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Choose how long you want to pause notifications
              </Text>
              <FlatList
                data={FOCUS_MODES}
                renderItem={renderFocusModeItem}
                keyExtractor={item => item.id}
                style={styles.focusModeList}
              />
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setFocusModeVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Focus Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusActiveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1c7a76',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(28, 122, 118, 0.1)',
  },
  tabText: {
    color: '#8e8e93',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#1c7a76',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1c7a76',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#0f141c',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  chatTime: {
    color: '#8e8e93',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a2634',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#8e8e93',
    fontSize: 16,
    marginBottom: 24,
  },
  focusModeList: {
    marginBottom: 24,
  },
  focusModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(28, 122, 118, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  focusModeItemActive: {
    backgroundColor: '#1c7a76',
  },
  focusModeText: {
    color: '#1c7a76',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  focusModeTextActive: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#1c7a76',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    color: '#8e8e93',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  lastMessageWithBadge: {
    marginRight: 40, // Make space for the badge
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: '#1c7a76',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});