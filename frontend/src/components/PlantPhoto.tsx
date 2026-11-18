import { useId, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { photoProblem, removePlantPhoto, uploadPlantPhoto } from '../services/plantService'
import type { Plant } from '../types/plant'

interface PlantPhotoProps {
  plant: Plant
  onChange: (plant: Plant) => void
  /** Shown once, e.g. when the photo from the "Add plant" form failed to upload. */
  initialError?: string | null
}

/** The plant's photo with "add / change" and "remove" actions. */
export function PlantPhoto({ plant, onChange, initialError = null }: PlantPhotoProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(initialError)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = photoProblem(file)
    if (problem) {
      setError(t(problem === 'type' ? 'photo.wrongType' : 'photo.tooLarge'))
      return
    }
    setBusy('upload')
    setError(null)
    try {
      onChange(await uploadPlantPhoto(plant.id, file))
    } catch {
      setError(t('photo.uploadFailed'))
    } finally {
      setBusy(null)
    }
  }

  async function handleRemove() {
    setBusy('remove')
    setError(null)
    try {
      onChange(await removePlantPhoto(plant.id))
    } catch {
      setError(t('photo.removeFailed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-beige bg-sage-100 sm:h-64">
        {plant.photoUrl ? (
          <img src={plant.photoUrl} alt={plant.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl" aria-hidden="true">
            🌿
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className={`cursor-pointer rounded-full border border-beige-dark bg-white px-3.5 py-1.5 text-xs font-medium text-forest-800 transition hover:bg-ivory ${
            busy ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {busy === 'upload' ? t('photo.uploading') : t(plant.photoUrl ? 'photo.change' : 'photo.add')}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void handleFile(event)}
          disabled={busy !== null}
          className="sr-only"
        />
        {plant.photoUrl && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={busy !== null}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            {busy === 'remove' ? t('photo.removing') : t('photo.remove')}
          </button>
        )}
        <span className="text-[11px] text-forest-700/70">{t('photo.hint')}</span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
