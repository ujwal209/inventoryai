'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function createStockRequest(vendorId: string, items: any[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  // Get Dealer Info
  const dealerDoc = await db.collection("users").doc(session.uid).get();
  const dealerData = dealerDoc.data() || {};
  const dealerName = dealerData.business_details?.name || dealerData.name || session.email;

  await db.collection("stock_requests").add({
    vendor_id: vendorId,
    dealer_id: session.uid,
    dealer_name: dealerName,
    items: items.map(i => ({
      name: i.name,
      qty: i.orderQty,
      docId: i.docId || null
    })),
    total_items: items.reduce((acc, i) => acc + i.orderQty, 0),
    status: 'pending',
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getVendorRequests() {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  const db = getFirestore(admin);

  try {
    const snapshot = await db.collection("stock_requests")
      .where("vendor_id", "==", session.uid)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: new Date(doc.data().created_at).toLocaleString()
    }));
    
    // Sort in memory
    return requests.sort((a: any, b: any) => b.created_at - a.created_at);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
}

export async function getDealerRequests() {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  const db = getFirestore(admin);

  try {
    const snapshot = await db.collection("stock_requests")
      .where("dealer_id", "==", session.uid)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: new Date(doc.data().created_at).toLocaleString()
    }));
    
    return requests.sort((a: any, b: any) => b.created_at - a.created_at);
  } catch (error) {
    console.error("Error fetching dealer requests:", error);
    return [];
  }
}

export async function updateRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  const requestRef = db.collection("stock_requests").doc(requestId);

  try {
    await db.runTransaction(async (t) => {
      const requestDoc = await t.get(requestRef);
      if (!requestDoc.exists) throw new Error("Request not found");

      const requestData = requestDoc.data();
      if (!requestData) throw new Error("Request data missing");

      // Verify vendor ownership
      if (requestData.vendor_id !== session.uid) {
        throw new Error("Unauthorized: Only the vendor can update this request");
      }

      const vendorDoc = await t.get(db.collection("users").doc(session.uid));
      const vendorName = vendorDoc.data()?.business_details?.name || "Vendor";

      if (status === 'accepted' && requestData.status !== 'accepted') {
        const dealerId = requestData.dealer_id;
        const vendorId = session.uid;
        const items = requestData.items || [];

        // 1. Process Stock Transfer
        for (const item of items) {
          // A. Decrement Vendor Stock
          const vendorInventoryRef = db.collection("users").doc(vendorId).collection("inventory");
          const vendorSnapshot = await t.get(vendorInventoryRef.where("name", "==", item.name).limit(1));
          
          if (!vendorSnapshot.empty) {
            const vendorItemDoc = vendorSnapshot.docs[0];
            const currentQty = vendorItemDoc.data().quantity || 0;
            const newQty = Math.max(0, currentQty - item.qty); 
            t.update(vendorItemDoc.ref, { quantity: newQty });
          }

          // B. Increment Dealer Stock
          const dealerInventoryRef = db.collection("users").doc(dealerId).collection("inventory");
          const dealerSnapshot = await t.get(dealerInventoryRef.where("name", "==", item.name).limit(1));

          const sourceEntry = {
            type: 'request',
            from: vendorName, 
            quantity: item.qty,
            date: new Date().toISOString().split('T')[0],
            requestId: requestId
          };

          if (!dealerSnapshot.empty) {
            const dealerItemDoc = dealerSnapshot.docs[0];
            const currentQty = dealerItemDoc.data().quantity || 0;
            t.update(dealerItemDoc.ref, { 
                quantity: currentQty + item.qty,
                sources: FieldValue.arrayUnion(sourceEntry)
            });
          } else {
            // Create New Item for Dealer
            const newItemRef = dealerInventoryRef.doc();
            t.set(newItemRef, {
              name: item.name,
              quantity: item.qty,
              category: "Uncategorized", 
              price: 0, 
              unit: "pcs",
              updatedAt: new Date().getTime(),
              sources: [sourceEntry]
            });
          }
        }
      }

      // 2. Update Request Status
      t.update(requestRef, {
        status,
        updated_at: new Date().getTime()
      });
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Transaction failure:", error);
    throw new Error("Failed to update request status");
  }
}
