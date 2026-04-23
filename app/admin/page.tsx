import { createAdminClient } from '@/lib/supabase'
import Image from 'next/image'
import SolicitudCard from './SolicitudCard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createAdminClient()
  const { data: solicitudes } = await supabase
    .from('solicitudes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-brand-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/"><Image src="/logo.png" alt="Importrust" width={140} height={40} style={{ width: 140, height: 'auto' }} priority /></a>
          <div className="h-5 w-px bg-white/30" />
          <div className="text-sm text-white/70">Admin — Solicitudes</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Solicitudes de financiamiento</h1>
          <span className="text-sm text-gray-500">{solicitudes?.length ?? 0} solicitudes</span>
        </div>

        {!solicitudes?.length ? (
          <div className="card p-12 text-center text-gray-400">Nenhuma solicitação ainda.</div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map(s => (
              <SolicitudCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
