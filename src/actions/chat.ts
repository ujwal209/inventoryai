'use server';

import { StreamChat } from 'stream-chat';
import { getSession } from "@/lib/auth";

// Ensure these are in your .env.local
const API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY;
const API_SECRET = process.env.STREAM_SECRET || process.env.STREAM_SECRET_KEY;

export async function getStreamToken() {
  const session = await getSession();

  if (!session || !session.uid) {
    throw new Error('User is not authenticated');
  }

  if (!API_KEY || !API_SECRET) {
    throw new Error('Stream keys are missing');
  }

  // Initialize server-side client
  const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);

  // Allow unrestricted token (no expiration) or set expiration
  const token = serverClient.createToken(session.uid);

  return token;
}
