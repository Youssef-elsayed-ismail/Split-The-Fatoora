/** Soft backgrounds paired with dark text, so initials stay readable. */
const PALETTE = [
  { background: '#e6f0fb', text: '#1d4e79' },
  { background: '#e9f5ec', text: '#2b6140' },
  { background: '#fdeceb', text: '#8f3b34' },
  { background: '#f3ecfb', text: '#553c7b' },
  { background: '#fdf3e3', text: '#7d5a1a' },
  { background: '#e6f4f4', text: '#1f5f5b' },
] as const

export interface PersonColor {
  background: string
  text: string
}

/** Same person id always gets the same colour, so people stay recognisable across screens. */
export function personColor(personId: string): PersonColor {
  let hash = 0
  for (let index = 0; index < personId.length; index += 1) {
    hash = (hash * 31 + personId.charCodeAt(index)) % 100000
  }
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0]
}

export function personInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]?.[0] ?? ''
  const second = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + second).toUpperCase()
}
