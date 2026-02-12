import { useState, useEffect, useRef, type TouchEvent, type MouseEvent } from "react"
import { Heart, X, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SwipedDog } from "@/types"
import {
  getSwipeCards,
  recordSwipe,
  getOrCreateUser,
  resetSwipes,
  type DogOut,
  type SwipeCard as SwipeCardType,
} from "@/lib/api"

const BREED_IMAGE_MAP: Record<string, string> = {
  "golden retriever": "retriever/golden",
  "labrador retriever": "retriever/labrador",
  "german shepherd": "germanshepherd",
  "french bulldog": "bulldog/french",
  beagle: "beagle",
  poodle: "poodle/standard",
  rottweiler: "rottweiler",
  "australian shepherd": "australian/shepherd",
  boxer: "boxer",
  "yorkshire terrier": "terrier/yorkshire",
  "siberian husky": "husky",
  dachshund: "dachshund",
  "bernese mountain dog": "mountain/bernese",
  "shih tzu": "shihtzu",
  "great dane": "dane/great",
  "pit bull terrier": "pitbull",
  corgi: "corgi/cardigan",
  "doberman pinscher": "doberman",
  pomeranian: "pomeranian",
  "border collie": "collie/border",
  "cavalier king charles spaniel": "spaniel/cocker",
  "irish setter": "setter/irish",
  "great pyrenees": "pyrenees",
  samoyed: "samoyed",
  dalmatian: "dalmatian",
  "miniature schnauzer": "schnauzer/miniature",
}

async function fetchBreedImage(breed: string): Promise<string> {
  const key = breed.toLowerCase().trim()
  const mapped = BREED_IMAGE_MAP[key]
  if (mapped) {
    try {
      const res = await fetch(`https://dog.ceo/api/breed/${mapped}/images/random`)
      const data = (await res.json()) as { status: string; message: string }
      if (data.status === "success") return data.message
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch("https://dog.ceo/api/breeds/image/random")
    const data = (await res.json()) as { status: string; message: string }
    if (data.status === "success") return data.message
  } catch { /* ignore */ }
  return ""
}

function sizeLabel(s: string) {
  return { small: "Small", medium: "Medium", large: "Large", extra_large: "XL" }[s] ?? s
}

const SWIPE_THRESHOLD = 100

const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra Large",
}

export function SwipeCards({ onBack, onComplete }: { onBack: () => void; onComplete: (liked: SwipedDog[], disliked: SwipedDog[]) => void }) {
  const [cards, setCards] = useState<SwipeCardType[]>([])
  const [images, setImages] = useState<Record<number, string>>({})
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
  const [liked, setLiked] = useState<DogOut[]>([])
  const [disliked, setDisliked] = useState<DogOut[]>([])
  const startX = useRef(0)

  // Load user + cards from backend
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const user = await getOrCreateUser()
        if (cancelled) return
        setUserId(user.id)

        const swipeCards = await getSwipeCards(user.id, 20)
        if (cancelled) return
        setCards(swipeCards)
        setLoading(false)

        // Fetch breed images in parallel
        const imgPromises = swipeCards.map(async (sc) => {
          const url = sc.dog.image_url || (await fetchBreedImage(sc.dog.breed))
          return { id: sc.dog.id, url }
        })
        const imgs = await Promise.all(imgPromises)
        if (cancelled) return
        const map: Record<number, string> = {}
        for (const { id, url } of imgs) map[id] = url
        setImages(map)
      } catch (err) {
        console.error("Failed to load swipe cards:", err)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const done = currentIndex >= cards.length

  function handleStart(x: number) {
    if (done) return
    startX.current = x
    setIsDragging(true)
  }

  function handleMove(x: number) {
    if (!isDragging) return
    setOffsetX(x - startX.current)
  }

  function handleEnd() {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(offsetX) > SWIPE_THRESHOLD) {
      swipe(offsetX > 0 ? "right" : "left")
    } else {
      setOffsetX(0)
    }
  }

  function swipe(direction: "left" | "right") {
    if (done) return
    const dog = cards[currentIndex].dog
    if (direction === "right") {
      setLiked((prev) => [...prev, dog])
    } else {
      setDisliked((prev) => [...prev, dog])
    }

    // Record swipe to backend
    if (userId) {
      recordSwipe(userId, dog.id, direction).catch(console.error)
    }

    setExitDirection(direction)
    setTimeout(() => {
      setCurrentIndex((i) => i + 1)
      setOffsetX(0)
      setExitDirection(null)
    }, 300)
  }

  function onTouchStart(e: TouchEvent) { handleStart(e.touches[0].clientX) }
  function onTouchMove(e: TouchEvent) { handleMove(e.touches[0].clientX) }
  function onMouseDown(e: MouseEvent) { handleStart(e.clientX) }
  function onMouseMove(e: MouseEvent) { handleMove(e.clientX) }

  const rotation = offsetX * 0.1
  const opacity = Math.max(0, 1 - Math.abs(offsetX) / 400)

  function toSwipedDog(d: DogOut): SwipedDog {
    return {
      name: d.name,
      breed: d.breed,
      age: `${d.age_years} yrs`,
      weight: `${d.weight_lbs} lbs`,
      energy: sizeLabel(d.size),
      bio: d.description ?? "",
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading dogs from the shelter...</p>
      </div>
    )
  }

  if (cards.length === 0) {
    const handleReset = async () => {
      if (!userId) return
      try {
        setLoading(true)
        await resetSwipes(userId)
        setCurrentIndex(0)
        setLiked([])
        setDisliked([])
        const freshCards = await getSwipeCards(userId, 20)
        setCards(freshCards)
        // Pre-fetch images for new cards
        const imgs: Record<number, string> = {}
        await Promise.all(
          freshCards.map(async (c) => {
            const url = c.dog.image_url || (await fetchBreedImage(c.dog.breed))
            if (url) imgs[c.dog.id] = url
          })
        )
        setImages(imgs)
        setLoading(false)
      } catch (err) {
        console.error("Failed to reset swipes:", err)
        setLoading(false)
      }
    }
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">No dogs available 🐕</h2>
        <p className="text-muted-foreground">You've seen all the dogs! Reset to swipe again.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>← Back to preferences</Button>
          <Button onClick={handleReset}>🔄 Reset Swipes</Button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          {liked.length > 0 ? "Great choices! 🎉" : "All done!"}
        </h2>
        {liked.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground">You liked:</p>
            <ul className="space-y-1">
              {liked.map((dog) => (
                <li key={dog.id} className="text-foreground font-medium">
                  {dog.name} — {dog.breed}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Start over
          </Button>
          <Button
            className="gap-2"
            onClick={() => onComplete(liked.map(toSwipedDog), disliked.map(toSwipedDog))}
          >
            <Sparkles className="h-4 w-4" />
            See my AI profile
          </Button>
        </div>
      </div>
    )
  }

  const dog = cards[currentIndex].dog
  const score = cards[currentIndex].compatibility_score
  const imgUrl = images[dog.id] ?? ""

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
          {score !== null && score !== undefined && (
            <span className="ml-2 text-xs font-medium text-green-600">
              {score}% match
            </span>
          )}
        </p>
      </div>

      {/* Card */}
      <div
        className={cn(
          "relative w-full max-w-sm cursor-grab select-none overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-transform",
          exitDirection === "left" && "animate-swipe-left",
          exitDirection === "right" && "animate-swipe-right",
          isDragging && "cursor-grabbing"
        )}
        style={
          exitDirection
            ? undefined
            : {
                transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
                opacity,
              }
        }
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if (isDragging) handleEnd() }}
      >
        {/* Swipe indicators */}
        {offsetX > 30 && (
          <div className="absolute top-6 left-6 z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-green-500 bg-white/80 -rotate-12">
            <Heart className="h-8 w-8 text-green-500" />
          </div>
        )}
        {offsetX < -30 && (
          <div className="absolute top-6 right-6 z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500 bg-white/80 rotate-12">
            <X className="h-8 w-8 text-red-500" />
          </div>
        )}

        <div className="aspect-[3/4] w-full overflow-hidden bg-muted relative">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={dog.name}
              className="h-full w-full object-cover object-top pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-7xl">🐕</span>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {dog.is_rescue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100/90 text-amber-700 backdrop-blur-sm">
                🏠 Rescue
              </span>
            )}
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-foreground">{dog.name}</h3>
            <span className="text-sm text-muted-foreground">{dog.breed}</span>
          </div>
          <p className="text-sm italic text-muted-foreground">"{dog.description}"</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>🎂 {dog.age_years} yrs</span>
            <span>⚖️ {dog.weight_lbs} lbs</span>
            <span>📏 {sizeLabel(dog.size)}</span>
            <span>{dog.sex === "male" ? "♂️" : "♀️"} {dog.sex}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dog.good_with_kids && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                👶 Good with kids
              </span>
            )}
            {dog.good_with_cats && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                🐱 Good with cats
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-6">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => swipe("left")}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-green-300 text-green-500 hover:bg-green-50 hover:text-green-600"
          onClick={() => swipe("right")}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>

      <Button variant="ghost" onClick={onBack} className="text-muted-foreground mb-8">
        ← Back to preferences
      </Button>
    </div>
  )
}
