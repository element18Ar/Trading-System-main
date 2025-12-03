import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, CornerLeftUp, CheckCircle, XCircle } from 'lucide-react';
import { getTradeDetails, updateTradeStatus } from "../api/tradeApi.js";
import { getMessages, sendMessage, markMessagesRead } from "../api/messageApi.js";

// --- 🎨 STYLE CONSTANTS ---
const COLOR_ACCENT = "#00BFA5";
const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_CARD_BG = "#3E3F3F";
const COLOR_TEXT_LIGHT = "white";

export default function TradeDetail({ tradeId, onBack }) {
    const userId = localStorage.getItem("userId"); 
    const [trade, setTrade] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // --- FETCH DATA ---
    const fetchTradeAndMessages = useCallback(async () => {
        try {
            setLoading(true);
            const tradeRes = await getTradeDetails(tradeId);
            setTrade(tradeRes.data);

            const messagesRes = await getMessages(tradeId);
            setMessages(messagesRes.data);
            try { await markMessagesRead(tradeId); } catch (e) { console.error(e); }
        } catch (error) {
            console.error("Error fetching trade data:", error);
            setTrade(null);
        } finally {
            setLoading(false);
        }
    }, [tradeId]);

    useEffect(() => {
        fetchTradeAndMessages();
    }, [fetchTradeAndMessages]);

    useEffect(() => {
        // Scroll to the bottom of the messages list when messages update
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // --- CHAT LOGIC ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !trade) return;

        try {
            const res = await sendMessage({
                tradeId: trade._id,
                sender: userId,
                content: newMessage.trim(),
                type: 'text',
            });

            const sentMessage = res.data;
            // Since the backend populates sender, we need to manually add the username/avatar for immediate display
            const senderUser = trade.initiator._id === userId ? trade.initiator : trade.receiver;
            const tempMessage = { 
                ...sentMessage, 
                sender: { _id: userId, username: senderUser.username },
                createdAt: new Date().toISOString() // Placeholder
            };
            
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
            
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message.');
        }
    };
    
    // --- TRADE ACTION LOGIC ---
    const handleTradeAction = async (status) => {
        if (!window.confirm(`Are you sure you want to set status to ${status}?`)) return;

        try {
            const res = await updateTradeStatus(tradeId, { status });
            const updatedTrade = res.data;
            setTrade(updatedTrade);
            alert(`Trade status successfully updated to ${status}.`);

            // Re-fetch messages to show the system update
            fetchTradeAndMessages(); 

        } catch (error) {
            console.error('Error updating trade status:', error);
            alert(`Failed to update trade status to ${status}.`);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading trade details...</div>;
    if (!trade) return <div style={{ padding: '2rem' }}>Could not load trade.</div>;

    const isReceiver = String(trade.receiver._id) === String(userId);
    const partner = isReceiver ? trade.initiator : trade.receiver;
    const canAccept = isReceiver && ['proposed', 'negotiating'].includes(trade.status);
    const isFinished = ['accepted', 'rejected', 'completed', 'cancelled'].includes(trade.status);

    return (
        <div style={{ padding: "2rem", display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
            <button 
                onClick={onBack} 
                style={{ 
                    background: 'none', border: 'none', color: COLOR_ACCENT, 
                    cursor: 'pointer', textAlign: 'left', marginBottom: '1rem', padding: 0 
                }}
            >
                <CornerLeftUp size={20} style={{ verticalAlign: 'middle' }} /> Back to Inbox
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '999px', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {partner.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                    <h2 style={{ margin: 0, marginBottom: '0.15rem' }}>Negotiation with {partner.username}</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                        Trade status: <span style={{ fontWeight: 'bold', color: trade.status === 'accepted' ? '#22c55e' : COLOR_ACCENT }}>{trade.status.toUpperCase()}</span>
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flexGrow: 1, minHeight: '500px' }}>

                {/* --- Left Panel: Offer Details --- */}
                <div style={{ background: COLOR_PRIMARY_DARK, padding: '1.5rem', borderRadius: '12px', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0 }}>Trade Offer</h3>
                    {trade.item && (
                        <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: '#111827' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>Main item:</p>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{trade.item.name}</p>
                        </div>
                    )}
                    <p style={{ opacity: 0.8, borderBottom: '1px solid #444', paddingBottom: '0.5rem', fontSize: '0.85rem' }}>
                        This section summarizes what each side is offering in the trade.
                    </p>

                    {/* Initiator Offer */}
                    <h4 style={{ color: COLOR_ACCENT, marginTop: '1rem' }}>{trade.initiator.username}'s Offer:</h4>
                    {trade.initiatorItems.map(item => <p key={item._id} style={{ margin: '0.5rem 0', paddingLeft: '10px' }}>- {item.name}</p>)}
                    
                    {/* Receiver Offer (Items being requested) */}
                    <h4 style={{ color: COLOR_ACCENT, marginTop: '1rem' }}>{trade.receiver.username}'s Offer (Requested Items):</h4>
                    {trade.receiverItems.map(item => <p key={item._id} style={{ margin: '0.5rem 0', paddingLeft: '10px' }}>- {item.name}</p>)}

                    {/* Cash Offer */}
                    <h4 style={{ marginTop: '1.5rem' }}>Cash Supplement:</h4>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {trade.cashOffer.amount > 0 ? `${trade.cashOffer.currency.toUpperCase()} ${trade.cashOffer.amount}` : "None"}
                    </p>

                    {/* Trade Actions */}
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {canAccept && (
                            <>
                                <button 
                                    onClick={() => handleTradeAction('accepted')}
                                    style={{ padding: '0.8rem', background: 'green', color: COLOR_TEXT_LIGHT, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> ACCEPT OFFER
                                </button>
                                <button 
                                    onClick={() => handleTradeAction('rejected')}
                                    style={{ padding: '0.8rem', background: 'red', color: COLOR_TEXT_LIGHT, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    <XCircle size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> REJECT OFFER
                                </button>
                            </>
                        )}
                        {!isFinished && (
                            <button 
                                onClick={() => handleTradeAction('cancelled')}
                                style={{ padding: '0.8rem', background: 'darkgray', color: COLOR_PRIMARY_DARK, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Cancel Trade
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Right Panel: Chat Messages --- */}
                <div style={{ background: COLOR_PRIMARY_DARK, borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Message History */}
                    <div style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto', borderBottom: `1px solid ${COLOR_CARD_BG}` }}>
                        {messages.map((msg, index) => {
                            const isSender = msg.sender._id === userId;
                            const isSystem = msg.type === 'system';
                            
                            // Message bubble styles
                            const bubbleStyle = isSystem ? { 
                                textAlign: 'center', opacity: 0.7, fontStyle: 'italic', fontSize: '0.9rem', margin: '10px 0' 
                            } : {
                                maxWidth: '70%',
                                padding: '10px',
                                borderRadius: '15px',
                                margin: '5px 0',
                                alignSelf: isSender ? 'flex-end' : 'flex-start',
                                background: isSender ? COLOR_ACCENT : COLOR_CARD_BG,
                                color: isSender ? COLOR_PRIMARY_DARK : COLOR_TEXT_LIGHT,
                            };
                            
                            return (
                                <div key={index} style={bubbleStyle}>
                                    {isSystem ? (
                                        <span>--- {msg.content} ---</span>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>
                                                {isSender ? 'You' : msg.sender.username}
                                            </div>
                                            <p style={{ margin: 0 }}>{msg.content}</p>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isFinished ? "Trade finalized. Chat is read-only." : "Type a message..."}
                            disabled={isFinished}
                            style={{
                                flexGrow: 1,
                                padding: '0.8rem',
                                background: COLOR_CARD_BG,
                                border: 'none',
                                borderRadius: '8px',
                                color: COLOR_TEXT_LIGHT,
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isFinished}
                            style={{
                                background: COLOR_ACCENT,
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                cursor: isFinished ? 'not-allowed' : 'pointer',
                                color: COLOR_PRIMARY_DARK,
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
