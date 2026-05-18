import { useState } from 'react'
import { parseComments } from '../utils/raffle'
import styles from './StepImport.module.css'

const EXAMPLE = `@maria_garcia Qué emocionante este sorteo! Me encanta ❤️
@carlos_rdz Participando! Etiqueto a @ana_lopez y @pedro_mn 🔥
juan123 Este comentario no tiene mención válida
@sofia.torres Me apunto! Sigue así 🎉
@miguel_dev Ojalá gane, lo necesito! cc @lucia.star
@laura_2024 Adoroooo tus contenidos 😍
@roberto_mx Aquí presente! Mucha suerte a todos
@diana_beauty Participando con todo!! 💪`

export default function StepImport({ onNext }) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  function handleNext() {
    if (lines.length < 1) {
      setError('Pega al menos un comentario para continuar.')
      return
    }
    const parsed = parseComments(raw)
    onNext(parsed)
  }

  function loadExample() {
    setRaw(EXAMPLE)
    setError('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Importar Participantes</h1>
        <p className={styles.subtitle}>
          Copia y pega los comentarios de tu publicación de Instagram.<br />
          Cada línea se tratará como un comentario independiente.
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardLabel}>Comentarios</span>
          <button className={styles.exampleBtn} onClick={loadExample}>
            Cargar ejemplo
          </button>
        </div>

        <textarea
          className={styles.textarea}
          placeholder={`Pega aquí los comentarios…\n\n@usuario1 Me encanta este sorteo!\n@usuario2 Participando 🎉\n…`}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            setError('')
          }}
          spellCheck={false}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{lines.length}</span>
            <span className={styles.statLabel}>comentarios detectados</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>
              {lines.filter((l) => /@[\w.]+/.test(l)).length}
            </span>
            <span className={styles.statLabel}>contienen @mención</span>
          </div>
        </div>
      </div>

      <div className={styles.hint}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 7v5M8 5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Puedes pegar comentarios directamente desde el navegador o desde una herramienta de exportación. Cada línea = un comentario.</span>
      </div>

      <button
        className={styles.nextBtn}
        onClick={handleNext}
        disabled={lines.length === 0}
      >
        Continuar a filtrado
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
