/** Generate and download an HTML certificate (acta) for the raffle */
export function downloadCertificate({ winners, seed, numericSeed, timestamp, totalParticipants, numWinners }) {
  const dateStr = new Date(timestamp).toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const winnersHTML = winners
    .map(
      (w, i) => `
      <tr>
        <td class="rank">#${i + 1}</td>
        <td class="winner-name">${escapeHtml(w.author || w.original)}</td>
        <td class="comment">${escapeHtml(w.original)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Acta de Sorteo — ${escapeHtml(seed)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root { --blue:#1159AD; --yellow:#E8C547; --black:#111111; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family:'Space Grotesk',sans-serif;
      background:#fff;
      color:var(--black);
      padding:40px;
      max-width:860px;
      margin:0 auto;
    }
    @media print {
      body { padding:20px; }
      .no-print { display:none; }
    }
    .header {
      display:flex;
      align-items:center;
      gap:16px;
      border-bottom:4px solid var(--blue);
      padding-bottom:20px;
      margin-bottom:28px;
    }
    .badge {
      background:var(--blue);
      color:#fff;
      font-family:'Bebas Neue',sans-serif;
      font-size:14px;
      letter-spacing:0.1em;
      padding:6px 14px;
      border-radius:4px;
      white-space:nowrap;
    }
    h1 {
      font-family:'Bebas Neue',sans-serif;
      font-size:42px;
      letter-spacing:0.04em;
      color:var(--blue);
      line-height:1;
    }
    .subtitle {
      font-size:13px;
      color:#666;
      margin-top:4px;
    }
    .section {
      background:#f8f9fa;
      border:1px solid #e4e8ed;
      border-radius:8px;
      padding:20px 24px;
      margin-bottom:20px;
    }
    .section-title {
      font-family:'Bebas Neue',sans-serif;
      font-size:18px;
      letter-spacing:0.08em;
      color:var(--blue);
      margin-bottom:12px;
    }
    .meta-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
    }
    .meta-item label {
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:#888;
      display:block;
      margin-bottom:3px;
    }
    .meta-item span {
      font-size:14px;
      font-weight:600;
    }
    .seed-box {
      background:var(--black);
      color:var(--yellow);
      font-family:'Courier New',monospace;
      font-size:16px;
      font-weight:700;
      padding:12px 16px;
      border-radius:6px;
      letter-spacing:0.08em;
      margin-top:10px;
      word-break:break-all;
    }
    table {
      width:100%;
      border-collapse:collapse;
      margin-top:8px;
    }
    thead tr {
      background:var(--blue);
      color:#fff;
    }
    thead th {
      font-family:'Bebas Neue',sans-serif;
      font-size:14px;
      letter-spacing:0.06em;
      padding:10px 14px;
      text-align:left;
    }
    tbody tr:nth-child(even) { background:#f0f4fb; }
    tbody tr:nth-child(odd) { background:#fff; }
    td {
      padding:10px 14px;
      font-size:14px;
      border-bottom:1px solid #e4e8ed;
    }
    td.rank {
      font-weight:700;
      color:var(--blue);
      width:48px;
    }
    td.winner-name {
      font-weight:700;
      font-size:15px;
      color:var(--black);
      width:180px;
    }
    td.comment {
      color:#555;
      font-size:13px;
    }
    .algorithm {
      font-size:12px;
      color:#666;
      line-height:1.7;
    }
    .algorithm code {
      background:#e8edf5;
      padding:2px 6px;
      border-radius:3px;
      font-size:11px;
    }
    .footer {
      margin-top:32px;
      padding-top:16px;
      border-top:2px solid var(--yellow);
      display:flex;
      justify-content:space-between;
      align-items:center;
      font-size:12px;
      color:#888;
    }
    .footer strong { color:var(--blue); }
    .print-btn {
      display:inline-flex;
      align-items:center;
      gap:8px;
      background:var(--blue);
      color:#fff;
      font-family:'Space Grotesk',sans-serif;
      font-size:14px;
      font-weight:600;
      padding:10px 20px;
      border:none;
      border-radius:6px;
      cursor:pointer;
      margin-bottom:24px;
    }
    .print-btn:hover { background:#0d4490; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">
    🖨 Imprimir / Guardar como PDF
  </button>

  <div class="header">
    <div>
      <h1>Acta de Sorteo</h1>
      <p class="subtitle">Documento de transparencia y auditoría — Generado automáticamente</p>
    </div>
    <div class="badge">Instagram Raffle</div>
  </div>

  <div class="section">
    <div class="section-title">Información del Sorteo</div>
    <div class="meta-grid">
      <div class="meta-item">
        <label>Fecha y hora</label>
        <span>${dateStr}</span>
      </div>
      <div class="meta-item">
        <label>Total de participantes</label>
        <span>${totalParticipants} participantes válidos</span>
      </div>
      <div class="meta-item">
        <label>Número de ganadores</label>
        <span>${numWinners}</span>
      </div>
      <div class="meta-item">
        <label>Algoritmo</label>
        <span>Fisher-Yates + Mulberry32 PRNG</span>
      </div>
    </div>
    <div style="margin-top:16px;">
      <label style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;display:block;margin-bottom:4px;">Semilla pública (seed)</label>
      <div class="seed-box">${escapeHtml(seed)} → ${numericSeed}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ganadores</div>
    <table>
      <thead>
        <tr>
          <th>Pos.</th>
          <th>Ganador</th>
          <th>Comentario original</th>
        </tr>
      </thead>
      <tbody>
        ${winnersHTML}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Verificación del Algoritmo</div>
    <p class="algorithm">
      Este sorteo usa un algoritmo <strong>determinista y reproducible</strong>.<br/>
      La semilla <code>${escapeHtml(seed)}</code> se convierte al número <code>${numericSeed}</code>
      mediante un hash FNV-1a de 32 bits. Ese número inicializa el generador
      pseudoaleatorio <strong>Mulberry32</strong>, que produce una secuencia de números reproducibles.
      A continuación se aplica el algoritmo <strong>Fisher-Yates shuffle</strong> sobre la lista
      de participantes para mezclarla de forma determinista. Los primeros ${numWinners} elementos
      de la lista mezclada son los ganadores.<br/><br/>
      Cualquier persona puede verificar este resultado introduciendo la misma semilla
      y lista de participantes en la aplicación.
    </p>
  </div>

  <div class="footer">
    <span>Generado con <strong>Sorteo Instagram</strong> — sorteo transparente y auditable</span>
    <span>${new Date(timestamp).toLocaleDateString('es-ES')}</span>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acta-sorteo-${seed.replace(/[^a-z0-9]/gi, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
