import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  uploadRescueImage,
  type RescueUploadResponse,
  type DogOut,
} from "@/lib/api"

interface RescueUploadProps {
  onBack: () => void
}

export function RescueUpload({ onBack }: RescueUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  // Form fields
  const [name, setName] = useState("")
  const [ageYears, setAgeYears] = useState("")
  const [weightLbs, setWeightLbs] = useState("")
  const [sex, setSex] = useState<"male" | "female">("male")
  const [goodWithCats, setGoodWithCats] = useState(false)
  const [goodWithKids, setGoodWithKids] = useState(false)

  // State
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<RescueUploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const res = await uploadRescueImage(file, {
        name: name || undefined,
        age_years: ageYears ? parseFloat(ageYears) : undefined,
        weight_lbs: weightLbs ? parseFloat(weightLbs) : undefined,
        sex,
        is_rescue: true,
        good_with_cats: goodWithCats,
        good_with_kids: goodWithKids,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function resetForm() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setName("")
    setAgeYears("")
    setWeightLbs("")
    setSex("male")
    setGoodWithCats(false)
    setGoodWithKids(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  if (result) {
    return <UploadResult result={result} onUploadAnother={resetForm} onBack={onBack} />
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
          🏥 Rescue Upload
        </h2>
        <p className="text-muted-foreground">
          Upload a photo of a rescue dog. Azure AI Vision will analyze the image
          and pre-fill the profile.
        </p>
      </div>

      {/* Image upload area */}
      <div
        className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-8 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 rounded-lg object-contain"
          />
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click or drag a photo here
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP • Max 10 MB
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Optional fields the rescue already knows */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Info you already know (optional)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Buddy"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Sex</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as "male" | "female")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Age (years)
            </label>
            <input
              type="number"
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value)}
              placeholder="e.g. 2"
              min={0}
              step={0.5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Weight (lbs)
            </label>
            <input
              type="number"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="e.g. 45"
              min={0}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={goodWithKids}
              onChange={(e) => setGoodWithKids(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Good with kids
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={goodWithCats}
              onChange={(e) => setGoodWithCats(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Good with cats
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button
          size="lg"
          disabled={!file || uploading}
          onClick={handleUpload}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload & Analyze
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Result view showing AI-detected fields ──────────────────────────────────

function UploadResult({
  result,
  onUploadAnother,
  onBack,
}: {
  result: RescueUploadResponse
  onUploadAnother: () => void
  onBack: () => void
}) {
  const { dog, vision_analysis: vision } = result

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-fade-in">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Profile Created!
        </h2>
        <p className="text-muted-foreground">{result.message}</p>
      </div>

      {/* Dog card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-foreground">{dog.name}</h3>
            <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              ID #{dog.id}
            </span>
          </div>

          <p className="text-sm italic text-muted-foreground">
            "{dog.description}"
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Breed" value={dog.breed} />
            <Field label="Size" value={dog.size} />
            <Field label="Color" value={dog.color} />
            <Field label="Coat" value={dog.coat_length} />
            <Field label="Age" value={`${dog.age_years} yrs`} />
            <Field label="Weight" value={`${dog.weight_lbs} lbs`} />
            <Field label="Sex" value={dog.sex} />
            <Field
              label="Confidence"
              value={
                vision.confidence !== null
                  ? `${(vision.confidence * 100).toFixed(0)}%`
                  : "N/A"
              }
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {dog.is_rescue && (
              <Badge color="amber">🏠 Rescue</Badge>
            )}
            {dog.good_with_kids && (
              <Badge color="green">👶 Good with kids</Badge>
            )}
            {dog.good_with_cats && (
              <Badge color="blue">🐱 Good with cats</Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        You can update any incorrect fields via{" "}
        <code className="text-foreground bg-secondary px-1 rounded">
          PATCH /api/v1/dogs/{dog.id}
        </code>
      </p>

      <div className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={onBack}>
          ← Home
        </Button>
        <Button onClick={onUploadAnother}>Upload another</Button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium text-foreground capitalize">{value}</p>
    </div>
  )
}

function Badge({
  color,
  children,
}: {
  color: "amber" | "green" | "blue"
  children: React.ReactNode
}) {
  const cls = {
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
  }[color]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>
      {children}
    </span>
  )
}
