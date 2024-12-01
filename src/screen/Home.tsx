import React, {useState, useEffect} from 'react';
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
  PermissionsAndroid,
  Platform,
  AppState
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Contacts from 'react-native-contacts';
import axiosInstance from '../utils/axiosInstance';
import SocketService from '../utils/socketService';

const FOCUS_MODES = [
  {id: '1', title: '30 minutes', icon: 'clock-o'},
  {id: '2', title: '1 hour', icon: 'hourglass-half'},
  {id: '3', title: '2 hours', icon: 'hourglass-end'},
  {id: '4', title: 'Until tomorrow', icon: 'moon-o'},
];

export default function HomeScreen({navigation}) {
  const [activeTab, setActiveTab] = useState('chats');
  const [focusModeVisible, setFocusModeVisible] = useState(false);
  const [contactListVisible, setContactListVisible] = useState(false);
  const [activeFocusMode, setActiveFocusMode] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Setup socket connection when component mounts
    const setupSocketConnection = async () => {
      try {
        await SocketService.connect();

        // Listen for user status updates
        SocketService.onUserStatus((status) => {
          setOnlineUsers(prevUsers => {
            const updatedUsers = new Set(prevUsers);
            if (status.status === 'online') {
              updatedUsers.add(status.userId);
            } else {
              updatedUsers.delete(status.userId);
            }
            return updatedUsers;
          });
        });

        // Listen for new messages
        SocketService.onMessageReceived((message) => {
          // Update conversations when a new message is received
          fetchConversations();
        });
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    setupSocketConnection();

    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        fetchConversations();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial fetch of conversations
    fetchConversations();

    // Cleanup
    return () => {
      SocketService.disconnect();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (contactListVisible) {
      requestContactPermission();
    }
  }, [contactListVisible]);

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

  const requestContactPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          loadContacts();
        } else {
          console.log('Contacts permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      loadContacts();
    }
  };

  const loadContacts = () => {
    setContactLoading(true);
    Contacts.getAll()
      .then(contacts => {
        const formattedContacts = contacts
          .filter(contact => contact.phoneNumbers.length > 0)
          .map(contact => ({
            id: contact.recordID,
            name: `${contact.givenName} ${contact.familyName}`.trim(),
            mobileNumber: contact.phoneNumbers[0]?.number || '',
          }));
        setContacts(formattedContacts);
        setContactLoading(false);
      })
      .catch(error => {
        console.log('Error loading contacts', error);
        setContactLoading(false);
      });
  };

  const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleContactSelect = mobileNumber => {
    setContactListVisible(false);
    navigation.navigate('Inbox', {mobileNumber});
  };

  const renderChatItem = ({item}) => {
    const conversationId = item._id;
    console.log(conversationId);
    const username = item.participants[0].username;
    const participant= item.participants[0];
    const lastMessage = item.lastMessage;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Inbox', {conversationId, participant})}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{username}</Text>
            <Text style={styles.chatTime}>
              {formatTimestamp(lastMessage.timestamp)}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <Text
              style={[
                styles.lastMessage,
                item.messageCount > 0 && styles.lastMessageWithBadge,
              ]}
              numberOfLines={1}>
              {lastMessage.content}
            </Text>
            {item.messageCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.messageCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFocusModeItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.focusModeItem,
        activeFocusMode === item.id && styles.focusModeItemActive,
      ]}
      onPress={() => setActiveFocusMode(item.id)}>
      <FontAwesome
        name={item.icon}
        size={24}
        color={activeFocusMode === item.id ? '#fff' : '#1c7a76'}
      />
      <Text
        style={[
          styles.focusModeText,
          activeFocusMode === item.id && styles.focusModeTextActive,
        ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderContactItem = ({item}) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactSelect(item.mobileNumber)}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactNumber}>{item.mobileNumber}</Text>
      </View>
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
          onPress={fetchConversations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1a2634', '#0f141c']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.focusButton}
              onPress={() => setFocusModeVisible(true)}>
              <FontAwesome
                name={activeFocusMode ? 'moon-o' : 'bell'}
                size={20}
                color={activeFocusMode ? '#1c7a76' : '#fff'}
              />
              {activeFocusMode && <View style={styles.focusActiveDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
            onPress={() => setActiveTab('chats')}>
            <FontAwesome
              name="comments"
              size={20}
              color={activeTab === 'chats' ? '#1c7a76' : '#8e8e93'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'chats' && styles.activeTabText,
              ]}>
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calls' && styles.activeTab]}
            onPress={() => setActiveTab('calls')}>
            <FontAwesome
              name="phone"
              size={20}
              color={activeTab === 'calls' ? '#1c7a76' : '#8e8e93'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'calls' && styles.activeTabText,
              ]}>
              Calls
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={conversations} 
          renderItem={renderChatItem}
          keyExtractor={item => item._id}
          style={styles.chatList}
          refreshing={loading}
          onRefresh={fetchConversations}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setContactListVisible(true)}>
          <LinearGradient
            colors={['#24b5b0', '#1c7a76']}
            style={styles.fabGradient}>
            <FontAwesome name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Modal
          visible={contactListVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setContactListVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Contact</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setContactListVisible(false)}>
                  <FontAwesome name="times" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              {contactLoading ? (
                <ActivityIndicator size="large" color="#1c7a76" />
              ) : (
                <FlatList
                  data={contacts}
                  renderItem={renderContactItem}
                  keyExtractor={item => item.id}
                  style={styles.contactList}
                />
              )}
            </View>
          </View>
        </Modal>

        <Modal
          visible={focusModeVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFocusModeVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Focus Mode</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setFocusModeVisible(false)}>
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
                onPress={() => setFocusModeVisible(false)}>
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
    transform: [{translateY: -12}],
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1c7a76',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactNumber: {
    color: '#8e8e93',
    fontSize: 14,
  },
});
