'use client'

import { useState } from 'react'

const COUNTRIES = [
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'España' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Deutschland' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italia' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Nederland' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Schweiz' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Österreich' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Polska' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'România' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Maroc' },
]

interface Props {
  value: string
  onChange: (value: string) => void
  error?: boolean
}

export default function PhoneInput({ value, onChange, error }: Props) {
  const [dialCode, setDialCode] = useState('+34')

  // Extract number part (remove dial code if present)
  const numberPart = value.startsWith(dialCode)
    ? value.slice(dialCode.length).trim()
    : value

  function handleDialChange(newDial: string) {
    setDialCode(newDial)
    onChange(numberPart ? `${newDial} ${numberPart}` : '')
  }

  function handleNumberChange(num: string) {
    onChange(num ? `${dialCode} ${num}` : '')
  }

  const selected = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0]

  return (
    <div className={`flex rounded-lg border bg-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-900 focus-within:border-transparent ${error ? 'border-red-400' : 'border-gray-300'}`}>
      <select
        value={dialCode}
        onChange={e => handleDialChange(e.target.value)}
        className="bg-gray-50 border-r border-gray-200 text-sm px-2 py-2.5 focus:outline-none cursor-pointer text-gray-700"
        style={{ maxWidth: '110px' }}
      >
        {COUNTRIES.map(c => (
          <option key={c.code} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={numberPart}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder="600 000 000"
        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white text-gray-900 placeholder-gray-400 min-w-0"
      />
    </div>
  )
}
