'use server';

import { model } from "@/lib/gemini";

export async function getItemInsight(item: any) {
  try {
    const prompt = `
      Analyze this inventory item and provide a brief, actionable insight (max 2 sentences).
      
      Item: ${item.name}
      Category: ${item.category}
      Current Stock: ${item.totalQuantity}
      Average Cost: ${item.averagePrice}
      Purchase History: ${JSON.stringify(item.sources)}
      
      Focus on stock levels, price trends, or reordering advice. 
      If stock is low (< 10), suggest reordering.
      If price is varying, mention it.
      Do not use markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating insight:", error);
    return "Unable to generate insight at this time.";
  }
}
