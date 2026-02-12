import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type {
  Preferences,
  SwipedDog,
  ProfileResult,
  DogProfile,
} from "@/types"
import {
  getRecommendations,
  getOrCreateUser,
  type DogOut,
} from "@/lib/api"

/** Total local dog images in public/dogs/ */
const LOCAL_DOG_IMAGE_COUNT = 14

function localDogImage(dogId: number): string {
  const index = ((dogId - 1) % LOCAL_DOG_IMAGE_COUNT) + 1
  return `/dogs/dog-${String(index).padStart(2, "0")}.jpg`
}

interface AIGeneratedImage {
  url: string
  description: string
}

interface ResultsPageProps {
  preferences: Preferences
  liked: SwipedDog[]
  disliked: SwipedDog[]
  onStartOver: () => void
}

export function ResultsPage({
  preferences,
  liked,
  disliked,
  onStartOver,
}: ResultsPageProps) {
  const [profile, setProfile] = useState<ProfileResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dogImages, setDogImages] = useState<Record<string, string>>({})
  const [backendRecs, setBackendRecs] = useState<DogOut[]>([])
  const [backendRecsMessage, setBackendRecsMessage] = useState("")
  const [aiImages, setAiImages] = useState<AIGeneratedImage[]>([])
  const [aiImagesLoading, setAiImagesLoading] = useState(true)

  // Fetch backend recommendations — use local images
  useEffect(() => {
    let cancelled = false
    async function loadRecs() {
      try {
        const user = await getOrCreateUser()
        const recs = await getRecommendations(user.id, 6)
        if (cancelled) return
        setBackendRecs(recs.dogs)
        setBackendRecsMessage(recs.message)
      } catch {
        // Non-critical – backend recs are supplementary
      }
    }
    loadRecs()
    return () => { cancelled = true }
  }, [])

  // Generate 3 AI images based on swipe history
  useEffect(() => {
    let cancelled = false
    async function generateImages() {
      try {
        setAiImagesLoading(true)
        const res = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences,
            results: { liked, disliked },
          }),
        })

        if (!res.ok) {
          const errData = (await res.json().catch(() => null)) as {
            error?: string
          } | null
          console.error("AI image generation failed:", errData?.error)
          setAiImagesLoading(false)
          return
        }

        const data = (await res.json()) as { images: AIGeneratedImage[] }
        if (cancelled) return
        setAiImages(data.images)
        setAiImagesLoading(false)
      } catch (err) {
        console.error("AI image generation error:", err)
        if (!cancelled) setAiImagesLoading(false)
      }
    }
    generateImages()
    return () => { cancelled = true }
  }, [preferences, liked, disliked])

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const res = await fetch("/api/generate-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences,
            results: { liked, disliked },
          }),
        })

        if (!res.ok) {
          const errData = (await res.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(
            errData?.error ?? `Failed to generate profile: ${res.statusText}`
          )
        }

        const data: ProfileResult = (await res.json()) as ProfileResult
        if (cancelled) return
        setProfile(data)
        setLoading(false)

        // Map dog profiles to local images
        const imageMap: Record<string, string> = {}
        data.dogProfiles.forEach((dog, i) => {
          imageMap[dog.name] = `/dogs/dog-${String((i % LOCAL_DOG_IMAGE_COUNT) + 1).padStart(2, "0")}.jpg`
        })
        setDogImages(imageMap)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        )
        setLoading(false)
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [preferences, liked, disliked])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorState error={error} onStartOver={onStartOver} />
  }

  if (!profile) return null

  return (
    <div className="space-y-12 pb-16 animate-fade-in">
      {/* Owner Profile Hero */}
      <section className="text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Your Tingrrr Profile
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            {profile.ownerTitle}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {profile.ownerProfile}
          </p>
        </div>
      </section>

      {/* Preferences At-a-Glance */}
      <section>
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground text-center">
            What you're looking for
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">⚡</span>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{
                      marginLeft: `${preferences.energy[0]}%`,
                      width: `${preferences.energy[1] - preferences.energy[0]}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-20 text-right shrink-0">
                {preferences.energy[0]}–{preferences.energy[1]}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">⚖️</span>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-700"
                    style={{
                      marginLeft: `${(preferences.weight[0] / 200) * 100}%`,
                      width: `${((preferences.weight[1] - preferences.weight[0]) / 200) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-20 text-right shrink-0">
                {preferences.weight[0]}–{preferences.weight[1]} lbs
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">🎂</span>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-700"
                    style={{
                      marginLeft: `${(preferences.age[0] / 4) * 100}%`,
                      width: `${((preferences.age[1] - preferences.age[0]) / 4) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-20 text-right shrink-0">
                {AGE_SHORT[preferences.age[0]]}–{AGE_SHORT[preferences.age[1]]}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Breeds */}
      <section>
        <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
          🏆 Top Breed Matches
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.recommendedBreeds.map((breed, i) => (
            <div
              key={breed.breed}
              className="rounded-xl border border-border bg-card p-5 shadow-sm animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">{breed.breed}</h4>
                <span
                  className={`text-sm font-bold ${
                    breed.compatibility >= 90
                      ? "text-green-600"
                      : breed.compatibility >= 80
                        ? "text-emerald-600"
                        : breed.compatibility >= 70
                          ? "text-yellow-600"
                          : "text-orange-600"
                  }`}
                >
                  {breed.compatibility}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                    breed.compatibility >= 90
                      ? "bg-green-500"
                      : breed.compatibility >= 80
                        ? "bg-emerald-500"
                        : breed.compatibility >= 70
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                  }`}
                  style={{ width: `${breed.compatibility}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {breed.reason}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {breed.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dog Profiles Grid */}
      <section>
        <h3 className="text-2xl font-bold text-foreground mb-2 text-center">
          🐕 Your Perfect Matches
        </h3>
        <p className="text-center text-muted-foreground mb-6">
          {profile.dogProfiles.length} dogs handpicked just for you
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.dogProfiles.map((dog, i) => (
            <DogCard
              key={dog.name}
              dog={dog}
              imageUrl={dogImages[dog.name]}
              delay={i * 80}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pt-4">

      {/* 🎨 AI-Generated Recommended Dogs */}
      <section>
        <h3 className="text-2xl font-bold text-foreground mb-2 text-center">
          🎨 AI-Generated Matches
        </h3>
        <p className="text-center text-muted-foreground mb-6">
          Custom dog portraits created just for you based on your swipes
        </p>
        {aiImagesLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground animate-pulse">
              🎨 AI is painting your perfect dogs...
            </p>
          </div>
        ) : aiImages.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-3">
            {aiImages.map((img, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="aspect-square w-full overflow-hidden bg-muted relative">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.description}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100">
                      <span className="text-5xl">🎨</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-100/90 text-violet-700 backdrop-blur-sm">
                      ✨ AI Generated
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {img.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            Could not generate AI images at this time.
          </p>
        )}
      </section>

      {/* Backend-powered recommendations from your swipe history */}
      {backendRecs.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-foreground mb-2 text-center">
            🐾 Real Dogs Available Now
          </h3>
          <p className="text-center text-muted-foreground mb-6">
            {backendRecsMessage}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {backendRecs.map((dog, i) => {
              const imgUrl = localDogImage(dog.id)
              return (
                <div
                  key={dog.id}
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="aspect-square w-full overflow-hidden bg-muted relative">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={dog.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-5xl animate-pulse">🐕</span>
                      </div>
                    )}
                    {dog.is_rescue && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100/90 text-amber-700 backdrop-blur-sm">
                          🏠 Rescue
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-lg font-bold text-foreground">{dog.name}</h4>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {dog.breed}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dog.description}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                      <span>🎂 {dog.age_years} yrs</span>
                      <span>⚖️ {dog.weight_lbs} lbs</span>
                      <span>{dog.sex === "male" ? "♂️" : "♀️"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dog.good_with_kids && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                          👶 Kids
                        </span>
                      )}
                      {dog.good_with_cats && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                          🐱 Cats
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

        <Button variant="outline" size="lg" onClick={onStartOver} className="rounded-full">
          ← Start Over
        </Button>
      </section>
    </div>
  )
}

const AGE_SHORT = ["Puppy", "Young", "Adult", "Senior", "Elderly"]

function DogCard({
  dog,
  imageUrl,
  delay,
}: {
  dog: DogProfile
  imageUrl?: string
  delay: number
}) {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted relative">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={dog.name}
            className={`h-full w-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />
        )}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl animate-pulse">🐕</span>
          </div>
        )}
        {/* Energy badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
              dog.energy === "Very High" || dog.energy === "High"
                ? "bg-orange-100/90 text-orange-700"
                : dog.energy === "Medium"
                  ? "bg-blue-100/90 text-blue-700"
                  : "bg-green-100/90 text-green-700"
            }`}
          >
            ⚡ {dog.energy}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <h4 className="text-lg font-bold text-foreground">{dog.name}</h4>
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {dog.breed}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {dog.personality}
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground pt-1">
          <span>🎂 {dog.age}</span>
          <span>⚖️ {dog.weight}</span>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative h-24 w-72">
        {/* Ground line */}
        <div className="absolute bottom-2 left-0 right-0 h-px bg-border" />

        {/* Bouncing tennis ball */}
        <div className="absolute bottom-3 animate-[ballBounce_2s_ease-in-out_infinite]">
          <span className="text-2xl">🎾</span>
        </div>

        {/* Running dog (chases ball, jumps up and down) */}
        <div className="absolute bottom-2 animate-[dogRun_2s_ease-in-out_infinite]">
          <span className="text-4xl inline-block animate-[dogJump_0.5s_ease-in-out_infinite]">
            🐕‍🦺
          </span>
        </div>
      </div>

      {/* Paw prints trail */}
      <div className="flex gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="text-sm opacity-0 animate-[fadeInOut_2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 300}ms` }}
          >
            🐾
          </span>
        ))}
      </div>

      <p className="text-muted-foreground animate-pulse text-lg">
        ✨ Fetching your perfect matches...
      </p>

      <style>{`
        /* Ball: bounces from right to left, then instantly resets */
        @keyframes ballBounce {
          0%   { left: 90%; transform: translateY(0); }
          15%  { left: 70%; transform: translateY(-24px); }
          30%  { left: 50%; transform: translateY(0); }
          45%  { left: 35%; transform: translateY(-16px); }
          60%  { left: 20%; transform: translateY(0); }
          70%  { left: 10%; transform: translateY(-10px); }
          80%  { left: 5%;  transform: translateY(0); }
          80.01% { left: 90%; transform: translateY(0); }
          100% { left: 90%; transform: translateY(0); }
        }

        /* Dog: runs from right to left, then instantly resets */
        @keyframes dogRun {
          0%   { left: 100%; }
          80%  { left: 15%; }
          80.01% { left: 100%; }
          100% { left: 100%; }
        }

        @keyframes dogJump {
          0%   { transform: translateY(0) rotate(-2deg); }
          50%  { transform: translateY(-12px) rotate(2deg); }
          100% { transform: translateY(0) rotate(-2deg); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function ErrorState({
  error,
  onStartOver,
}: {
  error: string
  onStartOver: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="text-6xl">😿</div>
      <h2 className="text-2xl font-bold text-foreground">
        Oops, something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md">{error}</p>
      <Button variant="outline" onClick={onStartOver}>
        ← Start Over
      </Button>
    </div>
  )
}
