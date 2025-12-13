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
  useChatContext,
  useChannelStateContext
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { Plus, X, MessageSquare, Users, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

import { getStreamToken } from '@/actions/chat';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY || 'your_stream_api_key';
const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';


interface DealerChatProps {
  user: any;
  vendors?: any[];
}

export default function DealerChat({ user, vendors = [] }: DealerChatProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [theme, setTheme] = useState('messaging light');

  useEffect(() => {
    // Theme detection
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'str-chat__theme-dark' : 'str-chat__theme-light');
    };

    updateTheme(); // Initial check

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const initChat = async () => {
      if (!API_KEY) return;
      const chatClient = StreamChat.getInstance(API_KEY);

      try {
        const token = await getStreamToken();
        
        await chatClient.connectUser(
          { 
            id: user.uid, 
            name: user.business_details?.name || user.name || user.email,
            image: user.business_details?.logoUrl || user.image 
          },
          token
        );

        setClient(chatClient);
      } catch (error) {
        console.error("Chat connection failed", error);
      }
    };

    initChat();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [user.uid]);

  useEffect(() => {
    if (!client) return;

    const handleNewMessage = (event: any) => {
      if (event.type === 'message.new' && event.user?.id !== client.userID) {
        const audio = new Audio(SOUND_URL);
        audio.play().catch(e => console.log('Audio play failed', e));
      }
    };

    client.on('message.new', handleNewMessage);

    return () => {
      client.off('message.new', handleNewMessage);
    };
  }, [client]);


  if (!client) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center text-slate-500">
        <LoadingIndicator />
        <p className="mt-4">Connecting to secure chat...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative isolate">
       <Chat client={client} theme={theme}>
         <ChatInterface user={user} vendors={vendors} />
       </Chat>
    </div>

  );
}

// Custom Header for Dealer View
const CustomChatHeader = ({ user, vendors, setMobileView }: any) => {
  const { channel } = useChannelStateContext();
  
  const otherMember = Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid);
  const vendorInfo = vendors.find((v: any) => v.uid === otherMember?.user?.id || v.id === otherMember?.user?.id);
  
  const displayTitle = vendorInfo?.business_details?.name || vendorInfo?.name || otherMember?.user?.name || channel.data?.name || "Unknown";
  const displayImage = vendorInfo?.business_details?.logoUrl || vendorInfo?.image || otherMember?.user?.image || channel.data?.image;

  return (
     <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md justify-between">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setMobileView('list')}
             className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
           >
             <ArrowLeft className="w-5 h-5" />
           </button>
           
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                 <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden">
                    {displayImage ? (
                       <img src={displayImage} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{displayTitle?.charAt(0)}</div>
                    )}
                 </div>
              </div>

               <div>
                 <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                   {displayTitle}
                 </h3>
                 <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                 </p>
              </div>
           </div>
        </div>
     </div>
  );
};

function ChatInterface({ user, vendors }: { user: any, vendors: any[] }) {
  const { setActiveChannel, channel: activeChannel } = useChatContext();
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showContacts, setShowContacts] = useState(false);

  const { client } = useChatContext();

  const filters = { type: 'messaging', members: { $in: [user.uid] } };
  const sort = { last_message_at: -1 };

  
  const handleStartChat = async (vendor: any) => {
    if (!client) return;

    const channel = client.channel('messaging', {
      members: [user.uid, vendor.id],
    } as any);

    await channel.watch();

    setActiveChannel(channel);
    setShowContacts(false);
    setMobileView('chat');
  };

  const CustomChannelPreview = (props: any) => {
    const { channel, setActiveChannel } = props;
    const { channel: activeChannel } = useChatContext();

    const isSelected = channel.id === activeChannel?.id;
    const otherMember = Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid);
    const vendorInfo = vendors.find((v: any) => v.uid === otherMember?.user?.id || v.id === otherMember?.user?.id);

    // Dynamic Title based on Vendor List (Source of Truth)
    const displayTitle = vendorInfo?.business_details?.name || vendorInfo?.name || otherMember?.user?.name || channel.data?.name || 'Unknown';
    const displayImage = vendorInfo?.business_details?.logoUrl || vendorInfo?.image || otherMember?.user?.image || channel.data?.image;

    const unreadCount = channel.countUnread();
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  
    return (
      <button 
        onClick={() => {
          setActiveChannel(channel);
          setMobileView('chat');
        }}
        className={`w-full p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 transition-all text-left group ${
          isSelected ? 'bg-purple-50 dark:bg-slate-800/80 border-purple-100 dark:border-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            {displayImage ? (
                <img src={displayImage} className="w-full h-full rounded-full object-cover" />
            ) : (
                displayTitle.charAt(0) || 'U'
            )}
          </div>
          {channel.state.watcher_count > 0 && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-0.5">
            <span className={`font-semibold truncate ${isSelected ? 'text-purple-700 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
              {displayTitle}
            </span>
            <span className="text-[10px] text-slate-400">
               {lastMessage?.created_at ? new Date(lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-sm truncate pr-2 ${isSelected ? 'text-purple-600/70 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
              {lastMessage?.text || 'No messages yet'}
            </p>
            {unreadCount > 0 && (
              <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-full w-full">
        {/* Sidebar List */}
        <div className={`w-full md:w-80 border-r border-gray-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 absolute md:relative inset-0 z-20 transition-transform duration-300 ${
          mobileView === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          {/* List Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center h-16">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span>Messages</span>
            </h2>
            <button 
              onClick={() => setShowContacts(!showContacts)}
              className="w-8 h-8 flex items-center justify-center bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-slate-700 transition-colors"
            >
              {showContacts ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {showContacts ? (
               <div className="p-4 space-y-2 animate-in slide-in-from-left-4 duration-300">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Select Vendor</h3>
                 {vendors.length === 0 ? (
                   <p className="text-sm text-slate-500 px-2">No vendors found in your network.</p>
                 ) : (
                   vendors.map(vendor => (
                     <div 
                       key={vendor.id} 
                       onClick={() => handleStartChat(vendor)}
                       className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors group"
                     >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-transparent group-hover:border-purple-200 dark:group-hover:border-slate-700">
                          {vendor.image ? (
                             <img src={vendor.image} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold bg-slate-200 dark:bg-slate-700">{vendor.name.charAt(0)}</div>
                          )}
                        </div>
                        <div>
                           <p className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-purple-600 transition-colors">{vendor.name}</p>
                           <p className="text-xs text-slate-500">{vendor.location || 'Connected Vendor'}</p>
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
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64">
                      <div className="w-16 h-16 bg-purple-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-purple-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active conversations.</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Start chatting with your vendors!</p>
                      <button 
                        onClick={() => setShowContacts(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Start New Chat
                      </button>
                    </div>
                  )}
                />
             )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-950 absolute md:relative inset-0 z-30 md:z-auto transition-transform duration-300 ${
          mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}>
          {activeChannel ? (
             <Channel>
               <Window>
                 <CustomChatHeader 
                    user={user} 
                    vendors={vendors} 
                    setMobileView={setMobileView}
                 />
                 
                 <div className="flex-1 bg-gray-50/50 dark:bg-slate-950/50 relative">
                   <div className="absolute inset-0 overflow-hidden">
                     <MessageList />
                   </div>
                 </div>
                 
                 <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
                    <MessageInput focus />
                 </div>
               </Window>
               <Thread />
             </Channel>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-400 bg-gray-50/30 dark:bg-slate-900/30">
               <div className="w-24 h-24 bg-purple-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                 <MessageSquare className="w-10 h-10 text-purple-300" />
               </div>
               <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Select a conversation</p>
               <p className="text-sm">Choose a vendor from the list to start chatting.</p>
            </div>
          )}
        </div>
    </div>
  );
}
