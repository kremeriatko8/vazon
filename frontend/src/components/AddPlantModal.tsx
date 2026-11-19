import { ArrowRight, Check, Search, Sprout, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPlant, uploadPlantPhoto, photoProblem } from '../services/plantService'
import { searchSpecies, type Species } from '../services/speciesService'
import type { Plant } from '../types/plant'

interface AddPlantModalProps {
  onClose: () => void
  onCreated: (plant: Plant) => void
  /** Rooms the owner already uses, offered as suggestions. */
  rooms?: string[]
  initialSearch?: string
}

/**
 * "Grow your collection" (Extend Design Across Pages): species or nickname,
 * and where the plant lives. A catalog species sets the recommended light;
 * the rest (pot, radiator, photo) can be changed on the plant page.
 */
export function AddPlantModal({ onClose, onCreated, rooms = [], initialSearch = '' }: AddPlantModalProps) {
  const { t } = useTranslation()
  const listId = useId()
  const [term, setTerm] = useState(initialSearch)
  const [results, setResults] = useState<Species[]>([])
  const [picked, setPicked] = useState<Species | null>(null)
  const [room, setRoom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [confirmUnknown, setConfirmUnknown] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Derived from the chosen file; the object URL is freed when the file changes or the modal closes.
  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  useEffect(() => {
    if (!photoPreview) return
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  useEffect(() => {
    if (picked || term.trim().length < 2) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      searchSpecies(term, 5)
        .then((list) => {
          if (!cancelled) setResults(list)
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [term, picked])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmUnknown) setConfirmUnknown(false)
        else if (!saving) onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, confirmUnknown, saving])

  const shownResults = picked || term.trim().length < 2 ? [] : results

  async function create(confirmed = false) {
    const own = term.trim()
    if (!picked && !own) {
      setError(t('addPlant.ownSpeciesRequired'))
      return
    }
    if (!picked && !confirmed) {
      setConfirmUnknown(true)
      return
    }
    setConfirmUnknown(false)
    setSaving(true)
    setError(null)
    try {
      const plant = await createPlant({
        name: picked ? picked.commonName : own,
        species: picked ? picked.scientificName : own,
        speciesId: picked?.id,
        lightCondition: picked?.recommendedLight ?? 'MEDIUM',
        potSize: 'MEDIUM',
        radiatorDistance: 'NONE',
        location: room.trim() || undefined,
      })
      if (photo) {
        try {
          await uploadPlantPhoto(plant.id, photo)
        } catch {
          // The plant was created successfully; allow the owner to retry
          // uploading the photo on its detail page.
          onCreated(plant)
          return
        }
      }
      onCreated(plant)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addPlant.saveFailed'))
      setSaving(false)
    }
  }

  return (
    <div
      className="app-modal-backdrop"
      onMouseDown={() => { if (!saving && !confirmUnknown) onClose() }}
    >
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-plant-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="app-modal-close" onClick={onClose} disabled={saving} aria-label={t('care.tooEarly.cancel')}>
          <X />
        </button>
        <span className="app-modal-leaf">
          <Sprout />
        </span>
        <div className="app-kicker">{t('addPlant.modalKicker')}</div>
        <h2 id="add-plant-title">
          {t('addPlant.modalTitle')} <em>{t('addPlant.modalTitleEm')}</em>
        </h2>
        <p>{t('addPlant.modalLead')}</p>

        <label htmlFor="add-plant-search">{t('addPlant.modalSpeciesLabel')}</label>
        <div className="app-input">
          {picked ? <Check size={17} /> : <Search size={17} />}
          <input
            id="add-plant-search"
            autoFocus
            role="combobox"
            aria-expanded={shownResults.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            value={picked ? `${picked.commonName} · ${picked.scientificName}` : term}
            maxLength={100}
            onChange={(event) => {
              setPicked(null)
              setTerm(event.target.value)
            }}
            placeholder={t('addPlant.modalSpeciesPlaceholder')}
          />
          {picked && (
            <button type="button" onClick={() => setPicked(null)} aria-label={t('addPlant.changeSpecies')}>
              <X size={15} />
            </button>
          )}
        </div>
        {shownResults.length > 0 && (
          <ul id={listId} role="listbox" className="mt-1.5 overflow-hidden rounded-[13px] border border-[#d6d9d2] bg-white">
            {shownResults.map((species) => (
              <li key={species.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => setPicked(species)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--mint)]"
                >
                  {species.photoUrl ? (
                    <img
                      src={species.photoUrl}
                      alt=""
                      title={species.photoAttribution ?? undefined}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mint)]" aria-hidden="true">
                      🌿
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{species.commonName}</span>
                    <span className="block truncate text-[13px] text-[#737e75] italic">{species.scientificName}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!picked && term.trim().length >= 2 && (
          <p className="mt-1.5 text-[13px] text-[#737e75]">{t('addPlant.modalOwnHint')}</p>
        )}

        <label htmlFor="add-plant-room">{t('addPlant.modalRoomLabel')}</label>
        <div className="app-input">
          <input
            id="add-plant-room"
            list={`${listId}-rooms`}
            value={room}
            maxLength={100}
            onChange={(event) => setRoom(event.target.value)}
            placeholder={t('addPlant.locationPlaceholder')}
          />
          <datalist id={`${listId}-rooms`}>
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        <label htmlFor="add-plant-photo">{t('addPlant.photoOptional')}</label>
        <input
          id="add-plant-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setPhotoError(null)
            if (file) {
              const problem = photoProblem(file)
              if (problem) {
                setPhoto(null)
                setPhotoError(
                  problem === 'size'
                    ? 'Максимальний розмір фото — 5 МБ.'
                    : 'Дозволені формати: JPEG, PNG або WebP.'
                )
                return
              }
            }
            setPhoto(file)
          }}
          className="mt-2 block w-full text-sm"
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Попередній перегляд фото рослини"
            className="mt-3 h-36 w-36 rounded-xl object-cover"
          />
        )}
        {photoError && <p role="alert" className="mt-2 text-sm text-red-700">{photoError}</p>}

        {error && (
          <p role="alert" className="mt-3 text-[14px] text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-full border border-[#d6d9d2] px-5 py-3"
          >
            Cancel
          </button>
          <button
            type="button"
            className="app-button"
            disabled={saving}
            onClick={() => void create()}
          >
            {saving ? t('addPlant.saving') : t('addPlant.modalCreate')}
            {!saving && <ArrowRight size={16} />}
          </button>
        </div>

        {confirmUnknown && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unknown-species-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 id="unknown-species-title" className="text-lg font-semibold">
                Save anyway?
              </h3>
              <p className="mt-2 text-sm">
                {t('addPlant.saveAnywayDescription')}
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmUnknown(false)}
                  className="rounded-full border px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void create(true)}
                  className="rounded-full bg-green-800 px-4 py-2 text-white"
                >
                  Save anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
