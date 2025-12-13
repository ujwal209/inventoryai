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
import { Plus, X, MessageSquare, Users, Search, ArrowLeft, Info, ShoppingBag, Store, Phone, MapPin, Calendar, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { getStreamToken } from '@/actions/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY || 'your_stream_api_key';
const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface VendorChatProps {
  user: any;
  dealers?: any[];
  initialChatDealer?: any;
}

export default function VendorChat({ user, dealers = [], initialChatDealer }: VendorChatProps) {
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
        <div className="h-[600px] flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
          <LoadingIndicator />
          <p className="mt-4 animate-pulse">Initializing Secure Chat...</p>
        </div>
      );
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <Chat client={client} theme={theme}>
        <ChatInterface user={user} dealers={dealers} initialChatDealer={initialChatDealer} />
      </Chat>
    </div>
  );
}

// Custom Header Component using ChannelContext for reactivity
const CustomChatHeader = ({ user, dealers, onInfoClick, setMobileView, activeTab }: any) => {
  const { channel } = useChannelStateContext();
  
  const otherMember = Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid);
  const dealerInfo = dealers.find((d: any) => d.uid === otherMember?.user?.id || d.id === otherMember?.user?.id);
  
  const headerTitle = dealerInfo?.business_details?.name || dealerInfo?.name || otherMember?.user?.name || channel.data?.name || "Chat";
  const headerImage = dealerInfo?.business_details?.logoUrl || dealerInfo?.image || otherMember?.user?.image || channel.data?.image;
  const isDealer = !!dealerInfo;

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
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              {headerImage ? <img src={headerImage} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full font-bold">{headerTitle?.charAt(0)}</div>}
            </div>
            <div>
               <h3 className="font-bold text-slate-900 dark:text-white">{headerTitle}</h3>
               <p className="text-xs text-green-500 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
               </p>
            </div>
         </div>
      </div>
      
      {isDealer && (
          <div>
               <button 
                  onClick={() => onInfoClick(dealerInfo)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                  title="View Dealer Details"
               >
                  <Info className="w-5 h-5" />
               </button>
          </div>
      )}
    </div>
  );
};


function ChatInterface({ user, dealers, initialChatDealer }: any) {
  const { client, setActiveChannel, channel: activeChannel } = useChatContext();
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showContacts, setShowContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'customers' | 'dealers'>('customers'); 

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
      created_by: { id: user.uid }
    });


    await channel.watch();
    setActiveChannel(channel);
    setMobileView('chat');
    setShowContacts(false);
  };

  // Filter Logic Helper
  const isDealerChannel = (channel: Channel) => {
      const otherMember = Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid);
      const otherId = otherMember?.user?.id;
      return dealers.some((d: any) => d.uid === otherId || d.id === otherId);
  };

  const channelRenderFilterFn = (channels: Channel[]) => {
      return channels.filter((channel) => {
          const isDealer = isDealerChannel(channel);
          return activeTab === 'dealers' ? isDealer : !isDealer;
      });
  };

  const filteredDealers = dealers.filter((d: any) => {
    const nameMatch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      d.business_details?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = d.business_details?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || locationMatch;
  });

  const CustomChannelPreview = (props: any) => {
    const { channel, setActiveChannel } = props;
    const { channel: activeChannel } = useChatContext();
    
    const isSelected = channel.id === activeChannel?.id;
    const otherMember = Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid);
    const dealerInfo = dealers.find((d: any) => d.uid === otherMember?.user?.id || d.id === otherMember?.user?.id);
    
    // Priority: Dealer List Details -> Stream User Name -> Channel Name -> Fallback
    const displayTitle = dealerInfo?.business_details?.name || dealerInfo?.name || otherMember?.user?.name || channel.data?.name || "User";
    const displayImage = dealerInfo?.business_details?.logoUrl || dealerInfo?.image || otherMember?.user?.image || channel.data?.image;

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
        <div className="flex flex-col border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 backdrop-blur-md">
            <div className="p-4 flex items-center justify-between">
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
            
            {/* Tabs */}
            <div className="flex px-4 pb-2 gap-2">
                <button 
                    onClick={() => setActiveTab('customers')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Customers
                </button>
                <button 
                    onClick={() => setActiveTab('dealers')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${activeTab === 'dealers' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                >
                    <Store className="w-4 h-4" />
                    Dealers
                </button>
            </div>

            {/* Search (if contacts shown) */}
            {showContacts && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Search dealers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                   </div>
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
               channelRenderFilterFn={channelRenderFilterFn} // Apply Filter Logic for Tabs
               Preview={CustomChannelPreview}
               EmptyStateIndicator={() => (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                       <MessageSquare className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium text-slate-600 dark:text-slate-300">No {activeTab} messages</p>
                    <p className="text-sm mt-1 mb-4">
                        {activeTab === 'dealers' ? "Connect with your dealers about stock." : "Check order queries from customers."}
                    </p>
                    {activeTab === 'dealers' && (
                        <button 
                        onClick={() => setShowContacts(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                        Start Dealer Chat
                        </button>
                    )}
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
        {activeChannel ? (
            <Channel>
              <Window>
                <CustomChatHeader 
                   user={user} 
                   dealers={dealers} 
                   onInfoClick={setSelectedDealer} 
                   setMobileView={setMobileView}
                   activeTab={activeTab}
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
              <div className="w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-blue-300" />
              </div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Select a conversation</p>
              <p className="text-sm">Choose a channel from the list to start chatting.</p>
          </div>
        )}
      </div>

      {/* Dealer Detail Modal */}
      <Dialog open={!!selectedDealer} onOpenChange={() => setSelectedDealer(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedDealer?.business_details?.name || selectedDealer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Banner & Logo */}
            <div className="relative h-32 bg-slate-100 rounded-xl overflow-hidden">
              {selectedDealer?.business_details?.bannerUrl && (
                <img src={selectedDealer.business_details.bannerUrl} className="w-full h-full object-cover" />
              )}
              <div className="absolute -bottom-6 left-4 border-4 border-white dark:border-slate-900 rounded-full overflow-hidden w-20 h-20 bg-slate-200">
                {selectedDealer?.business_details?.logoUrl ? (
                   <img src={selectedDealer.business_details.logoUrl} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-2xl bg-slate-300">
                      {(selectedDealer?.business_details?.name || selectedDealer?.name || 'U').charAt(0)}
                   </div>
                )}
              </div>
            </div>
            
            <div className="pt-8 space-y-4">
               <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span>{selectedDealer?.business_details?.address || "No address provided"}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Phone className="w-5 h-5 text-green-500" />
                  <span>{selectedDealer?.business_details?.phone || selectedDealer?.phone || "No phone provided"}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Mail className="w-5 h-5 text-orange-500" />
                  <span>{selectedDealer?.email}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span>
                     {selectedDealer?.business_details?.opensAt && selectedDealer?.business_details?.closesAt 
                       ? `${selectedDealer.business_details.opensAt} - ${selectedDealer.business_details.closesAt}`
                       : "Hours not specified"}
                  </span>
               </div>
            </div>
            
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedDealer?.role || "User"}
              </span>
              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedDealer?.status || "Active"}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
