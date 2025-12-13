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
  const docId = `${session.uid}_${normalizedId}`; 
  const itemRef = collectionRef.doc(docId);

  const newItem = {
    vendor_id: session.uid,
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
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map(t => t.trim()) : []),
    last_updated: new Date().getTime(),
    sources: [{
      type: 'manual',
      date: new Date().toISOString().split('T')[0],
      quantity: data.quantity,
      price: data.costPrice || data.price
    }]
  };

  await itemRef.set(newItem);

  revalidatePath("/dashboard");
  return { success: true, item: { ...newItem, docId: docId } };
}

export async function updateInventoryItem(itemId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  const db = getFirestore(admin);

  if (!itemId) throw new Error("Invalid item ID");

  const collectionRef = await getInventoryCollection(db, session.uid);
  const itemRef = collectionRef.doc(itemId);
  const doc = await itemRef.get();
  
  if (!doc.exists) {
    throw new Error("Item not found");
  }

  const existingData = doc.data() || {};

  const updatedFields = {
    name: data.name ?? existingData.name ?? "",
    sku: data.sku ?? existingData.sku ?? "",
    brand: data.brand ?? existingData.brand ?? "",
    category: data.category ?? existingData.category ?? "Uncategorized",
    quantity: data.quantity !== undefined ? Number(data.quantity) : (existingData.quantity || 0),
    sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : (data.price !== undefined ? Number(data.price) : (existingData.sellingPrice || 0)),
    image: data.image ?? existingData.image ?? null,
    description: data.description ?? existingData.description ?? "",
    unit: data.unit ?? existingData.unit ?? "pcs",
    minStock: data.minStock !== undefined ? Number(data.minStock) : (existingData.minStock || 0),
    expiryDate: data.expiryDate || existingData.expiryDate || null,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map((t: string) => t.trim()) : existingData.tags || []),
    last_updated: new Date().getTime()
  };

  // Ensure no undefined values are passed to Firestore
  Object.keys(updatedFields).forEach(key => {
    if ((updatedFields as any)[key] === undefined) {
      (updatedFields as any)[key] = null;
    }
  });

  await itemRef.update(updatedFields);

  revalidatePath("/dashboard");
  // Merge updated fields with existing data to return full object
  return { success: true, item: { ...existingData, ...updatedFields, docId: itemId } };
}

export async function deleteInventoryItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const admin = await initAdmin();
  const db = getFirestore(admin);

  if (!itemId) throw new Error("Invalid item ID");

  const collectionRef = await getInventoryCollection(db, session.uid);
  const itemRef = collectionRef.doc(itemId);
  
  await itemRef.delete();

  revalidatePath("/dashboard");
  return { success: true, docId: itemId };
}

export async function scanProductImage(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const imageUrl = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "scanned_products" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    ).end(buffer);
  });

  try {
     const imagePart = {
       inlineData: {
         data: buffer.toString("base64"),
         mimeType: file.type
       }
     };

     const prompt = `
       Analyze this product image, label, or invoice entry. Extract the following details into a JSON object strictly:
       - name: Product name (title case, be specific)
       - brand: Brand name
       - category: Product category (slug format if possible, e.g. mobile-accessories, groceries)
       - description: A detailed description based on visual features.
       - quantity: Quantity number if visible (default 1)
       - unit: Unit (pcs, kg, ltr, etc. default 'pcs')
       - sellingPrice: Selling price (number)
       - costPrice: Cost price (number)
       - sku: SKU or Barcode (string)
       - expiryDate: Expiry date in YYYY-MM-DD format
       - minStock: Suggested low stock alert level (number, e.g. 10)
       
       If a field is not found, key should be null or empty string. Return ONLY the JSON.
     `;

     const result = await model.generateContent([prompt, imagePart]);
     const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
     const data = JSON.parse(text);
     
     return { success: true, data, imageUrl };
  } catch (error) {
    console.error("Scan failed:", error);
    throw new Error("Failed to scan product. Please try again.");
  }
}

export async function generateProductImage(description: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // 1. Generate Buffer from AI API (Pollinations.ai is free and easy)
  const encodedPrompt = encodeURIComponent(description + ", realistic product photography, white background, high quality, 4k");
  const aiImageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=512&height=512&seed=${Math.floor(Math.random() * 1000)}`;
  
  const response = await fetch(aiImageUrl);
  if (!response.ok) throw new Error("Failed to generate image");
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Upload to Cloudinary
  const imageUrl = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "ai_generated_products" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    ).end(buffer);
  });

  return imageUrl;
}
