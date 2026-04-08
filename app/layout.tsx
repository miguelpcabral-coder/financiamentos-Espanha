import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Financiamento Importrust España',
  description: 'Solicita o teu financiamento de forma rápida e simples.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
