import { jsPDF } from 'jspdf'

// Brand palette (RGB)
const BLUE   = [17,  89, 173]
const BLACK  = [17,  17,  17]
const YELLOW = [232, 197,  71]
const GRAY   = [110, 110, 120]
const LGRAY  = [210, 214, 220]
const WHITE  = [255, 255, 255]
const BGBLUE = [240, 246, 255]

const PW = 210   // A4 width  (mm)
const PH = 297   // A4 height (mm)
const ML = 16    // left/right margin
const CW = PW - ML * 2  // content width = 178mm

export function downloadCertificate({
  winners,
  seed,
  numericSeed,
  timestamp,
  totalParticipants,
  numWinners,
  participants = [],
}) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' })
  let   y    = ML

  const date    = new Date(timestamp)
  const dateStr = date.toLocaleString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  // ── Page helpers ───────────────────────────────────────────────
  function newPage() {
    doc.addPage()
    y = ML
    // Mini header on continuation pages
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setColor(BLUE)
    doc.text('INDIES CALVOS', ML, y + 4)
    doc.setFont('helvetica', 'normal')
    setColor(GRAY)
    doc.text('  ·  Acta de Sorteo', ML + doc.getTextWidth('INDIES CALVOS'), y + 4)
    hline(y + 6, LGRAY, 0.3)
    y += 11
  }

  function checkY(need) {
    if (y + need > PH - 22) newPage()
  }

  // ── Drawing helpers ────────────────────────────────────────────
  function setColor(rgb, fill = false) {
    if (fill) doc.setFillColor(...rgb)
    else      doc.setTextColor(...rgb)
  }

  function hline(lineY, color = LGRAY, lw = 0.3) {
    doc.setDrawColor(...color)
    doc.setLineWidth(lw)
    doc.line(ML, lineY, PW - ML, lineY)
  }

  function filledRect(rx, ry, rw, rh, color) {
    doc.setFillColor(...color)
    doc.rect(rx, ry, rw, rh, 'F')
  }

  function sectionBar(barY, label, color = BLUE) {
    filledRect(ML, barY, CW, 8.5, color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...WHITE)
    doc.text(label, ML + 4, barY + 6)
    y = barY + 12
  }

  function metaLabel(text, lx, ly) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(text.toUpperCase(), lx, ly)
  }

  function metaValue(text, lx, ly, maxW = CW - 4) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...BLACK)
    const lines = doc.splitTextToSize(String(text), maxW)
    doc.text(lines, lx, ly)
    return lines.length
  }

  // ══════════════════════════════════════════════════════════════
  // PAGE 1 — HEADER
  // ══════════════════════════════════════════════════════════════

  // Left blue accent bar
  filledRect(ML, y, 4, 22, BLUE)
  // Yellow cap
  filledRect(ML, y, 4, 4, YELLOW)

  // "INDIES" (blue) + "CALVOS" (black) — same font size, side by side
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...BLUE)
  doc.text('INDIES', ML + 7, y + 11)
  const indiesW = doc.getTextWidth('INDIES ')
  doc.setTextColor(...BLACK)
  doc.text('CALVOS', ML + 7 + indiesW, y + 11)

  // Handle below
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text('@indies_calvos', ML + 7, y + 18)

  // Top-right: document type
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...BLUE)
  doc.text('ACTA DE SORTEO', PW - ML, y + 10, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Sorteo transparente y auditable', PW - ML, y + 17, { align: 'right' })

  y += 27
  hline(y, BLUE, 0.8)
  y += 8

  // ── Raffle info box ────────────────────────────────────────────
  const BOX_H = 40
  doc.setFillColor(...BGBLUE)
  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, CW, BOX_H, 2, 2, 'FD')

  const P = 5  // inner padding
  metaLabel('Fecha y hora del sorteo', ML + P, y + P + 3.5)
  metaValue(dateStr, ML + P, y + P + 9, CW - P * 2)

  // Stats row
  const sRow = y + P + 19
  metaLabel('Participantes validos', ML + P, sRow)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...BLUE)
  doc.text(String(totalParticipants), ML + P, sRow + 8)

  metaLabel('Premios sorteados', ML + P + 44, sRow)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...BLUE)
  doc.text(String(numWinners), ML + P + 44, sRow + 8)

  y += BOX_H + 4

  // ── Seed box ──────────────────────────────────────────────────
  checkY(18)
  filledRect(ML, y, CW, 16, BLACK)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 150)
  doc.text('SEMILLA PUBLICA (SEED)', ML + P, y + P + 1)

  doc.setFont('courier', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...YELLOW)
  const seedDisplay = doc.splitTextToSize(seed, CW - P * 2 - 30)[0]
  doc.text(seedDisplay, ML + P, y + P + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(130, 130, 140)
  doc.text(`Hash: ${numericSeed.toLocaleString()}`, PW - ML - P, y + P + 8, { align: 'right' })

  y += 20

  // ══════════════════════════════════════════════════════════════
  // WINNERS SECTION
  // ══════════════════════════════════════════════════════════════
  checkY(20)
  sectionBar(y, `GANADORES  (${numWinners} premio${numWinners > 1 ? 's' : ''})`)

  const PRIZE_LABELS = ['1er PREMIO', '2do PREMIO', '3er PREMIO', '4to PREMIO', '5to PREMIO']

  for (let i = 0; i < winners.length; i++) {
    const w         = winners[i]
    const handle    = w.author || w.original.substring(0, 30)
    const pLabel    = PRIZE_LABELS[i] ?? `${i + 1}o PREMIO`
    const commented = `"${w.original}"`
    const commentW  = CW - 14
    const cLines    = doc.splitTextToSize(commented, commentW)
    const hasTag    = w.otherMentions?.length > 0
    const cardH     = 6 + 8 + (hasTag ? 6 : 0) + cLines.length * 4.5 + 6

    checkY(cardH + 3)

    // Card background
    doc.setFillColor(...BGBLUE)
    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.5)
    doc.roundedRect(ML, y, CW, cardH, 2, 2, 'FD')

    // Yellow left stripe
    doc.setFillColor(...YELLOW)
    doc.roundedRect(ML, y, 4, cardH, 1, 1, 'F')

    // Prize label
    metaLabel(pLabel, ML + 8, y + 6)

    // Winner handle
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...BLACK)
    doc.text(handle, ML + 8, y + 14)

    let lineY = y + 18
    if (hasTag) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...GRAY)
      doc.text(`Etiqueto a: ${w.otherMentions.join(', ')}`, ML + 8, lineY)
      lineY += 5
    }

    // Original comment
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(cLines, ML + 8, lineY + 1)

    y += cardH + 4
  }

  y += 4

  // ══════════════════════════════════════════════════════════════
  // PARTICIPANTS LIST
  // ══════════════════════════════════════════════════════════════
  if (participants.length > 0) {
    checkY(20)
    sectionBar(y, `LISTA COMPLETA DE PARTICIPANTES  (${totalParticipants})`, BLACK)

    const COL  = 3
    const colW = CW / COL
    const colX = Array.from({ length: COL }, (_, i) => ML + i * colW)
    let   col  = 0

    for (let i = 0; i < participants.length; i++) {
      const p      = participants[i]
      const handle = p.author || p.original.substring(0, 22)

      if (col === 0) checkY(5.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...GRAY)
      doc.text(`${i + 1}.`, colX[col] + 5, y, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...BLACK)
      const cell = doc.splitTextToSize(handle, colW - 8)[0]
      doc.text(cell, colX[col] + 6, y)

      if (++col >= COL) { col = 0; y += 5.5 }
    }
    if (col > 0) y += 5.5
    y += 8
  }

  // ══════════════════════════════════════════════════════════════
  // ALGORITHM NOTE
  // ══════════════════════════════════════════════════════════════
  checkY(24)
  hline(y, LGRAY, 0.3)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('VERIFICACION DEL ALGORITMO', ML, y)
  y += 5

  const algoText =
    `La semilla "${seed}" genera el numero ${numericSeed.toLocaleString()} ` +
    `mediante hash FNV-1a de 32 bits. Ese numero inicializa el generador pseudoaleatorio Mulberry32, ` +
    `que produce una secuencia determinista. A continuacion se aplica Fisher-Yates shuffle ` +
    `sobre la lista de ${totalParticipants} participantes y se toman los primeros ${numWinners}. ` +
    `Cualquier persona puede reproducir este resultado con la misma semilla y lista de participantes.`

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  const aLines = doc.splitTextToSize(algoText, CW)
  checkY(aLines.length * 4 + 4)
  doc.text(aLines, ML, y)
  y += aLines.length * 4 + 10

  // ══════════════════════════════════════════════════════════════
  // TRANSPARENCY FOOTER
  // ══════════════════════════════════════════════════════════════
  checkY(18)
  doc.setFillColor(...BLUE)
  doc.roundedRect(ML, y, CW, 16, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...WHITE)
  doc.text(
    'Sorteo realizado de forma publica y auditable',
    PW / 2, y + 6.5, { align: 'center' }
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...YELLOW)
  doc.text(
    'por Indies Calvos (@indies_calvos)',
    PW / 2, y + 13, { align: 'center' }
  )

  // ── Page numbers ──────────────────────────────────────────────
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(170, 170, 180)
    doc.text(
      `Pagina ${p} de ${total}`,
      PW / 2, PH - 7, { align: 'center' }
    )
    doc.text(
      `Indies Calvos (@indies_calvos)  ·  ${date.toLocaleDateString('es-ES')}`,
      ML, PH - 7
    )
  }

  doc.save(`acta-sorteo-${seed.replace(/[^a-z0-9]/gi, '-')}.pdf`)
}
