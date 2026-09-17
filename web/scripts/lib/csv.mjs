/**
 * RFC 4180 준수 CSV 파서.
 * 따옴표 안의 쉼표·개행·이스케이프된 따옴표를 모두 처리합니다.
 * 시트의 definition·question·body 열에는 개행이 들어가므로
 * split(',') 같은 자체 구현을 쓰면 조용히 깨집니다. (F-08 예외 처리)
 */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false, i = 0;

  // BOM 제거
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }

    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => String(v).trim() !== ''));
}

/**
 * 헤더명 기준으로 행을 객체로 변환합니다.
 * **열 위치에 의존하지 않습니다** — 시트에서 열 순서를 바꿔도 안전합니다.
 * 대신 헤더명이 바뀌면 필수 열 검사(V-01)에서 빌드가 실패합니다.
 */
export function toObjects(rows) {
  if (!rows.length) return { headers: [], records: [] };
  const headers = rows[0].map(h => String(h).trim());
  const records = rows.slice(1).map((r, idx) => {
    const o = { __row: idx + 2 };            // 시트 실제 행 번호 (1행은 헤더)
    headers.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o;
  });
  return { headers, records };
}
