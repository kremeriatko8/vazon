import { HeartPulse, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  diagnosePlant,
  getSymptoms,
  localized,
  setPlantStatus,
  type Diagnosis,
  type PlantStatus,
  type Symptom,
} from '../services/plantHealthService'
import type { Plant } from '../types/plant'
import { ui } from './styles'

const STATUSES: PlantStatus[] = ['HEALTHY', 'NEEDS_ATTENTION', 'DEAD']

interface PlantHealthPanelProps {
  plant: Plant
  onPlantChange: (plant: Plant) => void
}

/** Plant status and "What is wrong with my plant?" (diagnosis by symptoms). */
export function PlantHealthPanel({ plant, onPlantChange }: PlantHealthPanelProps) {
  const { t, i18n } = useTranslation()
  const status: PlantStatus = plant.status ?? 'HEALTHY'
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [busy, setBusy] = useState<'status' | 'diagnosis' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSymptoms()
      .then((list) => {
        if (!cancelled) setSymptoms(list)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  async function changeStatus(next: PlantStatus) {
    if (next === status) return
    setBusy('status')
    setError(null)
    try {
      onPlantChange(await setPlantStatus(plant.id, next))
    } catch {
      setError(t('health.statusFailed'))
    } finally {
      setBusy(null)
    }
  }

  function toggle(code: string) {
    setDiagnosis(null)
    setPicked((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  async function runDiagnosis() {
    if (picked.length === 0) return
    setBusy('diagnosis')
    setError(null)
    try {
      setDiagnosis(await diagnosePlant(plant.id, picked))
    } catch {
      setError(t('health.diagnosisFailed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className={`mt-6 p-6 sm:p-8 ${ui.card}`} aria-labelledby="plant-health-title">
      <h2 id="plant-health-title" className="app-subtitle flex items-center gap-2">
        <HeartPulse size={20} aria-hidden="true" /> {t('health.title')}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('health.statusLabel')}>
        {STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            disabled={busy !== null}
            onClick={() => void changeStatus(value)}
            className={status === value ? ui.btnPrimary : ui.btnSecondary}
          >
            {t(`health.status.${value}`)}
          </button>
        ))}
      </div>
      {status === 'DEAD' && <p className={`mt-3 ${ui.muted}`}>{t('health.deadHint')}</p>}

      {status !== 'DEAD' && (
        <>
          <h3 className="mt-6 flex items-center gap-2 text-base font-semibold text-[var(--forest)]">
            <Stethoscope size={18} aria-hidden="true" /> {t('health.whatsWrong')}
          </h3>
          <p className={`mt-1 ${ui.muted}`}>{t('health.pickSymptoms')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {symptoms.map((symptom) => (
              <button
                key={symptom.code}
                type="button"
                aria-pressed={picked.includes(symptom.code)}
                onClick={() => toggle(symptom.code)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  picked.includes(symptom.code)
                    ? 'border-[var(--forest)] bg-[var(--forest)] text-white'
                    : 'border-[#d6d9d2] bg-white text-forest-800'
                }`}
              >
                {localized(symptom.title, i18n.language)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`mt-4 ${ui.btnPrimary}`}
            disabled={picked.length === 0 || busy !== null}
            onClick={() => void runDiagnosis()}
          >
            {busy === 'diagnosis' ? t('care.saving') : t('health.findCauses')}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className={`mt-4 ${ui.error}`}>
          {error}
        </p>
      )}

      {diagnosis && (
        <div className="mt-5 space-y-4" aria-live="polite">
          {diagnosis.causes.length === 0 && <p className={ui.muted}>{t('health.noCauses')}</p>}
          {diagnosis.causes.map((cause) => (
            <article key={cause.cause} className="rounded-2xl border border-[#d6d9d2] bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-base font-semibold text-[var(--forest)]">{localized(cause.title, i18n.language)}</h4>
                <span className="text-sm text-[#778178]">{t(`health.confidence.${cause.confidence}`)}</span>
              </div>
              {cause.reasons.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-forest-800/90">
                  {cause.reasons.map((reason) => (
                    <li key={reason.en}>{localized(reason, i18n.language)}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm font-semibold text-forest-800">{t('health.whatToDo')}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-forest-800">
                {cause.actions.map((action) => (
                  <li key={action.en}>{localized(action, i18n.language)}</li>
                ))}
              </ul>
            </article>
          ))}
          {diagnosis.suggestedStatus === 'NEEDS_ATTENTION' && status === 'HEALTHY' && (
            <button
              type="button"
              className={ui.btnSecondary}
              disabled={busy !== null}
              onClick={() => void changeStatus('NEEDS_ATTENTION')}
            >
              {t('health.markNeedsAttention')}
            </button>
          )}
          <p className="text-xs text-[#778178]">{t('health.disclaimer')}</p>
        </div>
      )}
    </section>
  )
}
