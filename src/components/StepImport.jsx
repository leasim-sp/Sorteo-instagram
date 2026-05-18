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
  const [mode, setMode] = useState('manual') // 'manual' | 'apify' | 'file'

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

  // File mode state
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef(null)

  // ── Manual helpers ────────────────────────────────────────────
  function handleLoad() {
    const trimmed = raw.trim()
    if (!trimmed) { setError('Pega al menos un comentario antes de cargar.'); return }
    const parsed = parseComments(raw)
    if (parsed.length === 0) { setError('No se detectaron comentarios válidos. Revisa el formato.'); return }
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

  // ── File helpers ──────────────────────────────────────────────
  function processFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['txt', 'csv'].includes(ext)) {
      setFileError('Solo se admiten archivos .txt o .csv')
      return
    }
    setFileError('')
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const parsed = parseComments(text)
      if (parsed.length === 0) {
        setFileError('No se encontraron comentarios en el archivo. Revisa que tenga el formato @usuario: texto.')
        setLoaded(null)
        return
      }
      setLoaded(parsed)
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleFileInput(e) {
    processFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }

  // ── Apify helper ──────────────────────────────────────────────
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
        `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directUrls: [url],
            resultsType: 'comments',
            resultsLimit: 500,
          }),
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
    setFileError('')
    setFileName('')
    setError('')
    setLoaded(null)
  }

  function handleNext() {
    onNext(loaded)
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
          Desde Instagram
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'file' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('file')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M9 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.5L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M9 2v4.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          Archivo CSV/TXT
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('manual')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Pegar texto
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

      {/* ── File mode ── */}
      {mode === 'file' && (
        <div className={styles.filePanel}>
          <p className={styles.fileHint}>
            Sube un archivo <code className={styles.formatCode}>.txt</code> o <code className={styles.formatCode}>.csv</code> con los comentarios exportados,
            un comentario por línea con el formato <code className={styles.formatCode}>@usuario: texto</code>
          </p>

          {/* Drop zone */}
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneOver : ''} ${fileName ? styles.dropZoneDone : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Zona de carga de archivo"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              className={styles.fileInputHidden}
              onChange={handleFileInput}
            />
            {fileName ? (
              <>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={styles.dropIcon}>
                  <circle cx="16" cy="16" r="14" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
                  <path d="M10 16.5l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className={styles.dropFileName}>{fileName}</p>
                <p className={styles.dropSubtext}>Haz clic para cambiar el archivo</p>
              </>
            ) : (
              <>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={styles.dropIcon}>
                  <path d="M18 24V12M12 18l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="2" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
                </svg>
                <p className={styles.dropTitle}>Arrastra tu archivo aquí</p>
                <p className={styles.dropSubtext}>o haz clic para seleccionarlo · .txt o .csv</p>
              </>
            )}
          </div>

          {fileError && (
            <div className={styles.apifyError}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 4.5v3M7 9.5v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {fileError}
            </div>
          )}
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

      {/* Vista previa — shown in all modes after load */}
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
