import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { SwipeCards } from "@/components/SwipeCards"

function App() {
  const [step, setStep] = useState<"preferences" | "swipe">("preferences")
  const [energy, setEnergy] = useState([20, 80])
  const [weight, setWeight] = useState([15, 100])
  const [age, setAge] = useState([0, 3])

    const ageLabels = ["Puppy (0–1 yr)", "Young (1–3 yrs)", "Adult (3–7 yrs)", "Senior (7–10 yrs)", "Elderly (10+ yrs)"]

    return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            🐾 Petster
          </h1>
          <p className="text-sm text-muted-foreground">
            Find your perfect pet match
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {step === "swipe" ? (
          <SwipeCards onBack={() => setStep("preferences")} />
        ) : (
          <>
        <section className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
            Tell us a bit about your dog preferences
          </h2>
          <p className="text-lg text-muted-foreground">
            This will take no more than 3 minutes!
          </p>
        </section>

        <section className="mx-auto max-w-xl space-y-10">
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Energy Level
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {energy[0]}% – {energy[1]}%
              </span>
            </div>
            <Slider
              value={energy}
              onValueChange={setEnergy}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Couch potato 🛋️</span>
              <span>Energizer bunny ⚡</span>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Weight
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {weight[0]} – {weight[1]} lbs
              </span>
            </div>
            <Slider
              value={weight}
              onValueChange={setWeight}
              min={5}
              max={200}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tiny trotter 🐹</span>
              <span>Huge plodder 🐕‍🦺</span>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Age
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {ageLabels[age[0]]} – {ageLabels[age[1]]}
              </span>
            </div>
            <Slider
              value={age}
              onValueChange={setAge}
              min={0}
              max={4}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Puppy (0–1 yr) 🐶</span>
              <span>Elderly (10+ yrs) 🐕</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="h-14 w-full max-w-xl text-lg font-semibold"
              onClick={() => setStep("swipe")}
            >
              Find my match 🐾
            </Button>
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
