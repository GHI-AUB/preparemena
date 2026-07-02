import { describe, expect, it } from 'vitest'
import { csvDataUri, csvText } from './downloads'

describe('CSV exports', () => {
  it('uses a UTF-8 BOM, CRLF rows, and escapes quotes and commas', () => {
    const text = csvText([{ country: 'A, B', note: 'said "yes"', missing: null }])
    expect(text.startsWith('\ufeff')).toBe(true)
    expect(text).toContain('\r\n')
    expect(text).toContain('"A, B"')
    expect(text).toContain('"said ""yes"""')
    expect(text).toContain('""')
  })
  it('creates a downloadable CSV data URI', () => expect(csvDataUri([{ value: 1 }])).toMatch(/^data:text\/csv;charset=utf-8,/))
})
