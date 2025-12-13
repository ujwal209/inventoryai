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
      docId: i.docId || null,
      price: i.sellingPrice || i.price || 0,
      image: i.image || null,
      unit: i.unit || 'pcs'
    })),
    total_items: items.reduce((acc, i) => acc + i.orderQty, 0),
    status: 'pending',
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  });

  // Notify Vendor
  await db.collection("users").doc(vendorId).collection("notifications").add({
    title: "New Stock Request",
    message: `${dealerName} sent a request for ${items.reduce((acc, i) => acc + i.orderQty, 0)} items.`,
    type: "info",
    read: false,
    createdAt: new Date().getTime()
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

        // PHASE 1: Reads (Robust Lookup)
        const readResults = [];
        for (const item of items) {
          // A. Read Dealer Item (Try ID first, then Name)
          let dealerItemDoc = null;
          if (item.docId) {
             const docRef = db.collection("users").doc(dealerId).collection("inventory").doc(item.docId);
             const docSnap = await t.get(docRef);
             if (docSnap.exists) dealerItemDoc = docSnap;
          }
          
          if (!dealerItemDoc) {
             const dealerInventoryRef = db.collection("users").doc(dealerId).collection("inventory");
             const snapshot = await t.get(dealerInventoryRef.where("name", "==", item.name).limit(1));
             if (!snapshot.empty) dealerItemDoc = snapshot.docs[0];
          }

          // B. Read Vendor Item
          const globalInventoryRef = db.collection("inventory");
          const vendorSnapshot = await t.get(globalInventoryRef
             .where("vendor_id", "==", vendorId)
             .where("name", "==", item.name)
             .limit(1)
          );

          readResults.push({ item, dealerItemDoc, vendorSnapshot });
        }

        // PHASE 2: Writes
        for (const result of readResults) {
          const { item, dealerItemDoc, vendorSnapshot } = result;
          
          let itemDetails = {
             price: 0,
             image: null,
             description: "",
             unit: "pcs",
             category: "Returns"
          };

          // A. Dealer Write & Data Capture
          if (dealerItemDoc && dealerItemDoc.exists) {
             const dealerData = dealerItemDoc.data() || {};
             const currentQty = dealerData.quantity || 0;
             t.update(dealerItemDoc.ref, { quantity: currentQty - item.qty });
             
             // Capture details for Vendor
             itemDetails = {
                price: item.price || dealerData.price || 0,
                image: item.image || dealerData.image || null,
                description: item.description || dealerData.description || "",
                unit: item.unit || dealerData.unit || "pcs",
                category: item.category || dealerData.category || "Returns"
             };
          }

          // B. Vendor Write
          if (!vendorSnapshot.empty) {
            const vendorItemDoc = vendorSnapshot.docs[0];
            const vendorCurrentQty = vendorItemDoc.data().quantity || 0;
            // Update quantity. We avoid overwriting price/details on existing items to preserve Vendor customization.
            t.update(vendorItemDoc.ref, { quantity: vendorCurrentQty + item.qty });
          } else {
            // Create New Item with Rich Data from Dealer
            const normalizedId = item.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
            const newItemRef = db.collection("inventory").doc(`${vendorId}_${normalizedId}`);
            
            t.set(newItemRef, {
              vendor_id: vendorId,
              id: normalizedId,
              name: item.name,
              quantity: item.qty,
              ...itemDetails, // Spread captured dealer details (Image, Price, etc.)
              updatedAt: new Date().getTime(),
              last_updated: new Date().getTime()
            });
          }
        }
        
        // 3. Create Notification for Dealer
        const notificationRef = db.collection("users").doc(dealerId).collection("notifications").doc();
        t.set(notificationRef, {
           title: "Stock Request Accepted",
           message: `${vendorName} accepted your requests. Inventory has been transferred.`,
           type: "success",
           read: false,
           createdAt: new Date().getTime() 
        });
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
