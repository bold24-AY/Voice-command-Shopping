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
You must parse spoken user transcripts in ANY language into a strict JSON intent object.

SUPPORTED LANGUAGES: English, Hindi (हिंदी), Gujarati (ગુજરાતી), Spanish (Español), French (Français).

STORE CATALOG PRODUCTS:
${DEFAULT_CATALOG_ITEMS.map(p => `- ${p}`).join('\n')}

MULTILINGUAL KEYWORD MAPPING (always normalize to English catalog names):
- Milk / दूध (doodh) / દૂધ (doodh) / Leche / Lait → "Fresh Whole Milk"
- Almond Milk / बादाम दूध / બદામ દૂધ → "Organic Almond Milk"
- Bread / रोटी / ब्रेड / રોટી / બ્રેડ / Pan / Pain → "Brown Whole Wheat Bread"
- Eggs / अंडे / ઇંડા / Huevos / Œufs → "Farm Fresh Eggs"
- Apples / सेब / સફરજન / Manzanas / Pommes → "Organic Apples (Gala)"
- Bananas / केले / કેળા / Plátanos / Bananes → "Organic Bananas"
- Mangoes / आम / કેરી / Mangos / Mangues → "Fresh Alphonso Mangoes"
- Rice / चावल / ચોખા / Arroz / Riz → "Basmati Rice Premium 5kg"
- Honey / शहद / મધ / Miel → "Natural Organic Honey"
- Yogurt / दही / દહીં / Yogur / Yaourt → "Greek Yogurt Vanilla"
- Toothpaste / टूथपेस्ट / ટૂથપેસ્ટ / Pasta de dientes / Dentifrice → "Colgate Total Toothpaste"
- Tea / चाय / ચા / Té / Thé → "Green Tea Mint & Lemon"
- Water / पानी / પાણી / Agua / Eau → "Sparkling Water 6-Pack"
- Chocolate / चॉकलेट / ચૉકલેટ / Chocolat → "Dark Chocolate 70%"
- Coffee / कॉफी / કૉફી / Café → "Arabica Coffee Beans"
- Cheese / पनीर/चीज / ચીઝ / Queso / Fromage → "Cheddar Cheese Slices"
- Oats / ओट्स / ઓટ્સ / Avena / Avoine → "Rolled Oats 1kg"

ADD INTENT EXAMPLES:
- "Add 2 bottles of milk" → ADD_ITEM, name: "Fresh Whole Milk", qty: 2, unit: "bottle"
- "दूध और दो किलो सेब जोड़ो" → ADD_ITEM, items: [Fresh Whole Milk qty:1, Organic Apples qty:2 unit:kg]
- "બે કિલો સફરજન ઉમેરો" → ADD_ITEM, name: "Organic Apples (Gala)", qty: 2, unit: "kg"
- "Añadir 3 huevos" → ADD_ITEM, name: "Farm Fresh Eggs", qty: 3, unit: "dozen"
- "Ajouter du lait et du pain" → ADD_ITEM, items: [Fresh Whole Milk qty:1, Brown Whole Wheat Bread qty:1]
- "मुझे केले चाहिए" → ADD_ITEM, name: "Organic Bananas", qty: 1, unit: "bunch"
- "ચા ઉમેરો" → ADD_ITEM, name: "Green Tea Mint & Lemon", qty: 1, unit: "box"

REMOVE INTENT EXAMPLES:
- "Remove bread" → REMOVE_ITEM, name: "Brown Whole Wheat Bread"
- "दूध हटाओ" → REMOVE_ITEM, name: "Fresh Whole Milk"
- "દૂધ દૂર કરો" → REMOVE_ITEM, name: "Fresh Whole Milk"
- "Eliminar leche" → REMOVE_ITEM, name: "Fresh Whole Milk"

SEARCH EXAMPLES:
- "Find toothpaste under $5" → FILTER_PRODUCTS, searchQuery: "toothpaste", priceFilter: {maxPrice: 5}
- "Show organic items" → SEARCH_PRODUCTS, searchQuery: "organic"
- "ऑर्गेनिक आइटम दिखाओ" → SEARCH_PRODUCTS, searchQuery: "organic"

INVALID ITEM EXAMPLES (NOT grocery, must REJECT):
- "Add laptop" → UNKNOWN, errorMessage: "Item 'laptop' is not available in our store catalog."
- "Buy a car" → UNKNOWN, errorMessage: "Item 'car' is not available in our store catalog."

CRITICAL RULES:
1. Always normalize item names to English catalog product names.
2. spokenResponse should be in the SAME LANGUAGE as the user's input.
   - If Hindi input → respond in Hindi (e.g. "2 बोतल दूध आपकी सूची में जोड़ दिया गया है।")
   - If Gujarati input → respond in Gujarati (e.g. "2 બોટલ દૂધ તમારી યાદીમાં ઉમેરવામાં આવ્યું છે.")
   - If Spanish input → respond in Spanish
   - If French input → respond in French
   - If English → respond in English
3. Return ONLY raw JSON without markdown backticks.

Required Output JSON Schema:
{
  "intent": "ADD_ITEM" | "REMOVE_ITEM" | "UPDATE_QUANTITY" | "SEARCH_PRODUCTS" | "FILTER_PRODUCTS" | "SHOW_SUGGESTIONS" | "CLEAR_LIST" | "UNKNOWN",
  "items": [{"name": "string", "quantity": number, "unit": "string", "category": "Produce"|"Dairy"|"Bakery"|"Beverages"|"Snacks"|"Pantry"|"Household"|"Personal Care", "price": number}],
  "searchQuery": "string or null",
  "priceFilter": {"maxPrice": number, "minPrice": number},
  "brand": "string or null",
  "category": "string or null",
  "language": "string",
  "spokenResponse": "string (in same language as input)",
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

// Multilingual keyword → catalog name map for the fallback parser
const MULTILANG_CATALOG_MAP: { keywords: string[]; catalog: string; category: CategoryType; unit: string; price: number }[] = [
  { keywords: ['दूध','doodh','leche','lait','milk','દૂધ'], catalog: 'Fresh Whole Milk', category: 'Dairy', unit: 'bottle', price: 3.50 },
  { keywords: ['बादाम दूध','almond milk','badaam','amande','almendra','બદામ દૂધ'], catalog: 'Organic Almond Milk', category: 'Dairy', unit: 'carton', price: 4.99 },
  { keywords: ['रोटी','ब्रेड','bread','pain','pan','rødd','bröd','બ્રેડ','રોટી'], catalog: 'Brown Whole Wheat Bread', category: 'Bakery', unit: 'loaf', price: 2.99 },
  { keywords: ['अंडे','anda','egg','huevo','oeuf','ઇંડા'], catalog: 'Farm Fresh Eggs', category: 'Produce', unit: 'dozen', price: 4.25 },
  { keywords: ['सेब','safarchand','apple','manzana','pomme','સફરજન'], catalog: 'Organic Apples (Gala)', category: 'Produce', unit: 'kg', price: 3.99 },
  { keywords: ['केला','kela','banana','plátano','banane','કેળા'], catalog: 'Organic Bananas', category: 'Produce', unit: 'bunch', price: 1.80 },
  { keywords: ['आम','keri','mango','mangue','mango','કેરી'], catalog: 'Fresh Alphonso Mangoes', category: 'Produce', unit: 'kg', price: 6.50 },
  { keywords: ['चावल','chawal','rice','riz','arroz','ચોખા'], catalog: 'Basmati Rice Premium 5kg', category: 'Pantry', unit: 'pack', price: 14.99 },
  { keywords: ['शहद','madh','honey','miel','miel','મધ'], catalog: 'Natural Organic Honey', category: 'Pantry', unit: 'jar', price: 7.99 },
  { keywords: ['दही','dahi','yogurt','yaourt','yogur','દહીં'], catalog: 'Greek Yogurt Vanilla', category: 'Dairy', unit: 'cup', price: 2.49 },
  { keywords: ['टूथपेस्ट','toothpaste','dentifrice','pasta dientes','ટૂથપેસ્ટ'], catalog: 'Colgate Total Toothpaste', category: 'Personal Care', unit: 'tube', price: 4.50 },
  { keywords: ['चाय','chai','tea','thé','té','cha','ચા'], catalog: 'Green Tea Mint & Lemon', category: 'Beverages', unit: 'box', price: 5.20 },
  { keywords: ['पानी','paani','water','eau','agua','પાણી'], catalog: 'Sparkling Water 6-Pack', category: 'Beverages', unit: 'pack', price: 6.99 },
  { keywords: ['चॉकलेट','chocolate','chocolat','ચૉકલેટ'], catalog: 'Dark Chocolate 70%', category: 'Snacks', unit: 'bar', price: 3.80 },
  { keywords: ['कॉफी','coffee','café','kaffa','કૉફી'], catalog: 'Arabica Coffee Beans', category: 'Beverages', unit: 'pack', price: 8.99 },
  { keywords: ['पनीर','cheese','fromage','queso','ચીઝ'], catalog: 'Cheddar Cheese Slices', category: 'Dairy', unit: 'pack', price: 3.49 },
  { keywords: ['ओट्स','oats','avoine','avena','ઓટ્સ'], catalog: 'Rolled Oats 1kg', category: 'Pantry', unit: 'pack', price: 4.99 },
];

const MULTILANG_REMOVE_KEYWORDS = ['remove','delete','take off','हटाओ','निकालो','दूर करो','दूर कर','हटा','मिटाओ','eliminar','supprimer','retirer','દૂર','હટાવ','ઉમેરો'];
const MULTILANG_ADD_KEYWORDS    = ['add','buy','need','want','जोड़ो','जोड़','चाहिए','लाओ','खरीदो','ले आओ','ઉમેરો','LE','añadir','ajouter','acheter','je veux','necesito'];

function resolveCatalogItem(text: string): { catalog: string; category: CategoryType; unit: string; price: number } | null {
  const lower = text.toLowerCase();
  for (const entry of MULTILANG_CATALOG_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        return { catalog: entry.catalog, category: entry.category, unit: entry.unit, price: entry.price };
      }
    }
  }
  return null;
}

function fallbackCatalogNlp(text: string): Partial<VoiceIntentResult> {
  const lower = text.toLowerCase();

  // Search/Filter
  const priceMatch = lower.match(/under\s*(?:[\$\₹]?)\s*(\d+(?:\.\d+)?)/i);
  if (lower.includes('find') || lower.includes('search') || lower.includes('show') || lower.includes('ढूंढ') || lower.includes('शोध') || priceMatch) {
    const maxPrice = priceMatch ? parseFloat(priceMatch[1]) : undefined;
    const query = lower.replace(/find|search|show|under|less|than|\$|\₹|\d+/gi, '').trim();
    return {
      intent: priceMatch ? 'FILTER_PRODUCTS' : 'SEARCH_PRODUCTS',
      searchQuery: query || 'organic',
      priceFilter: maxPrice ? { maxPrice } : undefined,
      spokenResponse: maxPrice ? `Searching products under $${maxPrice}` : `Searching for ${query}`
    };
  }

  // Detect REMOVE intent in any language
  const isRemove = MULTILANG_REMOVE_KEYWORDS.some(kw => lower.includes(kw));
  if (isRemove) {
    // Try to resolve what item to remove
    const resolved = resolveCatalogItem(lower);
    const cleanName = resolved
      ? resolved.catalog
      : lower.replace(new RegExp(MULTILANG_REMOVE_KEYWORDS.join('|'), 'gi'), '').replace(/from my list|my list|from|list/gi, '').trim();
    return {
      intent: 'REMOVE_ITEM',
      items: [{ name: cleanName || 'item', quantity: 1, unit: 'pack' }],
      spokenResponse: `Removing ${cleanName} from your list.`
    };
  }

  // Reject clearly non-grocery items
  const nonGroceryKeywords = ['laptop','phone','car','airplane','shoes','shirt','pants','bike','house','tv','rocket','gun','sofa','furniture'];
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

  // Try to resolve ADD intent via multilingual map
  const resolved = resolveCatalogItem(lower);
  const qtyMatch = lower.match(/(\d+(?:\.\d+)?)/);
  const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;

  if (resolved) {
    return {
      intent: 'ADD_ITEM',
      items: [{ name: resolved.catalog, quantity: qty, unit: resolved.unit, category: resolved.category, price: resolved.price }],
      spokenResponse: `Adding ${qty} ${resolved.unit} of ${resolved.catalog} to your list.`
    };
  }

  // Last-resort generic add
  const cleanName = lower.replace(new RegExp(MULTILANG_ADD_KEYWORDS.join('|'), 'gi'), '').replace(/\d+|kg|bottles|bottle|pack|packs/gi, '').trim();
  return {
    intent: 'ADD_ITEM',
    items: [{ name: cleanName || 'item', quantity: qty, unit: 'pack', category: 'Pantry', price: 3.50 }],
    spokenResponse: `Processing addition of ${cleanName || 'item'}.`
  };
}
