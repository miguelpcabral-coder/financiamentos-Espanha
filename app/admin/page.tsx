import { createAdminClient } from '@/lib/supabase'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const SITUACION_LABELS: Record<string, string> = {
  empleado_fijo: 'Empleado Fijo',
  temporal:      'Temporal / Discontinuo / Hogar',
  autonomo:      'Autónomo / Freelance',
  pensionista:   'Pensionista',
}

const DOC_LABELS: Record<string, string> = {
  nif:                 'DNI/NIE',
  nomina:              'Nómina',
  modelo100:           'Modelo 100',
  vida_laboral:        'Vida Laboral',
  modelo130:           'Modelo 130/131',
  justificante_pension: 'Justificante pensión',
}

function DocButton({ url, label }: { url: string; label: string }) {
  const isPdf = url.toLowerCase().includes('.pdf')
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-brand-900 hover:text-brand-900 text-gray-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
    >
      {isPdf ? (
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9.5 17.5h-1v-5h1.75c.97 0 1.75.78 1.75 1.75S11.22 16 10.25 16H9.5v1.5zm0-3h.75c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H9.5v1.5zm4.25 3h-1.25v-5H13c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2zm-.25-4v3h.25c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-.25zm3.5 0v1h1.5v1H17v2h-1v-5h2.5v1H17z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {label}
    </a>
  )
}

// Render a group of documents with a section title
function DocGroup({ title, docs }: { title: string; docs: Record<string, string[]> }) {
  const entries = Object.entries(docs).filter(([, urls]) => urls?.length)
  if (!entries.length) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([docId, urls]) =>
          urls.map((url, i) => {
            const label = DOC_LABELS[docId] ?? docId
            const suffix = urls.length > 1 ? ` — parte ${i + 1}` : ''
            return <DocButton key={`${docId}-${i}`} url={url} label={`${label}${suffix}`} />
          })
        )}
      </div>
    </div>
  )
}

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
          <div className="space-y-4">
            {solicitudes.map(s => {
              const importe = parseFloat(s.importe || 0)
              // Support both old flat format and new {t1,t2,av} format
              const rawDocs = s.documentos as Record<string, unknown> | null
              const isNewFormat = rawDocs && ('t1' in rawDocs || 't2' in rawDocs || 'av' in rawDocs)
              const t1Docs = isNewFormat ? (rawDocs?.t1 as Record<string, string[]> ?? {}) : (rawDocs as Record<string, string[]> ?? {})
              const t2Docs = isNewFormat ? (rawDocs?.t2 as Record<string, string[]> ?? {}) : {}
              const avDocs = isNewFormat ? (rawDocs?.av as Record<string, string[]> ?? {}) : {}
              const hasDocs = Object.values(t1Docs).flat().length + Object.values(t2Docs).flat().length + Object.values(avDocs).flat().length > 0

              const titular2 = s.titular2 as { nombre: string; primer_apellido: string; segundo_apellido?: string; email: string; telefono: string; nif: string; situacion_laboral: string } | null
              const avalista = s.avalista as { nombre: string; primer_apellido: string; segundo_apellido?: string; email: string; telefono: string; nif: string; situacion_laboral: string } | null

              return (
                <div key={s.id} className="card p-5">
                  {/* Header — Titular 1 */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-900">
                          {s.nombre} {s.primer_apellido} {s.segundo_apellido}
                        </h2>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {SITUACION_LABELS[s.situacion_laboral] ?? s.situacion_laboral}
                        </span>
                        {s.num_titulares === 2 && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">2 titulares</span>
                        )}
                        {s.con_avalista && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Con avalista</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <a href={`mailto:${s.email}`} className="hover:text-brand-900 hover:underline">{s.email}</a>
                        <a href={`tel:${s.telefono}`} className="hover:text-brand-900 hover:underline">{s.telefono}</a>
                        <span>DNI/NIE: <span className="font-medium text-gray-700">{s.nif}</span></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">
                        {importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-xs text-gray-400">{s.plazo} meses</p>
                    </div>
                  </div>

                  {/* 2º Titular */}
                  {titular2 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">2º Titular</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{titular2.nombre} {titular2.primer_apellido} {titular2.segundo_apellido}</span>
                        <a href={`mailto:${titular2.email}`} className="hover:text-brand-900 hover:underline">{titular2.email}</a>
                        <a href={`tel:${titular2.telefono}`} className="hover:text-brand-900 hover:underline">{titular2.telefono}</a>
                        <span>DNI/NIE: <span className="font-medium text-gray-700">{titular2.nif}</span></span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full self-center">
                          {SITUACION_LABELS[titular2.situacion_laboral] ?? titular2.situacion_laboral}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Avalista */}
                  {avalista && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avalista</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{avalista.nombre} {avalista.primer_apellido} {avalista.segundo_apellido}</span>
                        <a href={`mailto:${avalista.email}`} className="hover:text-brand-900 hover:underline">{avalista.email}</a>
                        <a href={`tel:${avalista.telefono}`} className="hover:text-brand-900 hover:underline">{avalista.telefono}</a>
                        <span>DNI/NIE: <span className="font-medium text-gray-700">{avalista.nif}</span></span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full self-center">
                          {SITUACION_LABELS[avalista.situacion_laboral] ?? avalista.situacion_laboral}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Vehículo */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span><span className="text-gray-400">Vehículo:</span> <span className="font-medium">{s.marca} {s.modelo}</span></span>
                    <span><span className="text-gray-400">1ª matrícula:</span> {s.fecha_matriculacion}</span>
                    <span><span className="text-gray-400">Precio:</span> {parseFloat(s.precio).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    {s.entrada > 0 && <span><span className="text-gray-400">Entrada:</span> {parseFloat(s.entrada).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>}
                  </div>

                  {/* Documentos */}
                  {hasDocs && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">
                      <DocGroup title="Documentos — Titular 1" docs={t1Docs} />
                      {Object.values(t2Docs).flat().length > 0 && <DocGroup title="Documentos — 2º Titular" docs={t2Docs} />}
                      {Object.values(avDocs).flat().length > 0 && <DocGroup title="Documentos — Avalista" docs={avDocs} />}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(s.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
