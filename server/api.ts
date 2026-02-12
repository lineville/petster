import type { IncomingMessage } from "http"

const AGE_LABELS = [
  "Puppy (0–1 yr)",
  "Young (1–3 yrs)",
  "Adult (3–7 yrs)",
  "Senior (7–10 yrs)",
  "Elderly (10+ yrs)",
]

interface SwipedDog {
  name: string
  breed: string
  age: string
  weight: string
  energy: string
  bio: string
}

interface RequestBody {
  preferences: {
    energy: number[]
    weight: number[]
    age: number[]
  }
  results: {
    liked: SwipedDog[]
    disliked: SwipedDog[]
  }
}

export function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ""
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on("end", () => resolve(body))
  })
}

export async function generateProfile(body: RequestBody, apiKey: string) {
  const { preferences, results } = body

  const prompt = `You are a dog breed expert and matchmaker. Based on the user's preferences and their swipe behavior on dog profiles, generate a personalized dog owner profile and recommend suitable dogs.

User Preferences:
- Energy level range: ${preferences.energy[0]}% – ${preferences.energy[1]}%
- Weight range: ${preferences.weight[0]} – ${preferences.weight[1]} lbs
- Age preference: ${AGE_LABELS[preferences.age[0]]} to ${AGE_LABELS[preferences.age[1]]}

Swiping Results:
Liked: ${results.liked.map((d) => `${d.name} (${d.breed}, ${d.age}, ${d.weight}, ${d.energy} energy)`).join(", ") || "None"}
Disliked: ${results.disliked.map((d) => `${d.name} (${d.breed}, ${d.age}, ${d.weight}, ${d.energy} energy)`).join(", ") || "None"}

Based on this information, provide:
1. A fun, personalized "dog owner title" (e.g., "The Active Adventurer", "The Cozy Companion Seeker")
2. A 2-3 sentence profile description of what kind of dog owner they'd be
3. 5 recommended dog breeds with compatibility scores (0-100) and reasons
4. 12 individual dog profiles with creative names, realistic ages/weights, energy levels, and short personality descriptions. Use breeds from your recommendations. Each dog should feel unique and have a distinct personality.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "ownerTitle": "string",
  "ownerProfile": "string",
  "recommendedBreeds": [
    {
      "breed": "string",
      "reason": "string",
      "compatibility": number,
      "traits": ["string", "string", "string"]
    }
  ],
  "dogProfiles": [
    {
      "name": "string",
      "breed": "string",
      "age": "string (e.g. '2 yrs')",
      "weight": "string (e.g. '65 lbs')",
      "energy": "string (Low/Medium/High/Very High)",
      "personality": "string (2-3 sentences)"
    }
  ]
}`

  const endpoint = "https://petster.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview"

  console.log("[tingrrr] Calling Azure OpenAI:", endpoint)

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a helpful dog breed expert. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    }),
  })

  const rawText = await response.text()
  console.log("[tingrrr] Response status:", response.status)
  try {
    console.log("[tingrrr] Raw response:", JSON.stringify(JSON.parse(rawText), null, 2))
  } catch {
    console.log("[tingrrr] Raw response (not JSON):", rawText)
  }

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.status} ${rawText}`)
  }

  const data = JSON.parse(rawText) as {
    choices: Array<{ message: { content: string } }>
  }
  const content = data.choices[0].message.content
  return JSON.parse(content) as Record<string, unknown>
}

/**
 * Map of breed names to dog.ceo API paths for fetching real photos.
 */
const BREED_API_MAP: Record<string, string> = {
  "golden retriever": "retriever/golden",
  "labrador retriever": "retriever/labrador",
  labrador: "labrador",
  "french bulldog": "bulldog/french",
  "english bulldog": "bulldog/english",
  "border collie": "collie/border",
  "german shepherd": "germanshepherd",
  "bernese mountain dog": "mountain/bernese",
  "australian shepherd": "australian/shepherd",
  "siberian husky": "husky",
  husky: "husky",
  poodle: "poodle/standard",
  beagle: "beagle",
  boxer: "boxer",
  dachshund: "dachshund",
  pomeranian: "pomeranian",
  "shih tzu": "shihtzu",
  "yorkshire terrier": "terrier/yorkshire",
  chihuahua: "chihuahua",
  "great dane": "dane/great",
  doberman: "doberman",
  rottweiler: "rottweiler",
  corgi: "corgi/cardigan",
  maltese: "maltese",
  samoyed: "samoyed",
  akita: "akita",
  dalmatian: "dalmatian",
  greyhound: "greyhound",
  "pit bull": "pitbull",
  "shiba inu": "shiba",
  malamute: "malamute",
  "cocker spaniel": "spaniel/cocker",
  "irish setter": "setter/irish",
  "basset hound": "hound/basset",
  newfoundland: "newfoundland",
  "saint bernard": "stbernard",
  papillon: "papillon",
  "chow chow": "chow",
  mastiff: "mastiff/english",
  whippet: "whippet",
  vizsla: "vizsla",
  weimaraner: "weimaraner",
  havanese: "havanese",
}

async function fetchBreedPhoto(breed: string): Promise<string> {
  const key = breed.toLowerCase().trim()
  const mapped = BREED_API_MAP[key]
  if (mapped) {
    try {
      const res = await fetch(`https://dog.ceo/api/breed/${mapped}/images/random`)
      const data = (await res.json()) as { status: string; message: string }
      if (data.status === "success") return data.message
    } catch { /* fall through */ }
  }
  // Fallback to random dog image
  try {
    const res = await fetch("https://dog.ceo/api/breeds/image/random")
    const data = (await res.json()) as { status: string; message: string }
    if (data.status === "success") return data.message
  } catch { /* ignore */ }
  return ""
}

/**
 * Given the user's swipe history, generate 3 recommended dog profiles via GPT
 * and fetch real breed photos from dog.ceo.
 */
export async function generateRecommendedImages(
  body: RequestBody,
  apiKey: string
): Promise<{ images: Array<{ url: string; description: string; breed: string }> }> {
  const { preferences, results } = body

  const promptRequest = `Based on this user's dog preferences and swiping behavior, recommend exactly 3 specific dog breeds they would love.

User Preferences:
- Energy level range: ${preferences.energy[0]}% – ${preferences.energy[1]}%
- Weight range: ${preferences.weight[0]} – ${preferences.weight[1]} lbs
- Age preference: ${AGE_LABELS[preferences.age[0]]} to ${AGE_LABELS[preferences.age[1]]}

Dogs they LIKED: ${results.liked.map((d) => `${d.name} (${d.breed}, ${d.age}, ${d.weight})`).join(", ") || "None"}
Dogs they DISLIKED: ${results.disliked.map((d) => `${d.name} (${d.breed}, ${d.age}, ${d.weight})`).join(", ") || "None"}

For each recommendation, provide:
- "breed": The exact breed name (e.g. "Golden Retriever", "Beagle", "Siberian Husky")
- "description": A fun 1-2 sentence description of why this breed is a great match for them, including suggested age and personality traits.

Return ONLY valid JSON:
{
  "recommendations": [
    { "breed": "string", "description": "string" },
    { "breed": "string", "description": "string" },
    { "breed": "string", "description": "string" }
  ]
}`

  const gptEndpoint =
    "https://petster.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview"

  console.log("[tingrrr] Generating breed recommendations via GPT...")
  const gptRes = await fetch(gptEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a dog breed expert. Always respond with valid JSON." },
        { role: "user", content: promptRequest },
      ],
      temperature: 0.9,
    }),
  })

  if (!gptRes.ok) {
    const errText = await gptRes.text()
    throw new Error(`GPT breed recommendation failed: ${gptRes.status} ${errText}`)
  }

  const gptData = (await gptRes.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const recs = JSON.parse(gptData.choices[0].message.content) as {
    recommendations: Array<{ breed: string; description: string }>
  }

  console.log("[tingrrr] Recommended breeds:", recs.recommendations.map((r) => r.breed))

  // Step 2: Fetch real breed photos from dog.ceo
  const imageResults: Array<{ url: string; description: string; breed: string }> = []

  for (const rec of recs.recommendations) {
    const url = await fetchBreedPhoto(rec.breed)
    console.log("[tingrrr] Fetched photo for", rec.breed, ":", url ? "OK" : "fallback")
    imageResults.push({
      url,
      description: rec.description,
      breed: rec.breed,
    })
  }

  return { images: imageResults }
}
