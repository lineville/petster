export interface Preferences {
  energy: number[]
  weight: number[]
  age: number[]
}

export interface BackendDog {
  id: number
  name: string
  breed: string
  size: string
  age_years: number
  weight_lbs: number
  color: string
  description: string | null
  sex: string
  coat_length: string
  is_rescue: boolean
  good_with_cats: boolean
  good_with_kids: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface SwipedDog {
  name: string
  breed: string
  size: string
  age_years: number
  weight_lbs: number
  description: string
}

export interface BreedRecommendation {
  breed: string
  reason: string
  compatibility: number
  traits: string[]
}

export interface DogProfile {
  name: string
  breed: string
  age: string
  weight: string
  energy: string
  personality: string
  imageUrl?: string
}

export interface ProfileResult {
  ownerTitle: string
  ownerProfile: string
  recommendedBreeds: BreedRecommendation[]
  dogProfiles: DogProfile[]
}
