import { useState } from 'react'
import { generateSeed, hashSeed } from '../utils/raffle'
import styles from './StepDraw.module.css'

export default function StepDraw({ participants, onNext, onBack }) {
  const [seed, setSeed] = useState(generateSeed)
  const [numWinners, setNumWinners] = useState(1)
  const [seedEdited, setSeedEdited] = useState(false)

  const numericSeed = hashSeed(seed)
  const maxWinners = Math.min(participants.length, 10)

  function handleDraw() {
    onNext({ seed, numWinners: Math.min(numWinners, participants.length) })
  }

  function refreshSeed() {
    setSeed(generateSeed())
    setSeedEdited(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurar Sorteo</h1>
        <p className={styles.subtitle}>
          Define la semilla pública y el número de ganadores.
          La semilla garantiza que el sorteo sea <strong>reproducible y auditable</strong>.
        </p>
      </div>

      <div className={styles.participantsCard}>
        <div className={styles.participantsIcon}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="10" cy="9" r="4" stroke="white" strokeWidth="2"/>
            <path d="M3 22c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="9" r="3" stroke="white" strokeWidth="1.8"/>
            <path d="M22.5 21c0-2.485-1.567-4.614-3.8-5.535" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className={styles.participantsNum}>{participants.length}</p>
          <p className={styles.participantsLabel}>participantes válidos en el sorteo</p>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Número de ganadores
          <span className={styles.labelHint}>máx. {maxWinners}</span>
        </label>
        <div className={styles.counterRow}>
          <button
            className={styles.counterBtn}
            onClick={() => setNumWinners((n) => Math.max(1, n - 1))}
            disabled={numWinners <= 1}
          >
            −
          </button>
          <span className={styles.counterVal}>{numWinners}</span>
          <button
            className={styles.counterBtn}
            onClick={() => setNumWinners((n) => Math.min(maxWinners, n + 1))}
            disabled={numWinners >= maxWinners}
          >
            +
          </button>
          <div className={styles.counterPills}>
            {[1, 2, 3, 5].filter((n) => n <= maxWinners).map((n) => (
              <button
                key={n}
                className={`${styles.pill} ${numWinners === n ? styles.pillActive : ''}`}
                onClick={() => setNumWinners(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Semilla pública (seed)
          <span className={styles.labelHint}>determina el resultado</span>
        </label>
        <div className={styles.seedRow}>
          <input
            type="text"
            className={styles.seedInput}
            value={seed}
            onChange={(e) => {
              setSeed(e.target.value)
              setSeedEdited(true)
            }}
            placeholder="ej. SORTEO-20250518-A3F2"
            spellCheck={false}
          />
          <button className={styles.refreshBtn} onClick={refreshSeed} title="Generar nueva semilla">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 2.5A6.5 6.5 0 1 0 14.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M11 0l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nueva
          </button>
        </div>
        <div className={styles.seedPreview}>
          <span className={styles.seedHash}>
            Hash numérico: <code>{numericSeed.toLocaleString()}</code>
          </span>
          {seedEdited && (
            <span className={styles.seedCustom}>semilla personalizada</span>
          )}
        </div>
      </div>

      <div className={styles.infoBox}>
        <div className={styles.infoTitle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L2 14h12L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Transparencia del algoritmo
        </div>
        <p className={styles.infoText}>
          La semilla se convierte a número mediante <strong>hash FNV-1a</strong>,
          que inicializa el generador <strong>Mulberry32</strong>.
          Los participantes se mezclan con <strong>Fisher-Yates shuffle</strong> y
          se toman los primeros {numWinners}. El resultado es idéntico cada vez
          que uses la misma semilla y lista.
        </p>
      </div>

      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 9H4M8 4L3 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <button
          className={styles.drawBtn}
          onClick={handleDraw}
          disabled={!seed.trim()}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="2"/>
            <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="11" cy="14" r="1.5" fill="currentColor"/>
          </svg>
          ¡Realizar Sorteo!
        </button>
      </div>
    </div>
  )
}
