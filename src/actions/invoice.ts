'use server';

import cloudinary from "@/lib/cloudinary";
import { model } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function processInvoice(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  // 1. Upload to Cloudinary
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "invoices" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  const imageUrl = uploadResult.secure_url;

  // 2. Extract Data with Gemini
  const prompt = `
    Extract the following data from this invoice image in JSON format:
    - date (YYYY-MM-DD)
    - total_amount (number)
    - items (array of objects with name, quantity, unit_price, total_price, category, suggested_emoji)
    - vendor_name (string)
    
    IMPORTANT:
    1. Exclude non-product items such as 'Shipping Charges', 'Delivery Fee', 'Tax', 'GST', 'Discount', 'Service Charge', etc. Only list physical inventory items.
    2. For 'category', analyze the item and assign a specific product category (e.g., 'Dairy', 'Vegetables', 'Snacks', 'Beverages', 'Personal Care', 'Cleaning Supplies'). Do NOT use generic terms like 'General'.
    3. For 'suggested_emoji', provide a single specific emoji that best represents the item (e.g., 'Milk' -> 🥛, 'Apple' -> 🍎).
    
    If a field is missing, use null. Ensure the output is valid JSON.
  `;

  const imagePart = {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: file.type,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();
  
  // Clean up JSON string (remove markdown code blocks if any)
  const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const extractedData = JSON.parse(jsonString);

  // 3. Save to Firestore
  const admin = await initAdmin();
  if (!admin) throw new Error("Database error");
  
  const db = getFirestore(admin);
  
  const invoiceRef = await db.collection("invoices").add({
    vendor_id: session.uid,
    image_url: imageUrl,
    status: "processed",
    extracted_data: extractedData,
    created_at: new Date().getTime(),
  });

  // 4. Update Inventory Collection
  const batch = db.batch();
  
  for (const item of extractedData.items || []) {
    // Skip if no name
    if (!item.name) continue;

    const normalizedId = item.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const itemRef = db.collection("inventory").doc(`${session.uid}_${normalizedId}`);
    
    const itemDoc = await itemRef.get();
    
    if (itemDoc.exists) {
      const currentData = itemDoc.data();
      const newQuantity = (currentData?.quantity || 0) + (Number(item.quantity) || 0);
      const newTotalValue = (currentData?.total_value || 0) + (Number(item.total_price) || 0);
      
      batch.update(itemRef, {
        quantity: newQuantity,
        total_value: newTotalValue,
        average_price: newQuantity > 0 ? newTotalValue / newQuantity : 0,
        last_updated: new Date().getTime(),
        // Only update these if they are missing or generic
        category: (currentData?.category === 'Uncategorized') ? item.category : currentData?.category,
        emoji: (currentData?.emoji === '📦') ? item.suggested_emoji : currentData?.emoji,
        sources: [...(currentData?.sources || []), {
          invoiceId: invoiceRef.id,
          date: extractedData.date,
          quantity: item.quantity,
          price: item.unit_price
        }]
      });
    } else {
      batch.set(itemRef, {
        vendor_id: session.uid,
        id: normalizedId,
        name: item.name,
        category: item.category || 'Uncategorized',
        emoji: item.suggested_emoji || '📦',
        quantity: Number(item.quantity) || 0,
        total_value: Number(item.total_price) || 0,
        average_price: Number(item.unit_price) || 0,
        last_updated: new Date().getTime(),
        sources: [{
          invoiceId: invoiceRef.id,
          date: extractedData.date,
          quantity: item.quantity,
          price: item.unit_price
        }]
      });
    }
  }
  
  await batch.commit();

  revalidatePath("/dashboard");
  return { success: true, data: extractedData };
}
