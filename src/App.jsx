import { useState } from 'react'
import StepIndicator from './components/StepIndicator'
import StepImport from './components/StepImport'
import StepFilter from './components/StepFilter'
import StepDraw from './components/StepDraw'
import StepResult from './components/StepResult'
import { drawWinners } from './utils/raffle'
import styles from './App.module.css'

export default function App() {
  const [step, setStep] = useState(1)
  const [comments, setComments] = useState([])
  const [participants, setParticipants] = useState([])
  const [result, setResult] = useState(null)

  function handleImport(parsed) {
    setComments(parsed)
    setStep(2)
  }

  function handleFilter(validParticipants) {
    setParticipants(validParticipants)
    setStep(3)
  }

  function handleDraw({ seed, numWinners }) {
    const drawResult = drawWinners(participants, numWinners, seed)
    setResult(drawResult)
    setStep(4)
  }

  function handleReset() {
    setStep(1)
    setComments([])
    setParticipants([])
    setResult(null)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2"/>
              <circle cx="7.5" cy="9" r="1.8" fill="white"/>
              <circle cx="14.5" cy="9" r="1.8" fill="white"/>
              <circle cx="11" cy="14.5" r="1.8" fill="white"/>
            </svg>
          </div>
          <div>
            <span className={styles.logoTitle}>Sorteo Instagram</span>
            <span className={styles.logoSub}>transparente &amp; auditable</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <StepIndicator current={step} />

          <div className={styles.stepContent}>
            {step === 1 && <StepImport onNext={handleImport} />}
            {step === 2 && (
              <StepFilter
                comments={comments}
                onNext={handleFilter}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <StepDraw
                participants={participants}
                onNext={handleDraw}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && result && (
              <StepResult
                result={result}
                participants={participants}
                onReset={handleReset}
              />
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>
            Algoritmo determinista: FNV-1a hash → Mulberry32 PRNG → Fisher-Yates shuffle
          </p>
          <p>El sorteo es 100% reproducible con la misma semilla y lista de participantes.</p>
        </footer>
      </main>
    </div>
  )
}
