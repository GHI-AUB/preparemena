export type CsvRow = Record<string, unknown>

export function csvText(rows: CsvRow[]): string {
  if (!rows.length) return '\ufeff'
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))))
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return `\ufeff${[columns.map(escape).join(','), ...rows.map(row => columns.map(column => escape(row[column])).join(','))].join('\r\n')}`
}

export function csvDataUri(rows: CsvRow[]): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csvText(rows))}`
}
