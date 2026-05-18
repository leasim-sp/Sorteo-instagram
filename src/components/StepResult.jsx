import { useState, useEffect, useRef, useMemo } from 'react'
import { downloadCertificate } from '../utils/certificate'
import styles from './StepResult.module.css'

// Slot geometry
const ITEM_H = 68          // height of each reel item (px)
const VISIBLE = 5          // items shown in the viewport
const VIEWPORT_H = ITEM_H * VISIBLE
const CENTER_OFFSET = (VIEWPORT_H - ITEM_H) / 2  // 136px → winner sits here
const BEFORE = 40          // random items before the winner in the reel
const FINAL_Y = -(BEFORE * ITEM_H - CENTER_OFFSET) // -2584px

const SPIN_MS  = 5000   // slot animation duration
const BUFFER_MS = 500   // delay after css transition ends before state change
const SHOW_MS  = 2800   // time the winner card is shown before next spin

export default function StepResult({ result, participants, onReset }) {
  const { winners, seed, numericSeed, timestamp, totalParticipants } = result

  // State machine: one spin per prize
  const [prizeIdx,        setPrizeIdx]        = useState(0)
  const [phase,           setPhase]           = useState('spinning') // 'spinning' | 'revealed' | 'done'
  const [revealedWinners, setRevealedWinners] = useState([])
  const timerRef = useRef(null)

  const currentWinner = winners[prizeIdx]

  useEffect(() => {
    const delay = phase === 'spinning' ? SPIN_MS + BUFFER_MS : SHOW_MS
    timerRef.current = setTimeout(() => {
      if (phase === 'spinning') {
        setRevealedWinners((prev) => [...prev, currentWinner])
        setPhase('revealed')
      } else if (phase === 'revealed') {
        if (prizeIdx + 1 < winners.length) {
          setPrizeIdx((i) => i + 1)
          setPhase('spinning')
        } else {
          setPhase('done')
        }
      }
    }, delay)
    return () => clearTimeout(timerRef.current)
  }, [phase, prizeIdx])

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

  const prizeLabel = winners.length > 1
    ? `Premio ${prizeIdx + 1} de ${winners.length}`
    : 'Premio único'

  return (
    <div className={styles.container}>
      <Confetti active={phase === 'done'} />

      {/* ── Spinning phase ── */}
      {phase === 'spinning' && (
        <>
          <div className={styles.header}>
            <p className={styles.prizeLabel}>{prizeLabel}</p>
            <h1 className={styles.titleSpin}>Sorteando…</h1>
          </div>

          {/* Previously revealed winners (compact) */}
          {revealedWinners.length > 0 && (
            <div className={styles.prevWinners}>
              {revealedWinners.map((w, i) => (
                <CompactWinner key={w.id} winner={w} position={i + 1} />
              ))}
            </div>
          )}

          {/* Slot machine — re-mounts on each prize via key */}
          <SlotReel key={prizeIdx} winner={currentWinner} pool={participants} />

          <div className={styles.seedMini}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="3.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M3.5 3.5V3a2.5 2.5 0 0 1 5 0v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <code>{seed}</code>
          </div>
        </>
      )}

      {/* ── Revealed phase ── */}
      {phase === 'revealed' && (
        <>
          <div className={styles.header}>
            <p className={styles.prizeLabel}>{prizeLabel}</p>
            <h1 className={styles.titleReveal}>¡Ganador!</h1>
          </div>

          {/* Previously revealed winners (compact) */}
          {revealedWinners.length > 1 && (
            <div className={styles.prevWinners}>
              {revealedWinners.slice(0, -1).map((w, i) => (
                <CompactWinner key={w.id} winner={w} position={i + 1} />
              ))}
            </div>
          )}

          {/* Current winner — big reveal */}
          <WinnerReveal
            winner={revealedWinners[revealedWinners.length - 1]}
            position={prizeIdx + 1}
          />

          <div className={styles.nextHint}>
            {prizeIdx + 1 < winners.length
              ? `Sorteando premio ${prizeIdx + 2} en un momento…`
              : 'Preparando resultados finales…'}
          </div>
        </>
      )}

      {/* ── Done phase ── */}
      {phase === 'done' && (
        <>
          <div className={styles.header}>
            <h1 className={styles.titleDone}>¡Ganadores!</h1>
            <p className={styles.subtitle}>
              {winners.length} ganador{winners.length > 1 ? 'es' : ''} de {totalParticipants} participantes
            </p>
          </div>

          <div className={styles.winnersList}>
            {winners.map((w, i) => (
              <WinnerCard key={w.id} winner={w} position={i + 1} />
            ))}
          </div>

          <div className={styles.seedBox}>
            <div className={styles.seedBoxLabel}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="3.5" width="11" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M3.5 3.5V3A3 3 0 0 1 9.5 3v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Semilla utilizada
            </div>
            <code className={styles.seedBoxValue}>{seed}</code>
            <span className={styles.seedBoxHash}>→ {numericSeed.toLocaleString()}</span>
          </div>

          <div className={styles.actions}>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2v8M5 7.5l3.5 3.5L12 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 13h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Descargar Acta
            </button>
            <button className={styles.resetBtn} onClick={onReset}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M13.5 3A6.5 6.5 0 1 0 14.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M11 1l3 2.5-2.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nuevo Sorteo
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Slot Reel — CSS-transition-based stop on winner
───────────────────────────────────────────────── */
function SlotReel({ winner, pool }) {
  const reelRef = useRef(null)

  // Build the reel list once on mount
  const items = useMemo(() => {
    const before = Array.from({ length: BEFORE }, (_, i) => pool[i % pool.length])
    const after  = Array.from({ length: VISIBLE }, (_, i) => pool[(i + 1) % pool.length])
    return [...before, winner, ...after]
  }, []) // stable — winner identity fixed for this mount

  useEffect(() => {
    if (!reelRef.current) return
    // 1. Reset to top with no transition
    reelRef.current.style.transition = 'none'
    reelRef.current.style.transform  = 'translateY(0px)'
    // 2. Force reflow so the browser registers the reset
    void reelRef.current.offsetHeight
    // 3. Apply the decelerating transition — lands exactly on the winner
    reelRef.current.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.06, 0.85, 0.25, 1)`
    reelRef.current.style.transform  = `translateY(${FINAL_Y}px)`
  }, [])

  const handleName = (p) => p.author || p.original.substring(0, 22)

  return (
    <div className={styles.slotWrapper}>
      <div className={styles.slotViewport}>
        {/* Gradient overlays */}
        <div className={styles.slotFadeTop}    />
        <div className={styles.slotFadeBottom} />
        {/* Centre highlight strip */}
        <div className={styles.slotHighlight}  />
        {/* The scrolling reel */}
        <div ref={reelRef} className={styles.reel}>
          {items.map((item, i) => (
            <div key={i} className={styles.reelItem}>
              <span className={styles.reelHandle}>{handleName(item)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Winner cards
───────────────────────────────────────────────── */
const MEDALS = ['🥇', '🥈', '🥉']

function WinnerReveal({ winner, position }) {
  return (
    <div className={styles.reveal}>
      <span className={styles.revealMedal}>{MEDALS[position - 1] ?? `#${position}`}</span>
      <p className={styles.revealName}>{winner.author || winner.original}</p>
      {winner.otherMentions?.length > 0 && (
        <p className={styles.revealSub}>etiquetó a {winner.otherMentions.join(', ')}</p>
      )}
      <p className={styles.revealComment}>{winner.original}</p>
    </div>
  )
}

function WinnerCard({ winner, position }) {
  return (
    <div className={styles.winnerCard} style={{ animationDelay: `${position * 0.1}s` }}>
      <span className={styles.winnerMedal}>{MEDALS[position - 1] ?? `#${position}`}</span>
      <div className={styles.winnerInfo}>
        <p className={styles.winnerName}>{winner.author || winner.original}</p>
        {winner.otherMentions?.length > 0 && (
          <p className={styles.winnerSub}>etiquetó a {winner.otherMentions.join(', ')}</p>
        )}
        <p className={styles.winnerComment}>{winner.original}</p>
      </div>
      <span className={styles.winnerPos}>#{position}</span>
    </div>
  )
}

function CompactWinner({ winner, position }) {
  return (
    <div className={styles.compact}>
      <span className={styles.compactMedal}>{MEDALS[position - 1] ?? `#${position}`}</span>
      <span className={styles.compactName}>{winner.author || winner.original}</span>
      <span className={styles.compactLabel}>Premio {position}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Confetti
───────────────────────────────────────────────── */
function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 56 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.6}s`,
      duration: `${2.8 + Math.random() * 2}s`,
      color: ['#1159AD','#E8C547','#111111','#16a34a','#dc2626','#f97316'][i % 6],
      size: `${6 + Math.random() * 9}px`,
      rotate: `${Math.random() * 360}deg`,
    }))
  )

  if (!active) return null

  return (
    <div className={styles.confetti} aria-hidden="true">
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
