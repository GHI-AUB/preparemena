import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { Country } from '../types'

const scoreColor = (score: number | null) => score == null ? '#bcccdc' : score < 50 ? '#c65d4b' : score < 70 ? '#d89b19' : score < 85 ? '#087e8b' : '#2f6b9a'

type Props = { countries: Country[]; value: string; onChange: (iso3: string) => void; placeholder?: string; noMatch?: string }

export function CountryPicker({ countries, value, onChange, placeholder = 'Search countries…', noMatch = 'No country matches' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const sorted = useMemo(() => [...countries].sort((a, b) => a.name.localeCompare(b.name)), [countries])
  const matches = query.trim() ? sorted.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase())) : sorted
  const selected = countries.find(c => c.iso3 === value)
  useEffect(() => {
    const onDown = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) { setOpen(false); setQuery('') } }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])
  useEffect(() => {
    listRef.current?.querySelector('.highlighted')?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])
  const choose = (iso3: string) => { onChange(iso3); setOpen(false); setQuery('') }
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) setOpen(true); else setHighlight(h => Math.min(h + 1, matches.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    else if (event.key === 'Enter') { event.preventDefault(); if (open && matches[highlight]) choose(matches[highlight].iso3) }
    else if (event.key === 'Escape') { setOpen(false); setQuery('') }
  }
  return <div className="country-combobox" ref={rootRef}>
    <div className="combo-control">
      <Search aria-hidden="true" />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="country-combo-list"
        aria-autocomplete="list"
        aria-activedescendant={open && matches[highlight] ? `combo-option-${matches[highlight].iso3}` : undefined}
        value={open ? query : selected?.name ?? ''}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setHighlight(Math.max(0, matches.findIndex(c => c.iso3 === value))) }}
        onChange={event => { setQuery(event.target.value); setOpen(true); setHighlight(0) }}
        onKeyDown={onKeyDown}
      />
      <ChevronDown aria-hidden="true" />
    </div>
    {open && <ul className="combo-list" role="listbox" id="country-combo-list" ref={listRef}>
      {matches.map((country, index) => <li
        key={country.iso3}
        id={`combo-option-${country.iso3}`}
        role="option"
        aria-selected={country.iso3 === value}
        className={index === highlight ? 'highlighted' : ''}
        onMouseEnter={() => setHighlight(index)}
        onMouseDown={event => { event.preventDefault(); choose(country.iso3) }}
      >
        <span>{country.name}</span>
        {country.ihr_composite != null && <span className="combo-score" style={{ background: scoreColor(country.ihr_composite) }}>{country.ihr_composite}</span>}
      </li>)}
      {!matches.length && <li className="combo-empty" aria-disabled="true">{noMatch}</li>}
    </ul>}
  </div>
}
