import { useState, useRef } from 'react'
import { parseComments } from '../utils/raffle'
import styles from './StepImport.module.css'

const EXAMPLE = `@maria_garcia: ¡Participa @carlos_rdz, tú puedes ganar! 🎉
@carlos_rdz: @sofia.torres y @pedro_mn apuntaos ya 🔥
@sofia.torres: Qué emocionante este sorteo! Me encanta ❤️
@miguel_dev: @laura_2024 deberías participar, ojalá ganemos!
@laura_2024: Adoroooo tus contenidos 😍
@roberto_mx: Enhorabuena por los 2K! Mucha suerte a todos
@diana_beauty: @valeria_hdz mira este sorteo, participa!
@juan_carlos22: @juan_carlos22 ya me apunté 🤞
@valeria_hdz: @pedro_gtz y @roberto_mx a ver quién gana!
@pedro_gtz: Contando los días para el resultado!`

export default function StepImport({ onNext }) {
  const [raw, setRaw] = useState('')
  const [loaded, setLoaded] = useState(null) // null = no cargado aún
  const [error, setError] = useState('')
  const previewRef = useRef(null)

  function handleLoad() {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError('Pega al menos un comentario antes de cargar.')
      return
    }
    const parsed = parseComments(raw)
    if (parsed.length === 0) {
      setError('No se detectaron comentarios válidos. Revisa el formato.')
      return
    }
    setLoaded(parsed)
    setError('')
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
  }

  function handleRawChange(e) {
    setRaw(e.target.value)
    setError('')
    if (loaded) setLoaded(null) // reinicia preview si edita el texto
  }

  function loadExample() {
    setRaw(EXAMPLE)
    setLoaded(null)
    setError('')
  }

  function handleNext() {
    onNext(loaded)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Importar Participantes</h1>
        <p className={styles.subtitle}>
          Pega los comentarios de Instagram, un comentario por línea
          con el formato <code className={styles.formatCode}>@usuario: texto</code>
        </p>
      </div>

      {/* Textarea */}
      <div className={styles.inputSection}>
        <div className={styles.inputHeader}>
          <span className={styles.inputLabel}>Comentarios de Instagram</span>
          <button className={styles.exampleBtn} onClick={loadExample}>
            Ver ejemplo
          </button>
        </div>
        <textarea
          className={styles.textarea}
          placeholder={`@usuario1: Me encanta este sorteo! ❤️\n@usuario2: Participando con todo 🔥\n@usuario3: Ojalá gane, lo necesito mucho!\n…`}
          value={raw}
          onChange={handleRawChange}
          spellCheck={false}
        />
        <div className={styles.inputFooter}>
          <span className={styles.lineCount}>
            {raw.trim()
              ? `${raw.split('\n').filter((l) => l.trim()).length} líneas`
              : 'Sin contenido'}
          </span>
          {error && (
            <span className={styles.errorInline}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M6.5 4v3M6.5 8.5v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Botón cargar */}
      <button
        className={styles.loadBtn}
        onClick={handleLoad}
        disabled={!raw.trim()}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2v10M4 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Cargar participantes
      </button>

      {/* Vista previa */}
      {loaded && (
        <div className={styles.preview} ref={previewRef}>
          <div className={styles.previewHeader}>
            <div className={styles.counter}>
              <span className={styles.counterNum}>{loaded.length}</span>
              <span className={styles.counterLabel}>
                participante{loaded.length !== 1 ? 's' : ''} cargado{loaded.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className={styles.previewBadge}>
              {loaded.filter((c) => c.valid).length} mencionan a otro usuario
            </span>
          </div>

          <ul className={styles.list}>
            {loaded.map((c) => {
              const colonIdx = c.original.indexOf(':')
              const user =
                colonIdx > 0
                  ? c.original.slice(0, colonIdx).trim()
                  : c.mentions[0] || c.original.split(/\s/)[0]
              const text =
                colonIdx > 0
                  ? c.original.slice(colonIdx + 1).trim()
                  : c.original

              return (
                <li key={c.id} className={`${styles.item} ${!c.valid ? styles.itemInvalid : ''}`}>
                  <span className={styles.itemIndex}>{c.id + 1}</span>
                  <div className={styles.itemBody}>
                    <span className={styles.itemUser}>{user}</span>
                    {text && <span className={styles.itemText}>{text}</span>}
                  </div>
                  {c.valid ? (
                    <span className={styles.tagValid}>válido</span>
                  ) : (
                    <span className={styles.tagInvalid}>sin mención</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Botón siguiente */}
      <button
        className={styles.nextBtn}
        onClick={handleNext}
        disabled={!loaded}
      >
        Siguiente
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 9h10M10 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
