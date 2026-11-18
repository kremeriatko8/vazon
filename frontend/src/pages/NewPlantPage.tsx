import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createPlant, photoProblem, uploadPlantPhoto } from '../services/plantService'
import type { LightCondition, PotSize, RadiatorDistance } from '../types/plant'

interface SpeciesPreset {
  species: string
  commonName: string
  lightCondition: LightCondition
  potSize: PotSize
  radiatorDistance: RadiatorDistance
  wateringIntervalDays: number
  careTip: string
}

const SPECIES_PRESETS: SpeciesPreset[] = [
  {
    species: 'Monstera deliciosa',
    commonName: 'Monstera',
    lightCondition: 'BRIGHT_INDIRECT',
    potSize: 'LARGE',
    radiatorDistance: 'FAR',
    wateringIntervalDays: 7,
    careTip: 'Water when top 3 cm of soil feel dry; wipe dusty leaves monthly.',
  },
  {
    species: 'Dracaena trifasciata',
    commonName: 'Snake Plant',
    lightCondition: 'LOW',
    potSize: 'MEDIUM',
    radiatorDistance: 'NONE',
    wateringIntervalDays: 14,
    careTip: 'Allow soil to dry completely between waterings.',
  },
  {
    species: 'Ficus lyrata',
    commonName: 'Fiddle Leaf Fig',
    lightCondition: 'BRIGHT_INDIRECT',
    potSize: 'LARGE',
    radiatorDistance: 'FAR',
    wateringIntervalDays: 7,
    careTip: 'Keep away from cold drafts and sudden spot changes.',
  },
  {
    species: 'Spathiphyllum wallisii',
    commonName: 'Peace Lily',
    lightCondition: 'MEDIUM',
    potSize: 'MEDIUM',
    radiatorDistance: 'FAR',
    wateringIntervalDays: 5,
    careTip: 'Drooping leaves signal thirst; prefers filtered water.',
  },
  {
    species: 'Zamioculcas zamiifolia',
    commonName: 'ZZ Plant',
    lightCondition: 'LOW',
    potSize: 'MEDIUM',
    radiatorDistance: 'MEDIUM',
    wateringIntervalDays: 14,
    careTip: 'Drought-tolerant rhizomes; avoid overwatering.',
  },
  {
    species: 'Epipremnum aureum',
    commonName: 'Golden Pothos',
    lightCondition: 'MEDIUM',
    potSize: 'SMALL',
    radiatorDistance: 'MEDIUM',
    wateringIntervalDays: 7,
    careTip: 'Fast grower; trim long vines to encourage fuller foliage.',
  },
  {
    species: 'Calathea orbifolia',
    commonName: 'Calathea',
    lightCondition: 'MEDIUM',
    potSize: 'MEDIUM',
    radiatorDistance: 'FAR',
    wateringIntervalDays: 5,
    careTip: 'Loves high humidity and soft, room-temperature water.',
  },
  {
    species: 'Aloe vera',
    commonName: 'Aloe Vera',
    lightCondition: 'DIRECT',
    potSize: 'SMALL',
    radiatorDistance: 'MEDIUM',
    wateringIntervalDays: 14,
    careTip: 'Needs bright sunny windowsill and gritty well-draining soil.',
  },
]

export function NewPlantPage() {
  const { i18n } = useTranslation()
  const isUk = i18n.language === 'uk'
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [lightCondition, setLightCondition] = useState<LightCondition>('BRIGHT_INDIRECT')
  const [potSize, setPotSize] = useState<PotSize>('MEDIUM')
  const [radiatorDistance, setRadiatorDistance] = useState<RadiatorDistance>('NONE')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<SpeciesPreset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function applyPreset(preset: SpeciesPreset) {
    setSelectedPreset(preset)
    setSpecies(preset.species)
    setLightCondition(preset.lightCondition)
    setPotSize(preset.potSize)
    setRadiatorDistance(preset.radiatorDistance)
    if (!name.trim()) {
      setName(preset.commonName)
    }
  }

  function handleSpeciesChange(value: string) {
    setSpecies(value)
    const matched = SPECIES_PRESETS.find(
      (p) =>
        p.species.toLowerCase() === value.trim().toLowerCase() ||
        p.commonName.toLowerCase() === value.trim().toLowerCase(),
    )
    if (matched) {
      applyPreset(matched)
    } else {
      setSelectedPreset(null)
    }
  }

  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile])
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = photoProblem(file)
    if (problem) {
      setError(
        problem === 'type'
          ? isUk
            ? 'Фото має бути у форматі JPEG, PNG або WebP.'
            : 'The photo must be a JPEG, PNG or WebP image.'
          : isUk
            ? 'Фото завелике: до 5 МБ.'
            : 'The photo is too large: up to 5 MB.',
      )
      return
    }
    setError(null)
    setPhotoFile(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(isUk ? 'Введіть назву рослини.' : 'Please enter a plant name.')
      return
    }
    if (!species.trim()) {
      setError(isUk ? 'Вкажіть вид рослини.' : 'Please enter the plant species.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createPlant({
        name: name.trim(),
        species: species.trim(),
        lightCondition,
        potSize,
        radiatorDistance,
      })
      if (photoFile) {
        try {
          await uploadPlantPhoto(created.id, photoFile)
        } catch {
          // The plant is saved; open it so the photo can be added again there.
          navigate(`/plants/${created.id}`, { replace: true, state: { photoFailed: true } })
          return
        }
      }
      navigate('/plants', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save plant.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/plants" className="text-sm font-medium text-forest-700 hover:text-forest-900">
        ← {isUk ? 'Назад до моїх рослин' : 'Back to my plants'}
      </Link>
      <div className="mt-4 rounded-3xl border border-beige bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium tracking-wide text-forest-600 uppercase">
          {isUk ? 'Швидке додавання' : 'Quick add'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-forest-800">
          {isUk ? 'Додати кімнатну рослину' : 'Add a houseplant'}
        </h1>
        <p className="mt-1 text-sm text-forest-700/80">
          {isUk
            ? 'Оберіть вид із підказок — умови догляду заповняться автоматично.'
            : 'Pick a species preset to auto-fill optimal care conditions.'}
        </p>

        <div className="mt-4">
          <p className="text-xs font-medium text-forest-700/80">
            {isUk ? 'Популярні види:' : 'Popular species presets:'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SPECIES_PRESETS.map((preset) => {
              const active = selectedPreset?.species === preset.species
              return (
                <button
                  key={preset.species}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-forest-700 text-ivory'
                      : 'border border-beige-dark bg-ivory/60 text-forest-800 hover:bg-sage-100'
                  }`}
                >
                  {preset.commonName}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plant-species" className="block text-sm font-medium text-forest-800">
                {isUk ? 'Вид рослини *' : 'Species *'}
              </label>
              <input
                id="plant-species"
                list="species-suggestions"
                type="text"
                required
                maxLength={150}
                value={species}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                placeholder="Monstera deliciosa"
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              />
              <datalist id="species-suggestions">
                {SPECIES_PRESETS.map((p) => (
                  <option key={p.species} value={p.species}>
                    {p.commonName}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="plant-name" className="block text-sm font-medium text-forest-800">
                {isUk ? "Ім'я рослини *" : 'Plant name *'}
              </label>
              <input
                id="plant-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monty"
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div>
              <label htmlFor="plant-photo" className="block text-sm font-medium text-forest-800">
                {isUk ? 'Фото (необов’язково)' : 'Photo (optional)'}
              </label>
              <input
                id="plant-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="mt-1.5 block w-full text-xs text-forest-800 file:mr-3 file:rounded-full file:border-0 file:bg-sage-100 file:px-3.5 file:py-2 file:text-xs file:font-medium file:text-forest-800 hover:file:bg-sage-200"
              />
            </div>
          </div>

          {photoPreview && (
            <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-beige">
              <img src={photoPreview} alt={isUk ? 'Попередній перегляд фото' : 'Photo preview'} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoFile(null)}
                className="absolute top-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-white"
              >
                {isUk ? 'Прибрати фото' : 'Remove photo'}
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="plant-light" className="block text-sm font-medium text-forest-800">
                {isUk ? 'Освітлення' : 'Light condition'}
              </label>
              <select
                id="plant-light"
                value={lightCondition}
                onChange={(e) => setLightCondition(e.target.value as LightCondition)}
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              >
                <option value="LOW">Low light</option>
                <option value="MEDIUM">Medium light</option>
                <option value="BRIGHT_INDIRECT">Bright indirect</option>
                <option value="DIRECT">Direct sun</option>
              </select>
            </div>

            <div>
              <label htmlFor="plant-pot" className="block text-sm font-medium text-forest-800">
                {isUk ? 'Розмір горщика' : 'Pot size'}
              </label>
              <select
                id="plant-pot"
                value={potSize}
                onChange={(e) => setPotSize(e.target.value as PotSize)}
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              >
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
              </select>
            </div>

            <div>
              <label htmlFor="plant-radiator" className="block text-sm font-medium text-forest-800">
                {isUk ? 'До батареї' : 'Radiator distance'}
              </label>
              <select
                id="plant-radiator"
                value={radiatorDistance}
                onChange={(e) => setRadiatorDistance(e.target.value as RadiatorDistance)}
                className="mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none"
              >
                <option value="NONE">No radiator</option>
                <option value="NEAR">Near (&lt; 1m)</option>
                <option value="MEDIUM">Medium (1–2m)</option>
                <option value="FAR">Far (&gt; 2m)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-forest-700 px-5 py-3 text-sm font-medium text-ivory transition hover:bg-forest-800 disabled:opacity-60"
          >
            {submitting ? (isUk ? 'Збереження...' : 'Saving plant...') : isUk ? 'Зберегти рослину' : 'Save plant'}
          </button>
        </form>
      </div>
    </section>
  )
}
