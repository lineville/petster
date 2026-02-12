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

  const endpoint = "https://tingrrr.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview"

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
