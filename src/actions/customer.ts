'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function getNearbyVendors(userLocation: { lat: number, lng: number }) {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  const db = getFirestore(admin);

  try {
    // In a real app with GeoFire or similar, we'd query by location.
    // For now, fetch all vendors and filter/sort by distance in memory.
    // This is fine for a prototype/small scale.
    const snapshot = await db.collection("users")
      .where("role", "==", "vendor")
      .where("status", "==", "approved")
      .get();

    const vendors = snapshot.docs.map(doc => {
      const data = doc.data();
      let distance = 0;
      if (data.location && userLocation) {
        distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          data.location.lat, data.location.lng
        );
      }
      return {
        uid: doc.id,
        ...data,
        distance
      };
    });

    // Sort by distance
    return vendors.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function getVendorInventoryForCustomer(vendorId: string) {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  const db = getFirestore(admin);

  try {
    const snapshot = await db.collection("inventory")
      .where("vendor_id", "==", vendorId)
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter in memory to avoid composite index requirement
    return items.filter((item: any) => item.quantity > 0);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export async function createOrder(orderData: {
  vendorId: string;
  items: any[];
  totalAmount: number;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  try {
    await db.collection("orders").add({
      customerId: session.uid,
      customerEmail: session.email,
      vendorId: orderData.vendorId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      deliveryMethod: orderData.deliveryMethod,
      deliveryAddress: orderData.deliveryAddress || null,
      status: 'pending',
      createdAt: new Date().getTime(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to place order");
  }
}

export async function toggleFavorite(vendorId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  try {
    const userRef = db.collection("users").doc(session.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const favorites = userData?.favorites || [];

    let newFavorites;
    if (favorites.includes(vendorId)) {
      newFavorites = favorites.filter((id: string) => id !== vendorId);
    } else {
      newFavorites = [...favorites, vendorId];
    }

    await userRef.update({ favorites: newFavorites });
    return { success: true, favorites: newFavorites };
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw new Error("Failed to update favorites");
  }
}

export async function getFavorites() {
  const session = await getSession();
  if (!session) return [];

  const admin = await initAdmin();
  if (!admin) return [];
  const db = getFirestore(admin);

  try {
    const userDoc = await db.collection("users").doc(session.uid).get();
    const favorites = userDoc.data()?.favorites || [];
    
    if (favorites.length === 0) return [];

    const vendors = [];
    for (const vendorId of favorites) {
      const vendorDoc = await db.collection("users").doc(vendorId).get();
      if (vendorDoc.exists) {
        vendors.push({ uid: vendorDoc.id, ...vendorDoc.data() });
      }
    }
    
    return vendors;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

export async function updateCustomerProfile(data: { location: { lat: number, lng: number } }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  try {
    await db.collection("users").doc(session.uid).update({
      location: data.location,
      updatedAt: new Date().getTime()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}
