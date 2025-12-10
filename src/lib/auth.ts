import { cookies } from "next/headers";
import { initAdmin } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase"; // Client SDK for Firestore (or use Admin SDK for server actions?)
// Actually, for server actions, we should use Admin SDK for Firestore to bypass rules if needed, 
// but for now let's stick to consistent patterns. 
// However, `db` from `@/lib/firebase` is client-side. We can't use it easily in server components if we want to be secure/admin.
// Let's use Admin SDK for Firestore in server context.

import { getFirestore } from "firebase-admin/firestore";

export async function getSession() {
  const admin = await initAdmin();
  
  if (!admin) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    // console.error("Session verification failed:", error);
    return null;
  }
}

export async function getUserProfile() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }

  const admin = await initAdmin();
  
  if (!admin) {
    return null;
  }

  const db = getFirestore(admin);
  
  try {
    const userDoc = await db.collection("users").doc(session.uid).get();
    
    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
