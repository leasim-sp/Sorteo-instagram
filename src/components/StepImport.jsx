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
  const [mode, setMode] = useState('manual') // 'manual' | 'apify'

  // Manual mode state
  const [raw, setRaw] = useState('')
  const [loaded, setLoaded] = useState(null)
  const [error, setError] = useState('')
  const previewRef = useRef(null)

  // Apify mode state
  const [instagramUrl, setInstagramUrl] = useState('')
  const [apifyToken, setApifyToken] = useState(() => localStorage.getItem('apify_token') || '')
  const [showToken, setShowToken] = useState(false)
  const [apifyLoading, setApifyLoading] = useState(false)
  const [apifyError, setApifyError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(null)

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
    if (loaded) setLoaded(null)
  }

  function loadExample() {
    setRaw(EXAMPLE)
    setLoaded(null)
    setError('')
  }

  function handleNext() {
    onNext(loaded)
  }

  async function fetchFromApify() {
    const url = instagramUrl.trim()
    const token = apifyToken.trim()

    if (!url) { setApifyError('Introduce la URL del post de Instagram.'); return }
    if (!token) { setApifyError('Introduce tu API key de Apify.'); return }

    localStorage.setItem('apify_token', token)
    setApifyError('')
    setApifyLoading(true)
    setElapsed(0)

    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)

    try {
      const res = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-comment-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directUrls: [url], resultsLimit: 500 }),
        }
      )

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Error ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
      }

      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Apify no devolvió comentarios. Verifica la URL o los permisos del post.')
      }

      const lines = data
        .filter((item) => item.ownerUsername && item.text)
        .map((item) => `@${item.ownerUsername}: ${item.text}`)
        .join('\n')

      setMode('manual')
      setRaw(lines)
      setLoaded(null)
      setError('')

      // Auto-load parsed result
      const parsed = parseComments(lines)
      if (parsed.length > 0) {
        setLoaded(parsed)
        setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
      }
    } catch (err) {
      setApifyError(err.message || 'Error desconocido al contactar con Apify.')
    } finally {
      clearInterval(elapsedRef.current)
      setApifyLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setApifyError('')
    setError('')
    setLoaded(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Importar Participantes</h1>
        <p className={styles.subtitle}>
          Obtén los comentarios del post de Instagram de forma automática o pégalos manualmente
        </p>
      </div>

      {/* Mode toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'apify' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('apify')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Desde Instagram (Apify)
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('manual')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Manual (pegar texto)
        </button>
      </div>

      {/* ── Apify mode ── */}
      {mode === 'apify' && (
        <div className={styles.apifyPanel}>
          <div className={styles.apifyField}>
            <label className={styles.apifyLabel}>URL del post de Instagram</label>
            <input
              className={styles.apifyInput}
              type="url"
              placeholder="https://www.instagram.com/p/XXXXXXXX/"
              value={instagramUrl}
              onChange={(e) => { setInstagramUrl(e.target.value); setApifyError('') }}
              disabled={apifyLoading}
            />
          </div>

          <div className={styles.apifyField}>
            <label className={styles.apifyLabel}>
              API Key de Apify
              <span className={styles.apifyLabelHint}>(se guarda en tu navegador)</span>
            </label>
            <div className={styles.apifyTokenRow}>
              <input
                className={styles.apifyInput}
                type={showToken ? 'text' : 'password'}
                placeholder="apify_api_XXXXXXXXXXXX"
                value={apifyToken}
                onChange={(e) => { setApifyToken(e.target.value); setApifyError('') }}
                disabled={apifyLoading}
              />
              <button
                className={styles.eyeBtn}
                onClick={() => setShowToken((v) => !v)}
                type="button"
                aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
              >
                {showToken ? (
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M2 2l13 13M7.2 7.3A2 2 0 0 0 9.7 9.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M4.5 4.8C3 5.9 1.8 7.1 1.3 8.5c1.2 3.2 4.2 5.5 7.2 5.5a7.3 7.3 0 0 0 3.5-.9M7 2.6A7.3 7.3 0 0 1 8.5 2.5c3 0 6 2.3 7.2 5.5-.4 1-1 2-1.8 2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M1.3 8.5C2.5 5.3 5.5 3 8.5 3s6 2.3 7.2 5.5C14.5 11.7 11.5 14 8.5 14S2.5 11.7 1.3 8.5z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {apifyError && (
            <div className={styles.apifyError}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 4.5v3M7 9.5v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {apifyError}
            </div>
          )}

          {apifyLoading && (
            <div className={styles.apifyLoading}>
              <svg className={styles.spinner} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15"/>
              </svg>
              <div>
                <p className={styles.loadingText}>Obteniendo comentarios de Instagram…</p>
                <p className={styles.loadingHint}>
                  {elapsed < 15
                    ? 'Conectando con Apify…'
                    : elapsed < 60
                    ? `Esto puede tardar hasta 2 minutos (${elapsed}s)`
                    : `Cargando… ${elapsed}s — ten paciencia`}
                </p>
              </div>
            </div>
          )}

          <button
            className={styles.loadBtn}
            onClick={fetchFromApify}
            disabled={apifyLoading || !instagramUrl.trim() || !apifyToken.trim()}
          >
            {apifyLoading ? (
              <>
                <svg className={styles.spinner} width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="35" strokeDashoffset="12"/>
                </svg>
                Cargando comentarios…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v10M4 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Cargar comentarios desde Instagram
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Manual mode ── */}
      {mode === 'manual' && (
        <>
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
        </>
      )}

      {/* Vista previa — shown in both modes after load */}
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
