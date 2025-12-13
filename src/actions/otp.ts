'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import twilio from 'twilio';

// Initialize Firebase Admin (Singleton)
function getAdminDb() {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
       initializeApp({
          credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
       });
    } else {
       initializeApp();
    }
  }
  return getFirestore();
}

export async function sendTwilioOtp(phone: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Missing Twilio Env Vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)' };
  }

  // Validate Account SID format
  if (!accountSid.startsWith('AC')) {
     return { 
       success: false, 
       error: `Invalid TWILIO_ACCOUNT_SID. It must start with "AC". You provided one starting with "${accountSid.substring(0,2)}". Check .env.local.` 
     };
  }

  try {
    const client = twilio(accountSid, authToken);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to Firestore (otp_codes collection)
    const db = getAdminDb();
    // Sanitize phone for doc ID
    const docId = phone.replace(/[^\w]/g, ''); 
    
    await db.collection('otp_codes').doc(docId).set({
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });

    console.log(`Sending OTP to ${phone} using Twilio...`);

    await client.messages.create({
      body: `Your InventoryAI Verification Code is: ${otp}`,
      from: fromNumber,
      to: phone
    });

    return { success: true };
  } catch (error: any) {
    console.error("Twilio Send Error:", error);
    return { success: false, error: error.message || "Unknown Twilio Error" };
  }
}

export async function verifyTwilioOtp(phone: string, code: string) {
  try {
    const db = getAdminDb();
    const docId = phone.replace(/[^\w]/g, '');
    const docRef = db.collection('otp_codes').doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'No OTP request found for this number (or expired).' };
    }

    const data = doc.data();
    if (!data) return { success: false, error: 'Invalid data' };

    if (Date.now() > data.expiresAt) {
      return { success: false, error: 'OTP Expired' };
    }

    if (data.code !== code) {
      await docRef.update({ attempts: (data.attempts || 0) + 1 });
      return { success: false, error: 'Invalid OTP' };
    }

    // Success - Delete OTP
    await docRef.delete();
    return { success: true };

  } catch (error: any) {
    console.error("OTP Verify Error:", error);
    return { success: false, error: error.message };
  }
}
