'use client';

import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, Window, ChannelHeader, MessageList, MessageInput, Thread, LoadingIndicator } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { X } from 'lucide-react';

// You would typically get this from your env vars
const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY || 'your_stream_api_key';

interface ChatWindowProps {
  user: any;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

import { getStreamToken } from '@/actions/chat';

// ... imports

export default function ChatWindow({ user, vendorId, vendorName, onClose }: ChatWindowProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const initChat = async () => {
      const chatClient = StreamChat.getInstance(API_KEY);

      try {
        const token = await getStreamToken();
        
        await chatClient.connectUser(
          { id: user.uid, name: user.email?.split('@')[0] || 'User' },
          token
        );

        const channel = chatClient.channel('messaging', {
          members: [user.uid, vendorId],
          name: `Chat with ${vendorName}`,
        });

        await channel.watch();
        setChannel(channel);
        setClient(chatClient);
      } catch (error) {
        console.error("Chat connection failed", error);
      }
    };

    initChat();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [user, vendorId, vendorName]);

  if (!client || !channel) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex items-center justify-center z-50">
        <div className="text-center p-4">
           <LoadingIndicator />
           <p className="text-xs text-slate-500 mt-2">Connecting to chat...</p>
           <p className="text-[10px] text-slate-400 mt-1">(Requires Stream API Key & Dev Token enabled)</p>
           <button onClick={onClose} className="mt-4 text-sm text-slate-600 hover:underline">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col">
      <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
        <span className="font-bold">Chat with {vendorName}</span>
        <button onClick={onClose}><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Chat client={client} theme="messaging light">
          <Channel channel={channel}>
            <Window>
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}
