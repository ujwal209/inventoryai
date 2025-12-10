'use server';

import { getSession, getUserProfile } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const user = await getUserProfile();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function approveUser(userId: string) {
  await checkAdmin();
  
  const adminApp = await initAdmin();
  
  if (!adminApp) {
    throw new Error("Firebase Admin not initialized");
  }

  const db = getFirestore(adminApp);

  try {
    await db.collection("users").doc(userId).update({
      status: "approved"
    });
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error approving user:", error);
    throw new Error("Failed to approve user");
  }
}

export async function rejectUser(userId: string) {
  await checkAdmin();
  
  const adminApp = await initAdmin();
  
  if (!adminApp) {
    throw new Error("Firebase Admin not initialized");
  }

  const db = getFirestore(adminApp);

  try {
    await db.collection("users").doc(userId).update({
      status: "rejected"
    });
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error rejecting user:", error);
    throw new Error("Failed to reject user");
  }
}
