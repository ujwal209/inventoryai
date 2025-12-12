'use client';

import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { 
  Chat, 
  Channel, 
  Window, 
  ChannelHeader, 
  MessageList, 
  MessageInput, 
  Thread, 
  LoadingIndicator, 
  ChannelList,
  useChatContext
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { Plus, X, MessageSquare, Users, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { getStreamToken } from '@/actions/chat';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY || 'your_stream_api_key';

interface VendorChatProps {
  user: any;
  dealers?: any[];
  initialChatDealer?: any;
}

export default function VendorChat({ user, dealers = [], initialChatDealer }: VendorChatProps) {
  const [client, setClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const initChat = async () => {
      const chatClient = StreamChat.getInstance(API_KEY);

      try {
        const token = await getStreamToken();
        
        await chatClient.connectUser(
          { 
            id: user.uid, 
            name: user.business_details?.name || user.email,
            image: user.business_details?.logoUrl || user.business_details?.bannerUrl
          },
          token
        );

        setClient(chatClient);
      } catch (error) {
        console.error("Chat connection failed", error);
        toast.error("Failed to connect to chat");
      }
    };

    if (!client) initChat();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [user]);

  if (!client) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
        <LoadingIndicator />
        <p className="mt-4 animate-pulse">Initializing Secure Chat...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <Chat client={client} theme="str-chat__theme-dark">
        <ChatInterface user={user} dealers={dealers} initialChatDealer={initialChatDealer} />
      </Chat>
    </div>
  );
}

function ChatInterface({ user, dealers, initialChatDealer }: any) {
  const { client, setActiveChannel } = useChatContext();
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showContacts, setShowContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filters = { type: 'messaging', members: { $in: [user.uid] } };
  const sort = { last_message_at: -1 };

  useEffect(() => {
    if (initialChatDealer && client) {
      startChat(initialChatDealer);
    }
  }, [initialChatDealer, client]);

  const startChat = async (dealer: any) => {
    const channel = client.channel('messaging', {
      members: [user.uid, dealer.id],
      name: dealer.name, // Channel name
      image: dealer.image,
      created_by: { id: user.uid }
    });

    await channel.watch();
    setActiveChannel(channel);
    setMobileView('chat');
    setShowContacts(false);
  };

  const filteredDealers = dealers.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CustomChannelPreview = (props: any) => {
    const { channel, setActiveChannel } = props;
    const { channel: activeChannel } = useChatContext();
    
    const isSelected = channel.id === activeChannel?.id;
    // Basic fallback logic for display name if it's a 1-on-1 chat
    const displayTitle = channel.data.name || Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid)?.user?.name || "Commerical Dealer";
    const displayImage = channel.data.image || Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid)?.user?.image;
    const unreadCount = channel.countUnread();
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  
    return (
      <button 
        onClick={() => {
          setActiveChannel(channel);
          setMobileView('chat');
        }}
        className={`w-full p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 transition-all text-left group ${
          isSelected ? 'bg-blue-50 dark:bg-slate-800' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden">
            {displayImage ? <img src={displayImage} className="w-full h-full object-cover" /> : displayTitle.charAt(0)}
          </div>
          {channel.state.watcher_count > 1 && (
             <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <span className={`font-bold truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-gray-200'}`}>
              {displayTitle}
            </span>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-blue-500/20">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
            {lastMessage?.text || 'Start a conversation'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-full relative">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 absolute md:relative inset-0 z-20 transition-transform duration-300 ${
        mobileView === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Messages
            </h2>
            <button 
              onClick={() => setShowContacts(!showContacts)}
              className={`p-2 rounded-xl transition-all ${showContacts ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm'}`}
            >
              {showContacts ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
          
          {showContacts && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="Search dealers..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 autoFocus
               />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {showContacts ? (
             <div className="p-3 space-y-2">
               <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Select a Dealer</div>
               {filteredDealers.length === 0 ? (
                 <div className="text-center py-8 text-slate-500">
                    <p>No dealers found.</p>
                 </div>
               ) : (
                 filteredDealers.map((dealer: any) => (
                   <div 
                     key={dealer.id}
                     onClick={() => startChat(dealer)}
                     className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                   >
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                         {dealer.image ? <img src={dealer.image} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500">{dealer.name.charAt(0)}</span>}
                      </div>
                      <div>
                         <p className="font-bold text-slate-900 dark:text-white text-sm">{dealer.name}</p>
                         <p className="text-xs text-slate-500 truncate max-w-[180px]">{dealer.location}</p>
                      </div>
                   </div>
                 ))
               )}
             </div>
           ) : (
             <ChannelList 
               filters={filters} 
               sort={sort as any}
               Preview={CustomChannelPreview}
               EmptyStateIndicator={() => (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                       <MessageSquare className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
                    <p className="text-sm mt-1 mb-4">Start a conversation with your network.</p>
                    <button 
                      onClick={() => setShowContacts(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Start New Chat
                    </button>
                 </div>
               )}
             />
           )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 bg-gray-50 dark:bg-slate-950 flex flex-col absolute md:relative inset-0 z-30 transition-transform duration-300 ${
        mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        <Channel>
          <Window>
            <div className="md:hidden p-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 sticky top-0 z-10">
              <button 
                onClick={() => setMobileView('list')}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-900 dark:text-white">Chat</span>
            </div>
            <div className="flex-1 flex flex-col h-full">
               <ChannelHeader />
               <MessageList />
               <MessageInput focus />
            </div>
          </Window>
          <Thread />
        </Channel>
      </div>
    </div>
  );
}
