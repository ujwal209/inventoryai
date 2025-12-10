import "server-only";
import admin from "firebase-admin";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(params: FirebaseAdminConfig) {
  const privateKey = formatPrivateKey(params.privateKey);

  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: params.projectId,
      clientEmail: params.clientEmail,
      privateKey: privateKey,
    }),
  });
}

export async function initAdmin() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Failed to initialize Firebase Admin. Missing environment variables:");
    if (!projectId) console.error("- NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!clientEmail) console.error("- FIREBASE_CLIENT_EMAIL");
    if (!privateKey) console.error("- FIREBASE_PRIVATE_KEY");
    return null;
  }

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.error("FIREBASE_PRIVATE_KEY seems invalid. It must contain '-----BEGIN PRIVATE KEY-----'");
  }

  const params = {
    projectId,
    clientEmail,
    privateKey,
  };

  return createFirebaseAdminApp(params);
}
