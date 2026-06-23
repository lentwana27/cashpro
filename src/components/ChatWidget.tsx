import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User as UserIcon, Circle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { api } from '../lib/api';
import { User, Message } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadUsersAndMessages = async () => {
      try {
        const [usrRes, msgRes] = await Promise.all([
          api.get('/users'),
          api.get(`/messages/${user.id}`)
        ]);

        setUsers(usrRes.filter((u: User) => {
          if (u.id === user.id || !u.active || u.role === 'ADMIN') return false;
          if (user.role === 'SUPERVISOR') {
            return u.role === 'ACCOUNTANT' || u.role === 'HEAD_ACCOUNTANT' || u.role === 'DIRECTOR';
          }
          return true;
        }));

        setMessages(msgRes);
      } catch (e) {
        console.error(e);
      }
    };
    
    loadUsersAndMessages();
    
    const interval = setInterval(loadUsersAndMessages, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const prevMessagesCount = useRef(0);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      if (!isOpen) {
        setHasUnread(true);
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setHasUnread(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!activeUser || !user || !messageText.trim()) return;
    try {
      const newMsg = await api.post('/messages', {
        fromId: user.id,
        toId: activeUser.id,
        content: messageText
      });
      setMessages([...messages, newMsg]);
      setMessageText('');
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || user.role === 'ADMIN') return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#112240] hover:bg-[#1a2d53] border border-[#1e345e] text-emerald-400 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-40"
      >
        <MessageCircle className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-[#112240] rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-[#0a192f] border border-[#1e345e] shadow-2xl rounded-2xl flex overflow-hidden z-50 flex-col md:flex-row"
          >
            {/* Thread List */}
            <div className={clsx("w-full md:w-1/3 bg-[#061121] border-r border-[#1e345e] flex flex-col", activeUser && "hidden md:flex")}>
              <div className="p-4 border-b border-[#1e345e] flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Directory</h3>
                <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {users.map(u => (
                  <button 
                    key={u.id} 
                    onClick={() => setActiveUser(u)}
                    className={clsx("w-full text-left p-3 hover:bg-[#112240] border-b border-[#112240] transition-colors flex items-center gap-3", activeUser?.id === u.id && "bg-[#112240]")}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[#1e345e] flex items-center justify-center text-white text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div className={clsx("absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#061121] rounded-full", u.isOnline ? "bg-emerald-500" : "bg-slate-500")} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-white truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={clsx("w-full md:w-2/3 flex flex-col bg-[#0a192f]", !activeUser && "hidden md:flex")}>
              {activeUser ? (
                <>
                  <div className="p-4 border-b border-[#1e345e] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveUser(null)} className="md:hidden text-slate-400 hover:text-white mr-2">
                         <X className="w-5 h-5"/>
                      </button>
                      <div className="text-sm">
                        <div className="font-bold text-white">{activeUser.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          {activeUser.isOnline ? (
                            <><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Online</>
                          ) : (
                            <>Last seen: {activeUser.lastSeen ? formatDistanceToNow(new Date(activeUser.lastSeen)) + ' ago' : 'Never'}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="hidden md:block text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.filter(m => (m.fromId === activeUser.id && m.toId === user.id) || (m.fromId === user.id && m.toId === activeUser.id)).map(m => {
                      const isMe = m.fromId === user.id;
                      return (
                        <div key={m.id} className={clsx("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                          <div className={clsx("px-3 py-2 rounded-2xl text-sm", isMe ? "bg-emerald-500 text-white rounded-br-sm" : "bg-[#112240] text-slate-200 rounded-bl-sm")}>
                            {m.content}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1">{formatDistanceToNow(new Date(m.createdAt))} ago</span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-[#1e345e] bg-[#061121]">
                    <div className="flex bg-[#112240] rounded-full overflow-hidden border border-[#1e345e] focus-within:border-emerald-500 transition-colors pl-4 pr-1 py-1">
                      <input 
                        type="text" 
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Message..." 
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-0"
                      />
                      <button onClick={handleSend} className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors flex-shrink-0">
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 relative">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Select a user to start messaging</p>
                  <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white hidden md:block">
                     <X className="w-5 h-5"/>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
