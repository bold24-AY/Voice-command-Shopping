import { NextRequest, NextResponse } from 'next/server';
import { VoiceIntentResult, CategoryType } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const DEFAULT_CATALOG_ITEMS = [
  'Fresh Whole Milk',
  'Organic Almond Milk',
  'Farm Fresh Eggs',
  'Brown Whole Wheat Bread',
  'Fresh Alphonso Mangoes',
  'Organic Apples (Gala)',
  'Organic Bananas',
  'Colgate Total Toothpaste',
  'Sensodyne Herbal Toothpaste',
  'Basmati Rice Premium 5kg',
  'Greek Yogurt Vanilla',
  'Natural Organic Honey',
  'Green Tea Mint & Lemon',
  'Sparkling Water 6-Pack',
  'Dark Chocolate 70%',
  'Fresh Red Tomatoes',
  'Arabica Coffee Beans',
  'Organic Chicken Breast',
  'Spring Mineral Water',
  'Cheddar Cheese Slices',
  'Salted Butter Pack',
  'Rolled Oats 1kg',
  'Potato Chips Salted'
];

const SYSTEM_PROMPT = `
You are the Voice Intent Processor for "Flipkart SmartCart Voice Assistant".
Your task is to parse a spoken user transcript in any language (English, Hindi, Gujarati, Spanish, French, etc.) into a strict, structured JSON intent object.

STORE CATALOG PRODUCTS:
${DEFAULT_CATALOG_ITEMS.map(p => `- ${p}`).join('\n')}

CRITICAL CATALOG MATCHING & VALIDATION RULES:
1. When user requests to ADD or BUY an item:
   - Check if the requested item corresponds to a grocery product in the Store Catalog above or common grocery categories (Milk, Apples, Bananas, Bread, Eggs, Mangoes, Rice, Yogurt, Honey, Toothpaste, Tea, Water, Chocolate, Coffee, Chicken, Cheese, Butter, Oats, Chips).
   - Interpret & map colloquial/multilingual terms to catalog names (e.g., "दूध" or "milk" -> "Fresh Whole Milk", "apples" -> "Organic Apples (Gala)", "bread" -> "Brown Whole Wheat Bread", "mangoes" -> "Fresh Alphonso Mangoes", "rice" -> "Basmati Rice Premium 5kg").
   - IF THE REQUESTED ITEM IS NOT A GROCERY PRODUCT OR NOT AVAILABLE IN A STORE (e.g. "laptop", "car", "shoes", "airplane", "furniture", "rocket", "gun", "house"), YOU MUST MARK IT AS INVALID! Set "intent": "UNKNOWN", "unmatchedItem": "<item name>", "errorMessage": "Item '<item name>' is not available in our store catalog.", and "spokenResponse": "Item '<item name>' is not available in our store."

2. When user requests to REMOVE an item:
   - Set "intent": "REMOVE_ITEM". Specify the target item name in items[0].name.

3. When user requests to SEARCH or FILTER:
   - Set "intent": "SEARCH_PRODUCTS" or "FILTER_PRODUCTS".

Required Output JSON Schema:
{
  "intent": "ADD_ITEM" | "REMOVE_ITEM" | "UPDATE_QUANTITY" | "SEARCH_PRODUCTS" | "FILTER_PRODUCTS" | "SHOW_SUGGESTIONS" | "CLEAR_LIST" | "UNKNOWN",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "category": "Produce" | "Dairy" | "Bakery" | "Beverages" | "Snacks" | "Pantry" | "Household" | "Personal Care",
      "price": number
    }
  ],
  "searchQuery": "string or null",
  "priceFilter": { "maxPrice": number, "minPrice": number },
  "brand": "string or null",
  "category": "string or null",
  "language": "string",
  "spokenResponse": "string",
  "unmatchedItem": "string or null",
  "errorMessage": "string or null"
}
`;

export async function POST(req: NextRequest) {
  try {
    const { transcript, language = 'en-US' } = await req.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const userPrompt = `User Spoken Transcript: "${transcript}" (Language setting: ${language})`;

    let parsedResult: Partial<VoiceIntentResult> | null = null;

    if (GEMINI_API_KEY) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedResult = JSON.parse(cleanJsonText);
          }
        }
      } catch (geminiError) {
        console.error('Error calling Gemini API:', geminiError);
      }
    }

    if (!parsedResult || !parsedResult.intent) {
      parsedResult = fallbackCatalogNlp(transcript);
    }

    const finalResult: VoiceIntentResult = {
      intent: (parsedResult.intent || 'UNKNOWN') as any,
      items: parsedResult.items || [],
      searchQuery: parsedResult.searchQuery || undefined,
      priceFilter: parsedResult.priceFilter || undefined,
      brand: parsedResult.brand || undefined,
      category: (parsedResult.category as CategoryType) || undefined,
      language: parsedResult.language || language,
      originalTranscript: transcript,
      spokenResponse: parsedResult.spokenResponse || `Processed: "${transcript}"`,
      unmatchedItem: parsedResult.unmatchedItem || undefined,
      errorMessage: parsedResult.errorMessage || undefined
    };

    return NextResponse.json(finalResult);
  } catch (error: any) {
    console.error('NLP Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command', details: error.message },
      { status: 500 }
    );
  }
}

function fallbackCatalogNlp(text: string): Partial<VoiceIntentResult> {
  const lower = text.toLowerCase();

  // Search/Filter
  const priceMatch = lower.match(/under\s*(?:[\$\₹]?)\s*(\d+(?:\.\d+)?)/i);
  if (lower.includes('find') || lower.includes('search') || lower.includes('show') || priceMatch) {
    const maxPrice = priceMatch ? parseFloat(priceMatch[1]) : undefined;
    const query = lower.replace(/find|search|show|under|less|than|\$|\₹|\d+/gi, '').trim();
    return {
      intent: priceMatch ? 'FILTER_PRODUCTS' : 'SEARCH_PRODUCTS',
      searchQuery: query || 'toothpaste',
      priceFilter: maxPrice ? { maxPrice } : undefined,
      spokenResponse: maxPrice ? `Searching products under $${maxPrice}` : `Searching for ${query}`
    };
  }

  // Remove
  if (lower.includes('remove') || lower.includes('delete') || lower.includes('take off')) {
    const itemName = lower.replace(/remove|delete|take off|from my list|my list|from/gi, '').trim();
    return {
      intent: 'REMOVE_ITEM',
      items: [{ name: itemName || 'item', quantity: 1, unit: 'pack' }],
      spokenResponse: `Attempting to remove ${itemName} from your list.`
    };
  }

  // Add Validation
  const nonGroceryKeywords = ['laptop', 'phone', 'car', 'airplane', 'shoes', 'shirt', 'pants', 'bike', 'house', 'tv', 'rocket'];
  for (const invalidKw of nonGroceryKeywords) {
    if (lower.includes(invalidKw)) {
      return {
        intent: 'UNKNOWN',
        unmatchedItem: invalidKw,
        errorMessage: `Item '${invalidKw}' is not available in our store catalog.`,
        spokenResponse: `Item '${invalidKw}' is not available in our store catalog.`
      };
    }
  }

  // Default Add
  const qtyMatch = lower.match(/(\d+(?:\.\d+)?)/);
  const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
  const cleanName = lower.replace(/add|buy|i need|i want|to my list|bottles of|kg of|packs of|\d+/gi, '').trim();

  return {
    intent: 'ADD_ITEM',
    items: [{ name: cleanName || 'Milk', quantity: qty, unit: 'pack', category: 'Dairy', price: 3.50 }],
    spokenResponse: `Processing addition of ${cleanName || 'item'}.`
  };
}
