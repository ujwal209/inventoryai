'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const role = formData.get("role") as string;
  const businessName = formData.get("businessName") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const locationStr = formData.get("location") as string;
  const location = locationStr ? JSON.parse(locationStr) : null;

  if (!role || !phone) {
    throw new Error("Missing required fields");
  }

  // Check for Hardcoded Admin
  const adminEmail = process.env.ADMIN_EMAIL;
  let finalRole = role;
  let finalStatus = "pending";

  if (adminEmail && session.email === adminEmail) {
    finalRole = "admin";
    finalStatus = "approved";
  }
  
  // Auto-approve customers
  if (role === 'customer') {
    finalStatus = "approved";
  }

  const adminApp = await initAdmin();
  
  if (!adminApp) {
    throw new Error("Firebase Admin not initialized");
  }

  const db = getFirestore(adminApp);

  try {
    const userData: any = {
      uid: session.uid,
      email: session.email,
      role: finalRole,
      status: finalStatus,
      phone,
      created_at: new Date().getTime(),
    };

    if (role === 'customer') {
      userData.location = location; // { lat, lng }
    } else {
      userData.business_details = {
        name: businessName,
        address,
        phone,
      };
    }

    await db.collection("users").doc(session.uid).set(userData);
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error("Failed to create profile");
  }

  // Redirect based on status
  if (finalStatus === "approved") {
    redirect("/dashboard");
  } else {
    redirect("/pending-approval");
  }
}
