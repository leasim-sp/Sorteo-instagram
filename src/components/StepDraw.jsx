import { useState } from 'react'
import { generateSeed, hashSeed } from '../utils/raffle'
import styles from './StepDraw.module.css'

export default function StepDraw({ participants, onNext, onBack }) {
  const [seed, setSeed] = useState(() => generateSeed(participants.length))
  const [numWinners, setNumWinners] = useState(1)
  const [copied, setCopied] = useState(false)

  const numericSeed = hashSeed(seed)
  const maxWinners = Math.min(participants.length, 10)
  const seedParts = parseSeedParts(seed)

  function refreshSeed() {
    setSeed(generateSeed(participants.length))
    setCopied(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(seed).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDraw() {
    onNext({ seed, numWinners: Math.min(numWinners, participants.length) })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurar Sorteo</h1>
        <p className={styles.subtitle}>
          Revisa la semilla pública antes de sortear.
          El resultado es <strong>100% reproducible</strong> con esta semilla.
        </p>
      </div>

      {/* Participant count */}
      <div className={styles.participantsBar}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="8" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="15.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M18 16c0-2.21-1.119-4.12-2.8-5.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <span><strong>{participants.length}</strong> participantes en el sorteo</span>
      </div>

      {/* Winners count */}
      <div className={styles.field}>
        <label className={styles.label}>
          Número de premios
          <span className={styles.labelHint}>máx. {maxWinners}</span>
        </label>
        <div className={styles.counterRow}>
          <button
            className={styles.counterBtn}
            onClick={() => setNumWinners((n) => Math.max(1, n - 1))}
            disabled={numWinners <= 1}
          >−</button>
          <span className={styles.counterVal}>{numWinners}</span>
          <button
            className={styles.counterBtn}
            onClick={() => setNumWinners((n) => Math.min(maxWinners, n + 1))}
            disabled={numWinners >= maxWinners}
          >+</button>
          <div className={styles.counterPills}>
            {[1, 2, 3, 5].filter((n) => n <= maxWinners).map((n) => (
              <button
                key={n}
                className={`${styles.pill} ${numWinners === n ? styles.pillActive : ''}`}
                onClick={() => setNumWinners(n)}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Public seed — the centrepiece */}
      <div className={styles.seedCard}>
        <div className={styles.seedCardTitle}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M4 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Semilla Pública
        </div>

        {/* Seed value + copy */}
        <div className={styles.seedValueRow}>
          <code className={styles.seedValue}>{seed}</code>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M1 5v7.5A1.5 1.5 0 0 0 2.5 14H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                Copiar
              </>
            )}
          </button>
        </div>

        {/* Breakdown */}
        {seedParts ? (
          <div className={styles.seedBreakdown}>
            {seedParts.map(({ token, description }) => (
              <div key={token} className={styles.seedPart}>
                <code className={styles.seedPartToken}>{token}</code>
                <span className={styles.seedPartDesc}>{description}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.seedCustomNote}>Semilla personalizada</p>
        )}

        {/* Hash + regenerate */}
        <div className={styles.seedFooter}>
          <span className={styles.seedHash}>
            Hash FNV-1a: <code>{numericSeed.toLocaleString()}</code>
          </span>
          <button className={styles.refreshBtn} onClick={refreshSeed}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 2A5.5 5.5 0 1 0 12 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M9 0l3 2.5L9.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Regenerar
          </button>
        </div>
      </div>

      {/* Algorithm note */}
      <div className={styles.algoNote}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 6v4M7 4.5v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span>
          Hash → Mulberry32 PRNG → Fisher-Yates shuffle.
          {numWinners > 1 && ` Los ${numWinners} ganadores se extraen de la lista mezclada: todos son distintos por construcción.`}
        </span>
      </div>

      {/* Footer */}
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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6.5" cy="8.5" r="1.5" fill="currentColor"/>
            <circle cx="13.5" cy="8.5" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
          </svg>
          ¡Realizar Sorteo!
          {numWinners > 1 && <span className={styles.drawBadge}>{numWinners} premios</span>}
        </button>
      </div>
    </div>
  )
}

/** Parse seed into labelled parts, returns null if format doesn't match */
function parseSeedParts(seed) {
  const m = seed.match(/^SORTEO-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-N(\d+)$/)
  if (!m) return null
  const [, yyyy, mm, dd, hh, min, ss, n] = m
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return [
    { token: 'SORTEO',   description: 'Prefijo del sistema' },
    { token: `${yyyy}${mm}${dd}`, description: `Fecha · ${dd} ${months[+mm - 1]} ${yyyy}` },
    { token: `${hh}${min}${ss}`, description: `Hora · ${hh}:${min}:${ss}` },
    { token: `N${n}`,   description: `${n} participantes` },
  ]
}
