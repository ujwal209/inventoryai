'use client';

import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, Window, ChannelHeader, MessageList, MessageInput, Thread, LoadingIndicator } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { X } from 'lucide-react';

// You would typically get this from your env vars
import { getStreamToken } from '@/actions/chat';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY || 'your_stream_api_key';
const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';


interface ChatWindowProps {
  user: any;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

// removed duplicate import
import { VoiceCallButton, VoiceCallManager } from '@/components/chat/VoiceCallManager';



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
          { 
            id: user.uid, 
            name: user.name || user.displayName || user.email?.split('@')[0] || 'User',
            image: user.image || user.photoURL
          },
          token
        );


        const channel = chatClient.channel('messaging', {
          members: [user.uid, vendorId],
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
        <span className="font-bold">
          {channel?.state?.members ? Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid)?.user?.name : vendorName}
        </span>
        <div className="flex items-center gap-2">
            {/* The button needs to be inside Channel, but here we are outside. We can't put it here easily without restructuring. 
                Wait, ChatWindow setup is: Chat -> Channel -> Window. 
                The header is OUTSIDE the Channel component in current code?
                Line 96: <div className="bg-slate-900... header
                Line 104: <Chat ...> <Channel ...>
                So VoiceCallButton will fail if outside.
                
                Workaround: We'll put the button INSIDE the Window or move Channel up.
                Moving Channel up is risky for layout. 
                Best approach: Put VoiceCallButton inside the Window Header if Stream supports it, or just Custom Header inside Window.
                
                Actually, let's put VoiceCallManager inside Chat.
            */}
           <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Chat client={client} theme="messaging light">
          <VoiceCallManager />
          <Channel channel={channel}>
            <Window>
               {/* We can inject a custom header here or just add the button in the MessageInput? No. 
                   Let's add a floating call button or obscure it into the header by making the whole Chat wrapped in Channel?
                   
                   Current structure: 
                   div (Header which is static HTML)
                   div (Chat -> Channel -> Window)
                   
                   We can duplicate the header inside Channel or pass channel to Button?
                   No, useChatContext needs context.
                   
                   Solution: Move the header INTO the Channel.
               */}
              <div className="bg-slate-900 text-white p-3 flex justify-between items-center z-10 sticky top-0">
                  <span className="font-bold">
                     {channel?.state?.members ? Object.values(channel.state.members).find((m: any) => m.user.id !== user.uid)?.user?.name : vendorName}
                  </span>
                  <div className="flex items-center gap-2">
                     <VoiceCallButton />
                     <button onClick={onClose}><X className="w-5 h-5" /></button>
                  </div>
              </div>
              
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
