'use server';

import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { model } from "@/lib/gemini";
import cloudinary from "@/lib/cloudinary";

export async function uploadProductImage(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  return uploadResult.secure_url;
}

async function getInventoryCollection(db: FirebaseFirestore.Firestore, uid: string) {
  const userDoc = await db.collection("users").doc(uid).get();
  const role = userDoc.data()?.role;

  if (role === 'dealer') {
    return db.collection("users").doc(uid).collection("inventory");
  } else {
    // Default to global inventory for vendors or others
    return db.collection("inventory");
  }
}

export async function addInventoryItem(data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  // AI Category & Emoji Prediction if not provided
  let category = data.category;
  let emoji = data.emoji;

  if (!category || !emoji) {
    try {
      const prompt = `
        Analyze the product name "${data.name}" and provide:
        1. A specific product category (e.g., Dairy, Snacks, Electronics).
        2. A single representative emoji.
        Return strictly in JSON format: {"category": "...", "emoji": "..."}
      `;
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const aiData = JSON.parse(text);
      category = category || aiData.category;
      emoji = emoji || aiData.emoji;
    } catch (e) {
      console.error("AI prediction failed", e);
      category = category || "Uncategorized";
      emoji = emoji || "📦";
    }
  }

  const collectionRef = await getInventoryCollection(db, session.uid);
  const normalizedId = data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  
  // For dealers (subcollection), doc ID can be simpler or same. 
  // For global inventory, we used ${session.uid}_${normalizedId} to avoid collisions.
  // We can keep the same ID strategy for consistency.
  const docId = `${session.uid}_${normalizedId}`; 
  const itemRef = collectionRef.doc(docId);

  await itemRef.set({
    vendor_id: session.uid, // Owner ID
    id: normalizedId,
    name: data.name,
    sku: data.sku || "",
    brand: data.brand || "",
    category: category,
    emoji: emoji,
    quantity: Number(data.quantity) || 0,
    unit: data.unit || "pcs",
    sellingPrice: Number(data.sellingPrice) || Number(data.price) || 0,
    average_price: Number(data.costPrice) || Number(data.price) || 0,
    total_value: (Number(data.quantity) || 0) * (Number(data.costPrice) || Number(data.price) || 0),
    minStock: Number(data.minStock) || 0,
    expiryDate: data.expiryDate || null,
    image: data.image || null,
    description: data.description || "",
    tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [],
    last_updated: new Date().getTime(),
    sources: [{
      type: 'manual',
      date: new Date().toISOString().split('T')[0],
      quantity: data.quantity,
      price: data.costPrice || data.price
    }]
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateInventoryItem(itemId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  if (!itemId) throw new Error("Invalid item ID");

  const collectionRef = await getInventoryCollection(db, session.uid);
  const itemRef = collectionRef.doc(itemId);
  const doc = await itemRef.get();
  
  if (!doc.exists) {
    throw new Error("Item not found");
  }

  await itemRef.update({
    name: data.name || doc.data()?.name || "",
    quantity: Number(data.quantity) || 0,
    sellingPrice: Number(data.price) || doc.data()?.sellingPrice || 0,
    image: data.image || doc.data()?.image || null,
    description: data.description || doc.data()?.description || "",
    last_updated: new Date().getTime()
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteInventoryItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  const db = getFirestore(admin);

  if (!itemId) throw new Error("Invalid item ID");

  const collectionRef = await getInventoryCollection(db, session.uid);
  const itemRef = collectionRef.doc(itemId);
  
  await itemRef.delete();

  revalidatePath("/dashboard");
  return { success: true };
}
