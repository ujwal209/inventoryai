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

  const normalizedId = data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const itemRef = db.collection("inventory").doc(`${session.uid}_${normalizedId}`);

  await itemRef.set({
    vendor_id: session.uid,
    id: normalizedId,
    name: data.name,
    category: category,
    emoji: emoji,
    quantity: Number(data.quantity) || 0,
    sellingPrice: Number(data.price) || 0, // Customer facing price
    average_price: Number(data.price) || 0, // Cost price (simplified for manual add)
    total_value: (Number(data.quantity) || 0) * (Number(data.price) || 0),
    image: data.image || null,
    description: data.description || "",
    last_updated: new Date().getTime(),
    sources: [{
      type: 'manual',
      date: new Date().toISOString().split('T')[0],
      quantity: data.quantity,
      price: data.price
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

  const itemRef = db.collection("inventory").doc(itemId);
  const doc = await itemRef.get();
  
  if (!doc.exists || doc.data()?.vendor_id !== session.uid) {
    throw new Error("Item not found or unauthorized");
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

  const itemRef = db.collection("inventory").doc(itemId);
  const doc = await itemRef.get();
  
  if (!doc.exists || doc.data()?.vendor_id !== session.uid) {
    throw new Error("Item not found or unauthorized");
  }

  await itemRef.delete();

  revalidatePath("/dashboard");
  return { success: true };
}
