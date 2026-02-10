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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const content = data.choices[0].message.content
  return JSON.parse(content) as Record<string, unknown>
}

export function getMockProfile() {
  return {
    ownerTitle: "The Balanced Companion Seeker",
    ownerProfile:
      "You're looking for a well-rounded furry friend who can keep up with your moderately active lifestyle but also knows when it's time to chill on the couch. You appreciate a dog with personality and aren't afraid of a little extra fluff.",
    recommendedBreeds: [
      {
        breed: "Golden Retriever",
        reason:
          "The ultimate family dog that matches your energy range perfectly. Friendly, loyal, and always ready for adventure or relaxation.",
        compatibility: 95,
        traits: ["Friendly", "Loyal", "Adaptable"],
      },
      {
        breed: "Labrador Retriever",
        reason:
          "Versatile and eager to please, Labs fit right into your preferred weight and energy range.",
        compatibility: 92,
        traits: ["Outgoing", "Trainable", "Gentle"],
      },
      {
        breed: "Australian Shepherd",
        reason:
          "Smart and athletic, perfect for someone who wants an engaged, responsive companion.",
        compatibility: 88,
        traits: ["Intelligent", "Active", "Devoted"],
      },
      {
        breed: "Bernese Mountain Dog",
        reason:
          "A gentle giant who loves outdoor activities but is equally happy lounging at home.",
        compatibility: 82,
        traits: ["Calm", "Affectionate", "Strong"],
      },
      {
        breed: "Border Collie",
        reason:
          "Incredibly smart and energetic, ideal if you want a dog that challenges you.",
        compatibility: 78,
        traits: ["Brilliant", "Athletic", "Focused"],
      },
    ],
    dogProfiles: [
      {
        name: "Charlie",
        breed: "Golden Retriever",
        age: "2 yrs",
        weight: "68 lbs",
        energy: "High",
        personality:
          "Charlie is the life of every dog park. He greets everyone with a wagging tail and has never met a tennis ball he didn't love.",
      },
      {
        name: "Daisy",
        breed: "Golden Retriever",
        age: "1 yr",
        weight: "55 lbs",
        energy: "High",
        personality:
          "A gentle soul with boundless enthusiasm. Daisy specializes in making bad days better with her goofy smile.",
      },
      {
        name: "Cooper",
        breed: "Labrador Retriever",
        age: "3 yrs",
        weight: "72 lbs",
        energy: "High",
        personality:
          "Cooper is an expert swimmer and treat negotiator. He'll do anything for a belly rub and a game of fetch.",
      },
      {
        name: "Rosie",
        breed: "Labrador Retriever",
        age: "1 yr",
        weight: "58 lbs",
        energy: "Medium",
        personality:
          "Sweet and soulful, Rosie loves long walks followed by longer naps. She's mastered the puppy eyes.",
      },
      {
        name: "Maverick",
        breed: "Australian Shepherd",
        age: "2 yrs",
        weight: "52 lbs",
        energy: "Very High",
        personality:
          "Maverick is smarter than most humans and twice as fast. He needs a job or he'll reorganize your sock drawer.",
      },
      {
        name: "Willow",
        breed: "Australian Shepherd",
        age: "4 yrs",
        weight: "45 lbs",
        energy: "High",
        personality:
          "Graceful and devoted, Willow is your shadow. She'll herd your kids, your cats, and occasionally your guests.",
      },
      {
        name: "Atlas",
        breed: "Bernese Mountain Dog",
        age: "3 yrs",
        weight: "95 lbs",
        energy: "Medium",
        personality:
          "A majestic gentle giant who thinks he's a lap dog. Atlas loves snow, hugs, and stealing the warmest spot on the couch.",
      },
      {
        name: "Stella",
        breed: "Bernese Mountain Dog",
        age: "2 yrs",
        weight: "88 lbs",
        energy: "Medium",
        personality:
          "Stella has the patience of a saint and the fluffiness of a cloud. She'll lean against your legs and never want to leave your side.",
      },
      {
        name: "Scout",
        breed: "Border Collie",
        age: "1 yr",
        weight: "38 lbs",
        energy: "Very High",
        personality:
          "Scout learned three tricks on his first day home. He needs mental stimulation like humans need coffee — constantly.",
      },
      {
        name: "Indie",
        breed: "Border Collie",
        age: "3 yrs",
        weight: "42 lbs",
        energy: "High",
        personality:
          "Independent but loyal, Indie is the perfect adventure companion. She'll hike all day and curl up by the fire all night.",
      },
      {
        name: "Oakley",
        breed: "Golden Retriever",
        age: "5 yrs",
        weight: "70 lbs",
        energy: "Medium",
        personality:
          "A distinguished gentleman who has mellowed beautifully with age. Oakley is calm, wise, and gives the best hugs.",
      },
      {
        name: "Penny",
        breed: "Labrador Retriever",
        age: "2 yrs",
        weight: "62 lbs",
        energy: "High",
        personality:
          "Penny is pure sunshine in dog form. She'll make friends with everyone and has a particular talent for finding mud puddles.",
      },
    ],
  }
}
