'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

export async function getVendorInvoices() {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  
  const db = getFirestore(admin);
  
  try {
    const snapshot = await db.collection("invoices")
      .where("vendor_id", "==", session.uid)
      // .orderBy("created_at", "desc") // Removed to avoid index requirement
      .get();

    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in-memory to avoid index
    return invoices.sort((a: any, b: any) => b.created_at - a.created_at);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function getVendorInventory() {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  
  const db = getFirestore(admin);

  try {
    const snapshot = await db.collection("inventory")
      .where("vendor_id", "==", session.uid)
      .get();

    return snapshot.docs.map(doc => ({
      docId: doc.id, // Actual Firestore Doc ID for updates/deletes
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export async function updateVendorLocation(
  location: { lat: number; lng: number },
  details?: { name: string; phone: string; address: string; bannerUrl: string; logoUrl: string }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  const updateData: any = {
    location: location
  };

  if (details) {
    updateData["business_details.name"] = details.name || "";
    updateData["business_details.phone"] = details.phone || "";
    updateData["business_details.address"] = details.address || "";
    if (details.bannerUrl !== undefined) updateData["business_details.bannerUrl"] = details.bannerUrl;
    if (details.logoUrl !== undefined) updateData["business_details.logoUrl"] = details.logoUrl;
  }

  // Remove any undefined keys just in case
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  await db.collection("users").doc(session.uid).update(updateData);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getVendorStats() {
  const session = await getSession();
  if (!session) return null;

  const admin = await initAdmin();
  if (!admin) return null;
  
  const db = getFirestore(admin);

  try {
    const pendingSnapshot = await db.collection("invoices")
      .where("vendor_id", "==", session.uid)
      .where("status", "==", "processed") // Assuming 'processed' means ready for review, or maybe we want 'pending'? 
      // In invoice.ts we set status to 'processed'. Let's count all for now or maybe check logic.
      // The dashboard shows "Pending Invoices". Maybe we should add a 'status' field to invoices that is 'pending' initially?
      // In invoice.ts: status: "processed".
      // Let's just count total invoices for now or assume 'processed' ones are the ones we have.
      // Actually, let's count documents in 'invoices' collection for this vendor.
      .get();

    return {
      todayProfit: 2450, // Still placeholder until we have sales
      totalSales: 12450, // Still placeholder
      pendingInvoices: pendingSnapshot.size
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}
