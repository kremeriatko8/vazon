import { ArrowLeft, ArrowRight, HelpCircle, Search, Sprout, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createPlant, photoProblem, uploadPlantPhoto } from '../services/plantService'
import { searchSpecies, type Species } from '../services/speciesService'
import type { LightCondition, PotSize, RadiatorDistance } from '../types/plant'

const LIGHTS: LightCondition[] = ['LOW', 'MEDIUM', 'BRIGHT_INDIRECT', 'DIRECT']
const POTS: PotSize[] = ['SMALL', 'MEDIUM', 'LARGE']
const RADIATORS: RadiatorDistance[] = ['NONE', 'FAR', 'MEDIUM', 'NEAR']

/** What the owner picked in step 1: a catalog species, or "I don't know" with their own name for it. */
type Choice = { kind: 'catalog'; species: Species } | { kind: 'unknown' }

/** Catalog search with a short delay, so typing does not send a request per key. */
function useSpeciesSearch(term: string) {
  const [results, setResults] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      searchSpecies(term)
        .then((list) => {
          if (!cancelled) {
            setResults(list)
            setFailed(false)
          }
        })
        .catch(() => {
          if (!cancelled) setFailed(true)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [term])

  return { results, loading, failed }
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none'

export function NewPlantPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [term, setTerm] = useState('')
  const search = useSpeciesSearch(term)
  const [choice, setChoice] = useState<Choice | null>(null)

  const [name, setName] = useState('')
  const [ownSpecies, setOwnSpecies] = useState('')
  const [lightCondition, setLightCondition] = useState<LightCondition>('MEDIUM')
  const [potSize, setPotSize] = useState<PotSize>('MEDIUM')
  const [radiatorDistance, setRadiatorDistance] = useState<RadiatorDistance>('NONE')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile])
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function pickSpecies(species: Species) {
    setChoice({ kind: 'catalog', species })
    setName((current) => current || species.commonName)
    setLightCondition(species.recommendedLight)
    setError(null)
  }

  function pickUnknown() {
    setChoice({ kind: 'unknown' })
    setOwnSpecies(term.trim())
    setError(null)
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = photoProblem(file)
    if (problem) {
      setError(t(problem === 'type' ? 'photo.wrongType' : 'photo.tooLarge'))
      return
    }
    setError(null)
    setPhotoFile(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!choice) return
    setError(null)
    const species = choice.kind === 'catalog' ? choice.species.scientificName : ownSpecies.trim()
    if (!name.trim()) return setError(t('addPlant.nameRequired'))
    if (!species) return setError(t('addPlant.ownSpeciesRequired'))

    setSubmitting(true)
    try {
      const created = await createPlant({
        name: name.trim(),
        species,
        speciesId: choice.kind === 'catalog' ? choice.species.id : undefined,
        lightCondition,
        potSize,
        radiatorDistance,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
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
      setError(err instanceof Error ? err.message : t('addPlant.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/plants" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-900">
        <ArrowLeft size={16} aria-hidden="true" /> {t('addPlant.back')}
      </Link>

      <div className="mt-4 rounded-[2rem] border border-beige bg-white p-6 shadow-sm sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-olive-800">
          <Sprout size={22} aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-olive-800 uppercase">{t('addPlant.kicker')}</p>

        {!choice ? (
          <>
            <h1 className="mt-2 font-display text-3xl leading-tight font-medium text-ink sm:text-4xl">
              {t('addPlant.whoTitle')} <em className="text-olive-600">{t('addPlant.whoTitleEm')}</em>
            </h1>
            <p className="mt-2 text-sm text-forest-700/80">{t('addPlant.whoLead')}</p>

            <label htmlFor="species-search" className="mt-6 block text-sm font-medium text-forest-800">
              {t('addPlant.searchLabel')}
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-beige-dark bg-ivory/40 px-4 focus-within:border-forest-600 focus-within:bg-white">
              <Search size={18} className="text-forest-700/60" aria-hidden="true" />
              <input
                id="species-search"
                type="search"
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t('addPlant.searchPlaceholder')}
                className="w-full bg-transparent py-3 text-sm text-forest-900 outline-none"
              />
            </div>

            <div className="mt-4" aria-live="polite">
              {search.failed ? (
                <p className="text-sm text-red-700">{t('addPlant.searchFailed')}</p>
              ) : !search.loading && search.results.length === 0 ? (
                <p className="text-sm text-forest-700/75">{t('addPlant.noResults')}</p>
              ) : (
                <ul className="max-h-96 space-y-2 overflow-y-auto pr-1" aria-busy={search.loading}>
                  {search.results.map((species) => (
                    <li key={species.id}>
                      <button
                        type="button"
                        onClick={() => pickSpecies(species)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-beige bg-white p-2.5 text-left transition hover:border-forest-600/40 hover:bg-mint/30"
                      >
                        {species.photoUrl ? (
                          <img src={species.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-100" aria-hidden="true">
                            🌿
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{species.commonName}</span>
                          <span className="block truncate text-xs text-forest-700/70 italic">{species.scientificName}</span>
                        </span>
                        <span className="hidden shrink-0 rounded-full bg-sage-100 px-2.5 py-1 text-[11px] text-forest-800 sm:inline">
                          {t(`light.${species.recommendedLight}`)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={pickUnknown}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-olive-800 underline-offset-4 hover:underline"
            >
              <HelpCircle size={17} aria-hidden="true" /> {t('addPlant.notSure')}
            </button>
          </>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-2 space-y-5" noValidate>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-3xl leading-tight font-medium text-ink">{t('addPlant.detailsTitle')}</h1>
              <button
                type="button"
                onClick={() => setChoice(null)}
                className="inline-flex items-center gap-1 rounded-full border border-beige-dark px-3 py-1.5 text-xs font-medium text-forest-800 hover:bg-ivory"
              >
                <X size={14} aria-hidden="true" /> {t('addPlant.changeSpecies')}
              </button>
            </div>

            {choice.kind === 'catalog' ? (
              <div className="flex items-center gap-3 rounded-2xl bg-mint/50 p-3">
                {choice.species.photoUrl ? (
                  <img src={choice.species.photoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl" aria-hidden="true">
                    🌿
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{choice.species.commonName}</p>
                  <p className="text-sm text-forest-700/80 italic">{choice.species.scientificName}</p>
                  {choice.species.photoAttribution && (
                    <a
                      href={choice.species.photoSourceUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block truncate text-[10px] text-forest-700/60 hover:underline"
                    >
                      {choice.species.photoAttribution}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="own-species" className="block text-sm font-medium text-forest-800">
                  {t('addPlant.ownSpeciesLabel')}
                </label>
                <input
                  id="own-species"
                  value={ownSpecies}
                  onChange={(e) => setOwnSpecies(e.target.value)}
                  placeholder={t('addPlant.ownSpeciesPlaceholder')}
                  maxLength={120}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-forest-700/70">{t('addPlant.ownSpeciesHint')}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="plant-name" className="block text-sm font-medium text-forest-800">
                  {t('addPlant.nameLabel')}
                </label>
                <input
                  id="plant-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('addPlant.namePlaceholder')}
                  maxLength={100}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="plant-location" className="block text-sm font-medium text-forest-800">
                  {t('addPlant.locationLabel')}
                </label>
                <input
                  id="plant-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('addPlant.locationPlaceholder')}
                  maxLength={100}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="plant-light" className="block text-sm font-medium text-forest-800">
                  {t('addPlant.lightLabel')}
                </label>
                <select
                  id="plant-light"
                  value={lightCondition}
                  onChange={(e) => setLightCondition(e.target.value as LightCondition)}
                  className={inputClass}
                >
                  {LIGHTS.map((value) => (
                    <option key={value} value={value}>
                      {t(`light.${value}`)}
                    </option>
                  ))}
                </select>
                {choice.kind === 'catalog' && (
                  <p className="mt-1 text-[11px] text-forest-700/70">{t('addPlant.lightFromCatalog')}</p>
                )}
              </div>
              <div>
                <label htmlFor="plant-pot" className="block text-sm font-medium text-forest-800">
                  {t('addPlant.potLabel')}
                </label>
                <select id="plant-pot" value={potSize} onChange={(e) => setPotSize(e.target.value as PotSize)} className={inputClass}>
                  {POTS.map((value) => (
                    <option key={value} value={value}>
                      {t(`pot.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="plant-radiator" className="block text-sm font-medium text-forest-800">
                  {t('addPlant.radiatorLabel')}
                </label>
                <select
                  id="plant-radiator"
                  value={radiatorDistance}
                  onChange={(e) => setRadiatorDistance(e.target.value as RadiatorDistance)}
                  className={inputClass}
                >
                  {RADIATORS.map((value) => (
                    <option key={value} value={value}>
                      {t(`radiator.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="plant-photo" className="block text-sm font-medium text-forest-800">
                {t('addPlant.photoLabel')}
              </label>
              <input
                id="plant-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                className="mt-1.5 block w-full text-xs text-forest-800 file:mr-3 file:rounded-full file:border-0 file:bg-sage-100 file:px-3.5 file:py-2 file:text-xs file:font-medium file:text-forest-800 hover:file:bg-sage-200"
              />
              <p className="mt-1 text-[11px] text-forest-700/70">{t('photo.hint')}</p>
              {photoPreview && (
                <div className="relative mt-3 h-40 w-full overflow-hidden rounded-2xl border border-beige">
                  <img src={photoPreview} alt={t('addPlant.photoPreview')} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoFile(null)}
                    className="absolute top-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-white"
                  >
                    {t('photo.remove')}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="plant-notes" className="block text-sm font-medium text-forest-800">
                {t('addPlant.notesLabel')}
              </label>
              <textarea
                id="plant-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={t('addPlant.notesPlaceholder')}
                className={inputClass}
              />
            </div>

            {error && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-olive-800 px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-olive-900 disabled:opacity-60"
            >
              {submitting ? t('addPlant.saving') : t('addPlant.save')} {!submitting && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>
        )}

        {!choice && error && (
          <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}
