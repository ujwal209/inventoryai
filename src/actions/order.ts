'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function createOrder(orderData: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  const db = getFirestore(admin);

  const orderRef = db.collection("orders").doc();
  
  const order = {
    id: orderRef.id,
    customerId: session.uid,
    customerName: session.email?.split('@')[0] || 'Customer', // Fallback
    vendorId: orderData.vendorId,
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    status: 'pending', // Initial status
    deliveryMethod: orderData.deliveryMethod,
    deliveryAddress: orderData.deliveryAddress || null,
    estimatedTime: orderData.estimatedTime || '30-45 mins',
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    ...orderData
  };

  await orderRef.set(order);
  revalidatePath("/dashboard");
  return { success: true, orderId: orderRef.id };
}

export async function getVendorOrders() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  const db = getFirestore(admin);

  const ordersSnapshot = await db.collection("orders")
    .where("vendorId", "==", session.uid)
    .get();

  const orders = ordersSnapshot.docs.map(doc => doc.data());
  // Sort in memory to avoid index requirement
  return orders.sort((a: any, b: any) => b.createdAt - a.createdAt);
}

export async function getCustomerOrders() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  const db = getFirestore(admin);

  const ordersSnapshot = await db.collection("orders")
    .where("customerId", "==", session.uid)
    .get();

  const orders = await Promise.all(ordersSnapshot.docs.map(async (doc) => {
    const orderData = doc.data();
    
    // Enrich items with images from inventory
    const itemsWithImages = await Promise.all(orderData.items.map(async (item: any) => {
      try {
        let inventoryImage = null;

        // Strategy 1: Try fetching by Document ID (most reliable)
        if (item.itemId) {
          const itemDoc = await db.collection("inventory").doc(item.itemId).get();
          if (itemDoc.exists) {
            const data = itemDoc.data();
            if (data?.image) inventoryImage = data.image;
          }
        }

        // Strategy 2: If ID lookup failed or no image, try finding by Name and VendorID
        if (!inventoryImage && orderData.vendorId && item.name) {
           const querySnapshot = await db.collection("inventory")
             .where("vendor_id", "==", orderData.vendorId)
             .where("name", "==", item.name)
             .limit(1)
             .get();
           
           if (!querySnapshot.empty) {
             const data = querySnapshot.docs[0].data();
             if (data?.image) inventoryImage = data.image;
           }
        }
        
        // Use inventory image if found, otherwise fall back to whatever was in the order
        return { ...item, image: inventoryImage || item.image };
      } catch (e) {
        console.error("Failed to fetch inventory image for item", item.name, e);
        return item;
      }
    }));

    return { ...orderData, items: itemsWithImages };
  }));

  // Sort in memory to avoid index requirement
  return orders.sort((a: any, b: any) => b.createdAt - a.createdAt);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  const db = getFirestore(admin);

  await db.collection("orders").doc(orderId).update({
    status: status,
    updatedAt: new Date().getTime()
  });

  revalidatePath("/dashboard");
  return { success: true };
}
