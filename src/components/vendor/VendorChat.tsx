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
import { MessageSquare, Users } from 'lucide-react';

import { getStreamToken } from '@/actions/chat';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY || 'your_stream_api_key';

interface VendorChatProps {
  user: any;
}

const CustomChannelPreview = (props: any) => {
  const { channel, setActiveChannel } = props;
  const { channel: activeChannel } = useChatContext();
  
  const isSelected = channel.id === activeChannel?.id;
  const unreadCount = channel.countUnread();
  const lastMessage = channel.state.messages[channel.state.messages.length - 1];

  return (
    <button 
      onClick={() => setActiveChannel(channel)}
      className={`w-full p-4 flex items-center gap-3 border-b border-slate-800 transition-colors text-left ${
        isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/50'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
        {channel.data?.name?.charAt(0) || 'C'}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
            {channel.data?.name || 'Customer'}
          </span>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate">
          {lastMessage?.text || 'No messages yet'}
        </p>
      </div>
    </button>
  );
};

export default function VendorChat({ user }: VendorChatProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    const initChat = async () => {
      const chatClient = StreamChat.getInstance(API_KEY);

      try {
        const token = await getStreamToken();
        
        await chatClient.connectUser(
          { 
            id: user.uid, 
            name: user.business_details?.name || user.email,
            image: user.business_details?.bannerUrl
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
  }, [user]);

  if (!client) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center text-slate-500">
        <LoadingIndicator />
        <p className="mt-4">Connecting to chat server...</p>
      </div>
    );
  }

  const filters = { type: 'messaging', members: { $in: [user.uid] } };
  const sort = { last_message_at: -1 };

  const CustomChannelPreview = (props: any) => {
    const { channel, setActiveChannel } = props;
    const { channel: activeChannel } = useChatContext();
    
    const isSelected = channel.id === activeChannel?.id;
    const unreadCount = channel.countUnread();
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  
    return (
      <button 
        onClick={() => {
          setActiveChannel(channel);
          setMobileView('chat');
        }}
        className={`w-full p-4 flex items-center gap-3 border-b border-slate-800 transition-colors text-left ${
          isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/50'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
          {channel.data?.name?.charAt(0) || 'C'}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
              {channel.data?.name || 'Customer'}
            </span>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">
            {lastMessage?.text || 'No messages yet'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex relative">
      <Chat client={client} theme="str-chat__theme-dark">
        <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900 absolute md:relative inset-0 z-10 transition-transform duration-300 ${
          mobileView === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Messages
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ChannelList 
              filters={filters} 
              sort={sort as any}
              Preview={CustomChannelPreview}
              EmptyStateIndicator={() => (
                <div className="p-8 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No active conversations.</p>
                </div>
              )}
            />
          </div>
        </div>
        
        <div className={`flex-1 bg-slate-950 flex flex-col absolute md:relative inset-0 z-0 md:z-auto transition-transform duration-300 ${
          mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}>
          <Channel>
            <Window>
              <div className="md:hidden p-2 bg-slate-900 border-b border-slate-800 flex items-center">
                <button 
                  onClick={() => setMobileView('list')}
                  className="text-slate-400 hover:text-white px-2 py-1 text-sm font-medium"
                >
                  ← Back
                </button>
              </div>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </div>
      </Chat>
    </div>
  );
}
