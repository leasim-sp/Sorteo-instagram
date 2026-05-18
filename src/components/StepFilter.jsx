import { useState, useMemo } from 'react'
import styles from './StepFilter.module.css'

export default function StepFilter({ comments, onNext, onBack }) {
  const [items, setItems] = useState(comments)
  const [search, setSearch] = useState('')
  const [showOnly, setShowOnly] = useState('all')

  const toggle = (id) => {
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, included: !c.included } : c))
    )
  }

  const filtered = useMemo(() => {
    let result = items
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.original.toLowerCase().includes(q))
    }
    if (showOnly === 'valid') result = result.filter((c) => c.valid)
    if (showOnly === 'invalid') result = result.filter((c) => !c.valid)
    return result
  }, [items, search, showOnly])

  const validCount = items.filter((c) => c.valid && c.included).length
  const invalidCount = items.filter((c) => !c.valid).length
  const includedCount = items.filter((c) => c.included).length

  function handleNext() {
    const participants = items.filter((c) => c.valid && c.included)
    onNext(participants)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Filtrar Participantes</h1>
        <p className={styles.subtitle}>
          Solo los comentarios con <strong>@mención</strong> participan en el sorteo.
          Puedes excluir manualmente cualquier comentario.
        </p>
      </div>

      <div className={styles.summary}>
        <div className={`${styles.badge} ${styles.badgeGreen}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
            <path d="M4 7l2.5 2.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span><strong>{validCount}</strong> válidos</span>
        </div>
        <div className={`${styles.badge} ${styles.badgeRed}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
            <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span><strong>{invalidCount}</strong> sin @mención</span>
        </div>
        <div className={`${styles.badge} ${styles.badgeBlue}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4 5l3 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span><strong>{items.length}</strong> total</span>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          type="text"
          className={styles.search}
          placeholder="Buscar comentario o @usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.tabs}>
          {['all', 'valid', 'invalid'].map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${showOnly === t ? styles.tabActive : ''}`}
              onClick={() => setShowOnly(t)}
            >
              {t === 'all' ? 'Todos' : t === 'valid' ? 'Válidos' : 'Inválidos'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p>No hay comentarios que coincidan con el filtro.</p>
          </div>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`${styles.row} ${!c.valid ? styles.rowInvalid : ''} ${!c.included ? styles.rowExcluded : ''}`}
          >
            <div className={styles.rowStatus}>
              {c.valid ? (
                <span className={styles.iconValid}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
                    <path d="M4.5 8l2.5 2.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              ) : (
                <span className={styles.iconInvalid}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
                    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
              )}
            </div>

            <div className={styles.rowContent}>
              <p className={styles.rowText}>{highlightAt(c.original)}</p>
              {c.mentions.length > 0 && (
                <div className={styles.rowMentions}>
                  {c.mentions.map((m) => (
                    <span key={m} className={styles.mentionTag}>{m}</span>
                  ))}
                </div>
              )}
            </div>

            {c.valid && (
              <button
                className={`${styles.toggleBtn} ${!c.included ? styles.toggleBtnExcluded : ''}`}
                onClick={() => toggle(c.id)}
                title={c.included ? 'Excluir' : 'Incluir'}
              >
                {c.included ? 'Excluir' : 'Incluir'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 9H4M8 4L3 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <button
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={validCount === 0}
        >
          Ir al sorteo ({validCount} participantes)
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function highlightAt(text) {
  const parts = text.split(/(@[\w.]+)/g)
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <strong key={i} style={{ color: 'var(--blue)', fontWeight: 700 }}>{part}</strong>
    ) : (
      part
    )
  )
}
