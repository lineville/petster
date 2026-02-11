export interface Preferences {
  energy: number[]
  weight: number[]
  age: number[]
}

export interface SwipedDog {
  name: string
  breed: string
  age: string
  weight: string
  energy: string
  bio: string
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
