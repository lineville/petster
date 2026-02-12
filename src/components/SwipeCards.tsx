import { useState, useEffect, useRef, type TouchEvent, type MouseEvent } from "react"
import { Heart, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BackendDog, SwipedDog } from "@/types"

const SWIPE_THRESHOLD = 100

const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra Large",
}

export function SwipeCards({ onBack, onComplete }: { onBack: () => void; onComplete: (liked: SwipedDog[], disliked: SwipedDog[]) => void }) {
  const [dogs, setDogs] = useState<BackendDog[]>([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
  const [liked, setLiked] = useState<BackendDog[]>([])
  const [disliked, setDisliked] = useState<BackendDog[]>([])
  const startX = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function fetchDogs() {
      try {
        const res = await fetch("/api/v1/dogs?limit=10")
        if (!res.ok) throw new Error(`Failed to fetch dogs: ${res.statusText}`)
        const data: BackendDog[] = await res.json() as BackendDog[]
        if (!cancelled) {
          setDogs(data)
          setLoadingDogs(false)
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Failed to load dogs")
          setLoadingDogs(false)
        }
      }
    }
    fetchDogs()
    return () => { cancelled = true }
  }, [])

  const done = dogs.length > 0 && currentIndex >= dogs.length

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
    if (direction === "right") {
      setLiked((prev) => [...prev, dogs[currentIndex]])
    } else {
      setDisliked((prev) => [...prev, dogs[currentIndex]])
    }
    setExitDirection(direction)
    setTimeout(() => {
      setCurrentIndex((i) => i + 1)
      setOffsetX(0)
      setExitDirection(null)
    }, 300)
  }

  function onTouchStart(e: TouchEvent) {
    handleStart(e.touches[0].clientX)
  }
  function onTouchMove(e: TouchEvent) {
    handleMove(e.touches[0].clientX)
  }
  function onMouseDown(e: MouseEvent) {
    handleStart(e.clientX)
  }
  function onMouseMove(e: MouseEvent) {
    handleMove(e.clientX)
  }

  const rotation = offsetX * 0.1
  const opacity = Math.max(0, 1 - Math.abs(offsetX) / 400)

  function toSwipedDog(d: BackendDog): SwipedDog {
    return {
      name: d.name,
      breed: d.breed,
      size: d.size,
      age_years: d.age_years,
      weight_lbs: d.weight_lbs,
      description: d.description ?? "",
    }
  }

  if (loadingDogs) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <span className="text-5xl animate-pulse">🐕</span>
        <p className="text-muted-foreground">Loading dogs...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="text-6xl">😿</div>
        <h2 className="text-2xl font-bold text-foreground">Couldn't load dogs</h2>
        <p className="text-muted-foreground max-w-md">{fetchError}</p>
        <Button variant="outline" onClick={onBack}>← Back to preferences</Button>
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

  const dog = dogs[currentIndex]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {dogs.length}
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
        onMouseLeave={() => {
          if (isDragging) handleEnd()
        }}
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

        <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
          {dog.image_url ? (
            <img
              src={dog.image_url}
              alt={dog.name}
              className="h-full w-full object-cover object-top pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-7xl">🐕</span>
            </div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-foreground">{dog.name}</h3>
            <span className="text-sm text-muted-foreground">{dog.breed}</span>
          </div>
          {dog.description && (
            <p className="text-sm italic text-muted-foreground">"{dog.description}"</p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>🎂 {dog.age_years} yrs</span>
            <span>⚖️ {dog.weight_lbs} lbs</span>
            <span>📏 {SIZE_LABELS[dog.size] ?? dog.size}</span>
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
