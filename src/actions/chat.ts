'use server';

import { StreamChat } from 'stream-chat';
import { getSession } from '@/lib/auth';

// Initialize server-side client
const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET!
);

export async function getStreamToken() {
  const session = await getSession();
  
  if (!session || !session.uid) {
    throw new Error("User not authenticated");
  }

  // Generate token for the authenticated user
  // The token is valid for this specific user ID
  const token = serverClient.createToken(session.uid);
  
  return token;
}

export async function createVendorCustomerChannel(vendorId: string, customerId: string, vendorName: string) {
  // Ensure the channel exists or create it
  // This is useful to pre-create channels or add members securely
  const channel = serverClient.channel('messaging', {
    members: [vendorId, customerId],
    created_by_id: customerId,
    name: `Chat with ${vendorName}` // Optional: Set a friendly name
  });

  await channel.create();
  return channel.id;
}
