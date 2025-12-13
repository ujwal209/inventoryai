'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure you have client-side db exported
import { useAuth } from '@/context/AuthContext';

// Simple beep sound (Base64)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, normally a real wav

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize Audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Notification sound

    // Listen to notifications
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notes);
      
      const unread = notes.filter((n: any) => !n.read).length;
      
      // If unread count INCREASED, play sound and toast
      setUnreadCount(prev => {
        if (unread > prev) {
           // New notification received
           const latest = notes[0];
           if (latest && !latest.read) {
             try {
                audioRef.current?.play().catch(e => console.log("Audio play failed", e));
             } catch(e) {}
             toast(latest.title || "New Notification", {
               description: latest.message
             });
           }
        }
        return unread;
      });
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "notifications", id), {
      read: true
    });
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n: any) => !n.read).map((n: any) => n.id);
    for (const id of unreadIds) {
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-950">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {notifications.map((note: any) => (
                    <div 
                      key={note.id} 
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${!note.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => markAsRead(note.id)}
                    >
                      <div className="flex items-start gap-3">
                         <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!note.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                         <div className="flex-1">
                            <p className={`text-sm ${!note.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                               {note.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                               {note.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2">
                               {new Date(note.createdAt).toLocaleString()}
                            </p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
