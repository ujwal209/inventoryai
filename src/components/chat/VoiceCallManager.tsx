'use client';

import { useEffect, useState,useCallback } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  RingingCall,
  useCalls,
  useCall,
  CallingState,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useChatContext } from 'stream-chat-react';
import { Phone, PhoneOutgoing, X } from 'lucide-react';
import { getStreamToken } from '@/actions/chat';
import { toast } from 'sonner';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY!;

export function VoiceCallButton() {
  const { channel } = useChatContext();

  const startCall = (e: any) => {
     e.stopPropagation(); // Prevent navigation or header clicks
     if(!channel) return;
     const memberIds = Object.keys(channel.state.members);
     
     window.dispatchEvent(new CustomEvent('start-stream-call', { 
         detail: { 
             channelId: channel.id, 
             memberIds: memberIds 
         } 
     }));
  };

  return (
    <button 
      onClick={startCall}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 transition-colors shadow-sm"
      title="Voice Call"
    >
      <Phone className="w-5 h-5" />
    </button>
  );
}


export function VoiceCallManager() {
  const { client: chatClient } = useChatContext();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    if (!chatClient || !chatClient.userID) return;
    
    // Initialize Video Client using same identity as Chat
    const initVideo = async () => {
       try {
           const token = await getStreamToken();
           const user = {
              id: chatClient.userID!,
              name: chatClient.user?.name || chatClient.userID,
              image: chatClient.user?.image as string,
           };
           
           const client = new StreamVideoClient({ apiKey: API_KEY, user, token });
           await client.connectUser({ id: user.id }, token);
           setVideoClient(client);
       } catch (e) {
           console.error("Failed to init video client", e);
       }
    };
    
    initVideo();

    return () => {
        if(videoClient) videoClient.disconnectUser();
    };
  }, [chatClient]);

  if (!videoClient) return null;

  return (
    <StreamVideo client={videoClient}>
       <CallContainer />
    </StreamVideo>
  );
}

// Ringtone URL
const RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"; // Standard phone ring

function CallContainer() {
    const { client: chatClient } = useChatContext();
    const calls = useCalls();
    const client = useVideoClient();
    const [outgoingCall, setOutgoingCall] = useState<any>(null); 
    
    // Listen for custom start event
    const handleStart = useCallback(async (e: any) => {
            const { channelId, memberIds } = e.detail;
            
            // Fallback for random UUID if crypto not available
            const callId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Use 'default' type but we will enforce audio-only constraints
            const call = client.call('default', callId);
            setOutgoingCall(call);
            
            try {
                const myUserId = client.state?.user?.id || chatClient?.userID; 
                if (!myUserId) {
                     toast.error("Connection error");
                     setOutgoingCall(null);
                     return;
                }

                // Filter valid members
                const otherMembers = memberIds
                    .filter((id: string) => id !== myUserId && id)
                    .map((id: string) => ({ user_id: id }));

                if (otherMembers.length === 0) {
                     toast.error("No one else to call!");
                     setOutgoingCall(null);
                     return;
                }

                // Start call
                await call.getOrCreate({
                    ring: true,
                    data: {
                        members: otherMembers,
                        custom: {
                            initiatorId: myUserId,
                            type: 'audio'
                        }
                    },
                });

                // Send a message to the chat to record history
                if (channelId) {
                    const channel = chatClient.channel('messaging', channelId);
                    await channel.watch(); // Ensure we can send
                    await channel.sendMessage({
                        text: '📞 Voice Call Started',
                        attachments: [{ type: 'voice_call', call_id: callId }]
                    });
                }

            } catch (err: any) {
                console.error("Failed to start call", err);
                toast.error(`Failed to start call: ${err.message || 'Unknown error'}`);
                setOutgoingCall(null);
            }
    }, [client, chatClient]);

    useEffect(() => {
        window.addEventListener('start-stream-call', handleStart);
        return () => window.removeEventListener('start-stream-call', handleStart);
    }, [handleStart]);

    // Handle Incoming / Active Calls
    const call = calls[0] || outgoingCall;

    if (!call) return null;

    return (
        <StreamCall call={call}>
             <CallManagerLogic />
             <CallUI 
                isOutgoing={!!outgoingCall && call.id === outgoingCall.id}
                onCancel={() => setOutgoingCall(null)} 
             />
        </StreamCall>
    );
}

// Invisible component to manage call state/side-effects
function CallManagerLogic() {
    const { useMicrophoneState, useCameraState } = useCallStateHooks();
    const { camera, isMute: isCameraMute } = useCameraState();
    
    useEffect(() => {
        // Enforce Audio Only
        if (camera && !isCameraMute) {
             try { camera.disable(); } catch(e) {}
        }
    }, [camera, isCameraMute]);

    return <CallingSound />;
}

function CallingSound() {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  
  useEffect(() => {
    if (callingState === CallingState.RINGING) {
        const audio = new Audio(RINGTONE_URL);
        audio.loop = true;
        audio.play().catch(() => {}); // Auto-play policies might block
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }
  }, [callingState]);

  return null;
}

function CallUI({ onCancel, isOutgoing }: { onCancel: () => void, isOutgoing: boolean }) {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    const isRinging = callingState === CallingState.RINGING;
    const isActive = callingState === CallingState.JOINING || callingState === CallingState.JOINED;

    // Standard Stream UI approach
    if (isRinging) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-950/90 flex items-center justify-center p-4">
                 <StreamTheme className="light dark:dark-theme">
                     <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-4">
                        <RingingCall />
                     </div>
                 </StreamTheme>
            </div>
        );
    }

    if (isActive) {
         return (
             <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
                  <StreamTheme className="w-full h-full light dark:dark-theme">
                      <div className="flex-1 relative w-full h-full">
                           <SpeakerLayout participantsBarPosition="bottom" />
                      </div>
                      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                           <div className="bg-slate-900/50 backdrop-blur-md rounded-full p-2">
                                <CallControls onLeave={onCancel} />
                           </div>
                      </div>
                  </StreamTheme>
             </div>
         );
    }

    // Outgoing / Connecting State (Stream doesn't have a specific "Outgoing Ringing" component that is separate from Joined typically, 
    // but in this flow we might wait a bit. We'll show a minimal state utilizing theme)
    if (isOutgoing && !isActive) {
        return (
             <div className="fixed inset-0 z-[9999] bg-slate-950/90 flex items-center justify-center">
                  <StreamTheme className="light dark:dark-theme">
                       <div className="text-white font-medium animate-pulse">Calling...</div>
                  </StreamTheme>
             </div>
        );
    }

    return null;
}

// Helper code
function useVideoClient() {
    const [client, setClient] = useState<any>(null);
    useEffect(() => {
         // Force load module
         import('@stream-io/video-react-sdk').then(mod => {
             // We can't use hooks here conditionally.
         });
    }, []);
    // Just use the hook directly, it throws if context missing but we are inside StreamVideo
    return require('@stream-io/video-react-sdk').useStreamVideoClient();
}
