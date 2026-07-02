import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { csvText, type CsvRow } from '../lib/downloads'

function useDownloadUrl(content: string, type: string) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const nextUrl = URL.createObjectURL(new Blob([content], { type }))
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [content, type])
  return url
}

export function CsvLink({ filename, rows, label = 'CSV' }: { filename: string; rows: CsvRow[]; label?: string }) {
  const url = useDownloadUrl(csvText(rows), 'text/csv;charset=utf-8')
  return <a className="text-button export-link" href={url || undefined} download={filename} aria-label={`Download ${label}: ${filename}`} aria-disabled={!url}><Download />{label}</a>
}
