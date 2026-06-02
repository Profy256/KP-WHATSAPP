"use client";

import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, User, Bot, Zap, Send, PauseCircle, PlayCircle } from 'lucide-react';
import api from '../../../lib/api';

interface MessageLog {
  id: string;
  remoteJid: string;
  direction: 'INCOMING' | 'OUTGOING';
  content: string;
  source: 'CUSTOMER' | 'AI' | 'RULE' | 'SYSTEM';
  createdAt: string;
}

interface Contact {
  remoteJid: string;
  isAiPaused: boolean;
}

export default function ConversationLogs() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, contactsRes] = await Promise.all([
        api.get('/logs'),
        api.get('/contacts')
      ]);
      setLogs(logsRes.data);
      setContacts(contactsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePause = async (remoteJid: string, currentStatus: boolean) => {
    try {
      await api.post('/contacts/pause', { remoteJid, isAiPaused: !currentStatus });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (remoteJid: string) => {
    const text = replyText[remoteJid];
    if (!text || text.trim() === '') return;

    setSending(true);
    try {
      await api.post('/whatsapp/send', { remoteJid, text });
      setReplyText({ ...replyText, [remoteJid]: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading && logs.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader2 className="animate-spin" /></div>;
  }

  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.remoteJid]) acc[log.remoteJid] = [];
    acc[log.remoteJid].push(log);
    return acc;
  }, {} as Record<string, MessageLog[]>);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'AI': return <Bot size={14} color="var(--accent-primary)" />;
      case 'RULE': return <Zap size={14} color="var(--warning)" />;
      case 'SYSTEM': return <User size={14} color="var(--success)" />;
      default: return <User size={14} color="var(--text-secondary)" />;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageSquare size={32} color="var(--accent-primary)" />
          Live Chat (Inbox)
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Read transcripts, pause the AI, and reply manually.</p>
      </div>

      {Object.keys(groupedLogs).length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No conversations found yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(groupedLogs).map(([jid, messages]) => {
            const contact = contacts.find(c => c.remoteJid === jid);
            const isPaused = contact?.isAiPaused || false;

            return (
              <div key={jid} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {jid.split('@')[0]}
                  </div>
                  <button 
                    onClick={() => togglePause(jid, isPaused)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', 
                      padding: '6px 12px', borderRadius: 'var(--radius-sm)', 
                      background: isPaused ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: isPaused ? 'var(--success)' : 'var(--error)',
                      fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    {isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                    {isPaused ? 'Resume AI' : 'Pause AI'}
                  </button>
                </div>
                
                {/* Messages Area */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: msg.direction === 'INCOMING' ? 'flex-start' : 'flex-end' 
                    }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '12px 16px', 
                        borderRadius: 'var(--radius-md)', 
                        background: msg.direction === 'INCOMING' ? 'var(--bg-tertiary)' : 'rgba(37, 211, 102, 0.1)',
                        border: `1px solid ${msg.direction === 'INCOMING' ? 'var(--border-color)' : 'rgba(37, 211, 102, 0.2)'}`,
                        color: msg.direction === 'INCOMING' ? 'var(--text-primary)' : 'var(--text-primary)'
                      }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.content}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {msg.direction === 'OUTGOING' && getSourceIcon(msg.source)}
                          {msg.direction === 'OUTGOING' ? msg.source : 'Customer'} • {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                  <input 
                    type="text"
                    placeholder={isPaused ? "Type a manual reply..." : "Pause AI to reply manually..."}
                    value={replyText[jid] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [jid]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(jid)}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button 
                    onClick={() => handleSend(jid)}
                    disabled={sending || (!isPaused && (!replyText[jid] || replyText[jid].trim() === ''))}
                    style={{ 
                      padding: '0 20px', borderRadius: 'var(--radius-md)', 
                      background: 'var(--accent-primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: sending ? 0.7 : 1
                    }}
                  >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
