import { ArrowRight, Check, Search, Sprout, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPlant } from '../services/plantService'
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
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const shownResults = picked || term.trim().length < 2 ? [] : results

  async function create() {
    const own = term.trim()
    if (!picked && !own) {
      setError(t('addPlant.ownSpeciesRequired'))
      return
    }
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
      onCreated(plant)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addPlant.saveFailed'))
      setSaving(false)
    }
  }

  return (
    <div className="app-modal-backdrop" onMouseDown={onClose}>
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-plant-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="app-modal-close" onClick={onClose} aria-label={t('care.tooEarly.cancel')}>
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
                    <img src={species.photoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mint)]" aria-hidden="true">
                      🌿
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold">{species.commonName}</span>
                    <span className="block truncate text-[10px] text-[#737e75] italic">{species.scientificName}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!picked && term.trim().length >= 2 && (
          <p className="mt-1.5 text-[10px] text-[#737e75]">{t('addPlant.modalOwnHint')}</p>
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

        {error && (
          <p role="alert" className="mt-3 text-[11px] text-red-700">
            {error}
          </p>
        )}
        <button type="button" className="app-button full" disabled={saving} onClick={() => void create()}>
          {saving ? t('addPlant.saving') : t('addPlant.modalCreate')} {!saving && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
