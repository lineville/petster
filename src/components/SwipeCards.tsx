import { useState, useRef, type TouchEvent, type MouseEvent } from "react"
import { Heart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Dog {
  id: number
  name: string
  breed: string
  age: string
  weight: string
  energy: string
  image: string
  bio: string
}

const DOGS: Dog[] = [
  {
    id: 1,
    name: "Biscuit",
    breed: "Golden Retriever",
    age: "2 yrs",
    weight: "65 lbs",
    energy: "High",
    image: "https://images.dog.ceo/breeds/retriever-golden/n02099601_2358.jpg",
    bio: "Loves fetch, belly rubs, and making new friends at the park!",
  },
  {
    id: 2,
    name: "Luna",
    breed: "Husky",
    age: "3 yrs",
    weight: "50 lbs",
    energy: "Very High",
    image: "https://images.dog.ceo/breeds/husky/n02110185_5392.jpg",
    bio: "Born to run. Will howl at the moon and steal your heart.",
  },
  {
    id: 3,
    name: "Mochi",
    breed: "French Bulldog",
    age: "1 yr",
    weight: "24 lbs",
    energy: "Low",
    image: "https://images.dog.ceo/breeds/bulldog-french/n02108915_2603.jpg",
    bio: "Professional couch warmer. Snores louder than he barks.",
  },
  {
    id: 4,
    name: "Bear",
    breed: "Bernese Mountain Dog",
    age: "4 yrs",
    weight: "110 lbs",
    energy: "Medium",
    image: "https://images.dog.ceo/breeds/mountain-bernese/n02107683_6999.jpg",
    bio: "Gentle giant who thinks he's a lap dog. Loves snow days!",
  },
  {
    id: 5,
    name: "Pepper",
    breed: "Border Collie",
    age: "5 yrs",
    weight: "42 lbs",
    energy: "Very High",
    image: "https://images.dog.ceo/breeds/collie-border/n02106166_1822.jpg",
    bio: "Smarter than most humans. Needs a job or she'll give herself one.",
  },
  {
    id: 6,
    name: "Teddy",
    breed: "Pomeranian",
    age: "6 yrs",
    weight: "7 lbs",
    energy: "Medium",
    image: "https://images.dog.ceo/breeds/pomeranian/n02112018_5091.jpg",
    bio: "Tiny but mighty. Will guard the house with fierce yapping.",
  },
]

const SWIPE_THRESHOLD = 100

export function SwipeCards({ onBack }: { onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
  const [liked, setLiked] = useState<Dog[]>([])
  const startX = useRef(0)

  const done = currentIndex >= DOGS.length

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
      setLiked((prev) => [...prev, DOGS[currentIndex]])
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

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          {liked.length > 0 ? "Great choices! 🎉" : "No matches yet"}
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
        <Button variant="outline" onClick={onBack}>
          ← Start over
        </Button>
      </div>
    )
  }

  const dog = DOGS[currentIndex]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {DOGS.length}
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
          <img
            src={dog.image}
            alt={dog.name}
            className="h-full w-full object-cover object-top pointer-events-none"
            draggable={false}
          />
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-foreground">{dog.name}</h3>
            <span className="text-sm text-muted-foreground">{dog.breed}</span>
          </div>
          <p className="text-sm italic text-muted-foreground">"{dog.bio}"</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>🎂 {dog.age}</span>
            <span>⚖️ {dog.weight}</span>
            <span>⚡ {dog.energy}</span>
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
