import styles from './StepIndicator.module.css'

const STEPS = [
  { num: 1, label: 'Importar' },
  { num: 2, label: 'Filtrar' },
  { num: 3, label: 'Sorteo' },
  { num: 4, label: 'Resultado' },
]

export default function StepIndicator({ current }) {
  return (
    <div className={styles.wrapper}>
      {STEPS.map((step, idx) => {
        const state =
          step.num < current ? 'done' : step.num === current ? 'active' : 'pending'
        return (
          <div key={step.num} className={styles.item}>
            <div className={`${styles.circle} ${styles[state]}`}>
              {state === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span className={`${styles.label} ${styles[state]}`}>{step.label}</span>
            {idx < STEPS.length - 1 && (
              <div className={`${styles.connector} ${state === 'done' ? styles.connectorDone : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
