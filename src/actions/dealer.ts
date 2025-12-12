'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export async function getVendorsForDealer() {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  
  const db = getFirestore(admin);

  try {
    // Fetch all users with role 'vendor' and status 'approved'
    const snapshot = await db.collection("users")
      .where("role", "==", "vendor")
      .where("status", "==", "approved")
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.business_details?.name || data.name || "Unknown Vendor",
        location: data.business_details?.address || "Location not set",
        email: data.email,
        image: data.business_details?.bannerUrl || data.business_details?.logoUrl || null,
        rating: data.business_details?.rating || 4.5, // Default/Mock if not present
        category: data.business_details?.category || "General",
        delivery: "Standard", // Placeholder
        minOrder: data.business_details?.minOrderAcc ? `₹${data.business_details.minOrderAcc}` : "₹0"
      };
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}
