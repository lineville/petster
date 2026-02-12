/**
 * API client for the Petster FastAPI backend.
 */

const BASE = "/api/v1"

// ── Types matching backend schemas ──────────────────────────────────────────

export interface DogOut {
  id: number
  name: string
  breed: string
  size: "small" | "medium" | "large" | "extra_large"
  age_years: number
  weight_lbs: number
  color: string
  description: string | null
  sex: "male" | "female"
  coat_length: "short" | "medium" | "long" | "wire" | "hairless"
  is_rescue: boolean
  good_with_cats: boolean
  good_with_kids: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface SwipeCard {
  dog: DogOut
  compatibility_score: number | null
}

export interface SwipeRequest {
  dog_id: number
  direction: "left" | "right"
}

export interface SwipeOut {
  id: number
  user_id: number
  dog_id: number
  direction: "left" | "right"
  created_at: string
}

export interface RecommendationOut {
  dogs: DogOut[]
  message: string
}

export interface UserOut {
  id: number
  username: string
  email: string
  created_at: string
}

export interface VisionAnalysisResult {
  breed: string | null
  size: string | null
  color: string | null
  coat_length: string | null
  description: string | null
  confidence: number | null
}

export interface RescueUploadResponse {
  dog: DogOut
  vision_analysis: VisionAnalysisResult
  message: string
}

// ── API functions ───────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

/** List all dogs */
export async function listDogs(skip = 0, limit = 50): Promise<DogOut[]> {
  const res = await fetch(`${BASE}/dogs/?skip=${skip}&limit=${limit}`)
  return handleResponse<DogOut[]>(res)
}

/** Get a single dog */
export async function getDog(id: number): Promise<DogOut> {
  const res = await fetch(`${BASE}/dogs/${id}`)
  return handleResponse<DogOut>(res)
}

/** Create or find demo user (idempotent) */
export async function getOrCreateUser(
  username = "demo_user",
  email = "demo@petster.app"
): Promise<UserOut> {
  // Try to find existing user
  const usersRes = await fetch(`${BASE}/users/`)
  const users = await handleResponse<UserOut[]>(usersRes)
  const existing = users.find((u) => u.username === username)
  if (existing) return existing

  // Create new user
  const res = await fetch(`${BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email }),
  })
  return handleResponse<UserOut>(res)
}

/** Get swipe cards for a user */
export async function getSwipeCards(
  userId: number,
  limit = 10
): Promise<SwipeCard[]> {
  const res = await fetch(`${BASE}/swipe/${userId}/cards?limit=${limit}`)
  return handleResponse<SwipeCard[]>(res)
}

/** Record a swipe */
export async function recordSwipe(
  userId: number,
  dogId: number,
  direction: "left" | "right"
): Promise<SwipeOut> {
  const res = await fetch(`${BASE}/swipe/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dog_id: dogId, direction }),
  })
  return handleResponse<SwipeOut>(res)
}

/** Get recommendations */
export async function getRecommendations(
  userId: number,
  limit = 10
): Promise<RecommendationOut> {
  const res = await fetch(
    `${BASE}/swipe/${userId}/recommendations?limit=${limit}`
  )
  return handleResponse<RecommendationOut>(res)
}

/** Upload a rescue dog image for Azure Vision analysis */
export async function uploadRescueImage(
  image: File,
  fields: {
    name?: string
    age_years?: number
    weight_lbs?: number
    sex?: "male" | "female"
    is_rescue?: boolean
    good_with_cats?: boolean
    good_with_kids?: boolean
  } = {}
): Promise<RescueUploadResponse> {
  const form = new FormData()
  form.append("image", image)
  if (fields.name) form.append("name", fields.name)
  if (fields.age_years !== undefined)
    form.append("age_years", String(fields.age_years))
  if (fields.weight_lbs !== undefined)
    form.append("weight_lbs", String(fields.weight_lbs))
  if (fields.sex) form.append("sex", fields.sex)
  if (fields.is_rescue !== undefined)
    form.append("is_rescue", String(fields.is_rescue))
  if (fields.good_with_cats !== undefined)
    form.append("good_with_cats", String(fields.good_with_cats))
  if (fields.good_with_kids !== undefined)
    form.append("good_with_kids", String(fields.good_with_kids))

  const res = await fetch(`${BASE}/rescue/upload`, {
    method: "POST",
    body: form,
  })
  return handleResponse<RescueUploadResponse>(res)
}

/** Update a dog (PATCH) */
export async function updateDog(
  id: number,
  fields: Partial<DogOut>
): Promise<DogOut> {
  const res = await fetch(`${BASE}/dogs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  })
  return handleResponse<DogOut>(res)
}
