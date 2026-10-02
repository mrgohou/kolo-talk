import type { ReactNode } from 'react'
import { canSpeak, speak } from '../lib/speech'

export function SpeakButton({ text, small, label }: { text: string; small?: boolean; label?: string }) {
  if (!canSpeak()) return null
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        speak(text)
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-lib-blue/10 text-lib-blue active:bg-lib-blue/20 ${small ? 'h-7 w-7 text-sm' : 'h-9 w-9'}`}
      aria-label={label ?? 'Écouter'}
      title={label ?? 'Écouter'}
    >
      🔊
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>{children}</div>
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <h1 className="text-xl font-bold text-slate-900">{children}</h1>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'red' | 'blue' | 'amber' | 'green' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-green-100 text-green-800',
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}
