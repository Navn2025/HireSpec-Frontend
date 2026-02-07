import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import io from 'socket.io-client';
import {RobotIcon, UserIcon, TrashIcon, SendIcon, LoadingIcon, WaveIcon, ArrowLeftIcon, MenuIcon} from '../components/Icons';
import './AxiomChat.css';

const BACKEND_URL='http://localhost:8080';

function AxiomChat()
{
    const [socket, setSocket]=useState(null);
    const [chats, setChats]=useState([]);
    const [currentChat, setCurrentChat]=useState(null);
    const [messages, setMessages]=useState([]);
    const [inputMessage, setInputMessage]=useState('');
    const [loading, setLoading]=useState(false);
    const [userId]=useState(`user_${Date.now()}`);
    const [sidebarOpen, setSidebarOpen]=useState(false);
    const messagesEndRef=useRef(null);
    const navigate=useNavigate();

    useEffect(() =>
    {
        // Initialize socket
        const newSocket=io(BACKEND_URL, {
            withCredentials: true
        });

        newSocket.on('connect', () =>
        {
            console.log('Connected to Axiom AI');
        });

        newSocket.on('ai-response', (data) =>
        {
            console.log('AI Response:', data);
            setMessages(prev => [...prev, {
                role: 'model',
                content: data.content,
                timestamp: data.timestamp
            }]);
            setLoading(false);
        });

        newSocket.on('ai-error', (error) =>
        {
            console.error('AI Error:', error);
            setLoading(false);
            alert('Error: '+error.error);
        });

        setSocket(newSocket);

        // Load chats
        loadChats();

        return () => newSocket.close();
    }, []);

    useEffect(() =>
    {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom=() =>
    {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    const loadChats=async () =>
    {
        try
        {
            const response=await fetch(`${BACKEND_URL}/api/axiom/chats?userId=${userId}`);
            const data=await response.json();
            setChats(data.chats||[]);
        } catch (error)
        {
            console.error('Error loading chats:', error);
        }
    };

    const createNewChat=async () =>
    {
        try
        {
            const response=await fetch(`${BACKEND_URL}/api/axiom/chats`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    title: 'New Chat',
                    userId
                })
            });

            const data=await response.json();
            setChats(prev => [data.chat, ...prev]);
            setCurrentChat(data.chat);
            setMessages([]);
        } catch (error)
        {
            console.error('Error creating chat:', error);
        }
    };

    const selectChat=async (chat) =>
    {
        setCurrentChat(chat);
        setSidebarOpen(false); // Close sidebar on mobile after selecting

        try
        {
            const response=await fetch(`${BACKEND_URL}/api/axiom/chats/${chat.id}/messages`);
            const data=await response.json();
            setMessages(data.messages||[]);
        } catch (error)
        {
            console.error('Error loading messages:', error);
        }
    };

    const sendMessage=() =>
    {
        if (!inputMessage.trim()||!currentChat||!socket) return;

        const userMessage={
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        socket.emit('ai-message', {
            chatId: currentChat.id,
            content: inputMessage,
            userId
        });

        setInputMessage('');
    };

    const handleKeyDown=(e) =>
    {
        if (e.key==='Enter'&&!e.shiftKey)
        {
            e.preventDefault();
            sendMessage();
        }
    };

    const deleteChat=async (chatId, e) =>
    {
        e.stopPropagation();

        if (!confirm('Delete this chat?')) return;

        try
        {
            await fetch(`${BACKEND_URL}/api/axiom/chats/${chatId}`, {
                method: 'DELETE'
            });

            setChats(prev => prev.filter(c => c.id!==chatId));

            if (currentChat?.id===chatId)
            {
                setCurrentChat(null);
                setMessages([]);
            }
        } catch (error)
        {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <div className="axiom-chat">
            {/* Navbar */}
            <nav className="axiom-navbar">
                <div className="axiom-navbar-content">
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mobile-menu-btn">
                            <MenuIcon size={20} />
                        </button>
                        <button onClick={() => navigate('/')} className="back-button">
                            <ArrowLeftIcon size={16} /> Back
                        </button>
                    </div>
                    <h1 className="axiom-logo"><RobotIcon size={24} /> Axiom AI Chat</h1>
                    <div className="nav-actions">
                        <span className="user-id">User: {userId.substring(0, 12)}...</span>
                    </div>
                </div>
            </nav>

            <div className="axiom-container">
                {/* Mobile sidebar overlay */}
                <div
                    className={`sidebar-overlay ${sidebarOpen? 'open':''}`}
                    onClick={() => setSidebarOpen(false)}
                />

                {/* Sidebar */}
                <div className={`axiom-sidebar ${sidebarOpen? 'open':''}`}>
                    <button onClick={createNewChat} className="new-chat-btn">
                        + New Chat
                    </button>

                    <div className="chats-list">
                        {chats.map(chat => (
                            <div
                                key={chat.id}
                                className={`chat-item ${currentChat?.id===chat.id? 'active':''}`}
                                onClick={() => selectChat(chat)}
                            >
                                <div className="chat-item-content">
                                    <span className="chat-title">{chat.title}</span>
                                    <button
                                        onClick={(e) => deleteChat(chat.id, e)}
                                        className="delete-chat-btn"
                                        title="Delete chat"
                                    >
                                        <TrashIcon size={14} />
                                    </button>
                                </div>
                                <span className="chat-date">
                                    {new Date(chat.lastActivity).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="axiom-chat-area">
                    {currentChat? (
                        <>
                            <div className="messages-container">
                                {messages.length===0? (
                                    <div className="empty-chat">
                                        <h2><WaveIcon size={24} /> Hello! I'm Aurora</h2>
                                        <p>How can I help you today?</p>
                                    </div>
                                ):messages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.role}`}>
                                        <div className="message-avatar">
                                            {msg.role==='user'? <UserIcon size={18} />:<RobotIcon size={18} />}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-text">{msg.content}</div>
                                            <div className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading&&(
                                    <div className="message model">
                                        <div className="message-avatar"><RobotIcon size={18} /></div>
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="input-area">
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message..."
                                    rows="1"
                                    disabled={loading}
                                    autoFocus
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputMessage.trim()||loading}
                                    className="send-btn"
                                >
                                    {loading? <LoadingIcon size={18} />:<SendIcon size={18} />}
                                </button>
                            </div>
                        </>
                    ):(
                        <div className="no-chat-selected">
                            <h2>Select a chat or create a new one</h2>
                            <button onClick={createNewChat} className="create-first-chat-btn">
                                Start Chatting
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AxiomChat;
