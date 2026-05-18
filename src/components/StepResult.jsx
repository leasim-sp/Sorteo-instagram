import { useState, useEffect, useRef } from 'react'
import { downloadCertificate } from '../utils/certificate'
import styles from './StepResult.module.css'

const SPIN_DURATION = 2800
const WINNER_REVEAL_DELAY = 400

export default function StepResult({ result, participants, onReset }) {
  const { winners, seed, numericSeed, timestamp, totalParticipants } = result
  const [phase, setPhase] = useState('spinning') // 'spinning' | 'revealing' | 'done'
  const [revealedCount, setRevealedCount] = useState(0)
  const [slotItems, setSlotItems] = useState([])
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    // Build slot pool: mix winners with random participants for effect
    const pool = [...participants].sort(() => Math.random() - 0.5).slice(0, 20)
    setSlotItems(pool)

    // Spin for SPIN_DURATION then reveal winners
    timeoutRef.current = setTimeout(() => {
      setPhase('revealing')
      revealWinners()
    }, SPIN_DURATION)

    return () => {
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
    }
  }, [])

  function revealWinners() {
    let count = 0
    const reveal = () => {
      count++
      setRevealedCount(count)
      if (count < winners.length) {
        timeoutRef.current = setTimeout(reveal, WINNER_REVEAL_DELAY + count * 120)
      } else {
        timeoutRef.current = setTimeout(() => setPhase('done'), 400)
      }
    }
    timeoutRef.current = setTimeout(reveal, 200)
  }

  function handleDownload() {
    downloadCertificate({
      winners,
      seed,
      numericSeed,
      timestamp,
      totalParticipants,
      numWinners: winners.length,
    })
  }

  return (
    <div className={styles.container}>
      <Confetti active={phase === 'done'} />

      <div className={styles.header}>
        <h1 className={styles.title}>
          {phase === 'spinning' ? 'Sorteando...' : phase === 'revealing' ? '¡Eligiendo ganadores!' : '¡Ganadores!'}
        </h1>
        <p className={styles.subtitle}>
          {phase === 'done'
            ? `${winners.length} ganador${winners.length > 1 ? 'es' : ''} de ${totalParticipants} participantes`
            : 'El algoritmo está seleccionando los ganadores de forma aleatoria...'}
        </p>
      </div>

      {/* Slot Machine */}
      {phase === 'spinning' && (
        <div className={styles.slotMachine}>
          <div className={styles.slotOverlayTop} />
          <div className={styles.slotOverlayBottom} />
          <div className={styles.slotTrack}>
            <SlotReel items={slotItems} />
          </div>
        </div>
      )}

      {/* Winner Cards */}
      {(phase === 'revealing' || phase === 'done') && (
        <div className={styles.winnersGrid}>
          {winners.map((w, i) => (
            <WinnerCard
              key={w.id}
              winner={w}
              position={i + 1}
              visible={i < revealedCount}
            />
          ))}
        </div>
      )}

      {/* Seed info */}
      {phase === 'done' && (
        <div className={styles.seedBox}>
          <div className={styles.seedLabel}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Semilla utilizada
          </div>
          <code className={styles.seedValue}>{seed}</code>
          <span className={styles.seedNumeric}>→ {numericSeed.toLocaleString()}</span>
        </div>
      )}

      {/* Actions */}
      {phase === 'done' && (
        <div className={styles.actions}>
          <button className={styles.downloadBtn} onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v9M5 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Descargar Acta (HTML)
          </button>
          <button className={styles.resetBtn} onClick={onReset}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14.5 3.5A7 7 0 1 0 15.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 1.5l3 2.5-2.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nuevo Sorteo
          </button>
        </div>
      )}
    </div>
  )
}

function WinnerCard({ winner, position, visible }) {
  const medals = ['🥇', '🥈', '🥉']
  const medal = medals[position - 1] || `#${position}`

  return (
    <div
      className={`${styles.winnerCard} ${visible ? styles.winnerCardVisible : ''}`}
      style={{ animationDelay: `${(position - 1) * 0.08}s` }}
    >
      <div className={styles.winnerMedal}>{medal}</div>
      <div className={styles.winnerInfo}>
        <p className={styles.winnerName}>
          {winner.author || winner.original}
        </p>
        {winner.otherMentions?.length > 0 && (
          <p className={styles.winnerExtra}>
            etiquetó a: {winner.otherMentions.join(', ')}
          </p>
        )}
        <p className={styles.winnerComment}>{winner.original}</p>
      </div>
      <div className={styles.winnerRank}>#{position}</div>
    </div>
  )
}

function SlotReel({ items }) {
  const [offset, setOffset] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const itemHeight = 56
    const totalHeight = items.length * itemHeight

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const speed = Math.max(1, 12 - elapsed / 280)
      setOffset((prev) => (prev + speed) % totalHeight)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [items])

  const displayItems = [...items, ...items, ...items]

  return (
    <div
      className={styles.reel}
      style={{ transform: `translateY(-${offset}px)` }}
    >
      {displayItems.map((item, i) => (
        <div key={i} className={styles.reelItem}>
          <span className={styles.reelAt}>
            {item.author || item.original.substring(0, 20)}
          </span>
        </div>
      ))}
    </div>
  )
}

function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2.5 + Math.random() * 2}s`,
      color: ['#1159AD', '#E8C547', '#111111', '#16a34a', '#dc2626'][i % 5],
      size: `${6 + Math.random() * 8}px`,
      rotate: `${Math.random() * 360}deg`,
    }))
  )

  if (!active) return null

  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {pieces.current.map((p) => (
        <div
          key={p.id}
          className={styles.confettiPiece}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </div>
  )
}
