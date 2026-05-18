import { useState, useMemo } from 'react'
import styles from './StepFilter.module.css'

export default function StepFilter({ comments, onNext, onBack }) {
  // Valid ones start included; invalid ones start excluded
  const [items, setItems] = useState(() =>
    comments.map((c) => ({ ...c, included: c.valid }))
  )

  const toggle = (id) =>
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, included: !c.included } : c))
    )

  const participating = useMemo(() => items.filter((c) => c.included), [items])
  const excluded = useMemo(() => items.filter((c) => !c.included), [items])

  function handleNext() {
    onNext(participating)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Filtrar Participantes</h1>
        <p className={styles.subtitle}>
          Participan los comentarios que etiquetan a otro usuario.
          Puedes incluir o excluir entradas manualmente.
        </p>
      </div>

      {/* Counter */}
      <div className={styles.counter}>
        <div className={styles.counterMain}>
          <span className={styles.counterValid}>{participating.length}</span>
          <span className={styles.counterSep}>/</span>
          <span className={styles.counterTotal}>{items.length}</span>
        </div>
        <p className={styles.counterLabel}>participantes entran al sorteo</p>
        <div className={styles.counterBar}>
          <div
            className={styles.counterBarFill}
            style={{ width: items.length ? `${(participating.length / items.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Section: valid */}
      <section className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderValid}`}>
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.2"/>
              <path d="M3.5 7l2.5 2.5L10.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.sectionTitle}>Participarán en el sorteo</span>
          <span className={styles.sectionCount}>{participating.length}</span>
        </div>

        {participating.length === 0 ? (
          <div className={styles.empty}>
            Ningún comentario cumple los requisitos todavía.
          </div>
        ) : (
          <ul className={styles.list}>
            {participating.map((c) => (
              <li key={c.id} className={`${styles.row} ${styles.rowValid} ${!c.valid ? styles.rowOverride : ''}`}>
                <div className={styles.rowLeft}>
                  <span className={styles.rowAuthor}>{c.author || c.original.split(' ')[0]}</span>
                  <span className={styles.rowComment}>{commentText(c.original)}</span>
                </div>
                <div className={styles.rowRight}>
                  {c.valid && c.otherMentions.length > 0 && (
                    <div className={styles.rowTags}>
                      {c.otherMentions.map((m) => (
                        <span key={m} className={styles.mentionTag}>{m}</span>
                      ))}
                    </div>
                  )}
                  {!c.valid && (
                    <span className={styles.overrideTag}>incluido manualmente</span>
                  )}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnExclude}`}
                    onClick={() => toggle(c.id)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section: excluded */}
      <section className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderExcluded}`}>
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.2"/>
              <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <span className={styles.sectionTitle}>Excluidos</span>
          <span className={styles.sectionCount}>{excluded.length}</span>
        </div>

        {excluded.length === 0 ? (
          <div className={styles.empty}>No hay comentarios excluidos.</div>
        ) : (
          <ul className={styles.list}>
            {excluded.map((c) => (
              <li key={c.id} className={`${styles.row} ${styles.rowExcluded}`}>
                <div className={styles.rowLeft}>
                  <span className={styles.rowAuthorMuted}>{c.author || c.original.split(' ')[0]}</span>
                  <span className={styles.rowComment}>{commentText(c.original)}</span>
                  <span className={styles.rowReason}>
                    {c.valid ? 'Excluido manualmente' : c.invalidReason}
                  </span>
                </div>
                <div className={styles.rowRight}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnInclude}`}
                    onClick={() => toggle(c.id)}
                  >
                    {c.valid ? 'Volver a incluir' : 'Incluir igualmente'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer */}
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
          disabled={participating.length === 0}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="8" r="1.2" fill="currentColor"/>
            <circle cx="12" cy="8" r="1.2" fill="currentColor"/>
            <circle cx="9" cy="12" r="1.2" fill="currentColor"/>
          </svg>
          Realizar sorteo
          <span className={styles.nextCount}>{participating.length}</span>
        </button>
      </div>
    </div>
  )
}

/** Returns the text portion after the colon, or the full line if no colon */
function commentText(original) {
  const idx = original.indexOf(':')
  return idx > 0 ? original.slice(idx + 1).trim() : original
}
