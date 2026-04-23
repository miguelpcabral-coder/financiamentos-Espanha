'use client'

import { useState } from 'react'

const SITUACION_LABELS: Record<string, string> = {
  empleado_fijo: 'Empleado Fijo',
  temporal:      'Temporal / Discontinuo / Hogar',
  autonomo:      'Autónomo / Freelance',
  pensionista:   'Pensionista',
}

const DOC_LABELS: Record<string, string> = {
  nif:                  'DNI/NIE',
  nomina:               'Nómina',
  modelo100:            'Modelo 100',
  vida_laboral:         'Vida Laboral',
  modelo130:            'Modelo 130/131',
  justificante_pension: 'Justificante pensión',
}

function DocButton({ url, label }: { url: string; label: string }) {
  const isPdf = url.toLowerCase().includes('.pdf')
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-brand-900 hover:text-brand-900 text-gray-700 px-3 py-2 rounded-lg transition-colors shadow-sm">
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

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value}</dd>
    </div>
  )
}

function PersonaDetail({ data, title }: { data: Record<string, unknown>; title: string }) {
  const fmt = (v: unknown) => (v != null && v !== '' ? String(v) : null)
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
        <Field label="Nome completo" value={[fmt(data.nombre), fmt(data.primer_apellido), fmt(data.segundo_apellido)].filter(Boolean).join(' ')} />
        <Field label="Email" value={fmt(data.email)} />
        <Field label="Teléfono" value={fmt(data.telefono)} />
        <Field label="NIF/NIE" value={fmt(data.nif)} />
        <Field label="Tipo documento" value={fmt(data.tipo_documento)} />
        <Field label="F. emisión doc." value={fmt(data.fecha_emision_doc)} />
        <Field label="F. caducidad doc." value={fmt(data.fecha_caducidad_doc)} />
        <Field label="Fecha nacimiento" value={fmt(data.fecha_nacimiento)} />
        <Field label="Nacionalidad" value={fmt(data.nacionalidad)} />
        <Field label="País nacimiento" value={fmt(data.pais_nacimiento)} />
        <Field label="Estado civil" value={fmt(data.estado_civil)} />
        <Field label="Sit. vivienda" value={fmt(data.situacion_vivienda)} />
        <Field label="Vivienda desde" value={fmt(data.vivienda_desde)} />
        <Field label="Personas a cargo" value={fmt(data.personas_cargo)} />
        <Field label="Sit. laboral" value={SITUACION_LABELS[fmt(data.situacion_laboral) ?? ''] ?? fmt(data.situacion_laboral)} />
        <Field label="Tipo contrato" value={fmt(data.tipo_contrato)} />
        <Field label="Empresa" value={fmt(data.empresa)} />
        <Field label="Sector" value={fmt(data.sector_actividad)} />
        <Field label="Profesión" value={fmt(data.profesion)} />
        <Field label="Empleado desde" value={fmt(data.empleo_desde)} />
        <Field label="Ingresos netos/mes" value={data.ingresos_netos ? `${Number(data.ingresos_netos).toLocaleString('es-ES')}€` : null} />
        <Field label="Otros ingresos" value={data.otros_ingresos ? `${Number(data.otros_ingresos).toLocaleString('es-ES')}€` : null} />
        <Field label="Nº pagas" value={fmt(data.num_pagas)} />
        <Field label="Alquiler/hipoteca" value={data.alquiler_hipoteca ? `${Number(data.alquiler_hipoteca).toLocaleString('es-ES')}€` : null} />
        <Field label="Préstamos/créditos" value={data.prestamos_creditos ? `${Number(data.prestamos_creditos).toLocaleString('es-ES')}€` : null} />
        <Field label="IBAN" value={fmt(data.iban)} />
      </dl>
    </div>
  )
}

function safeDocMap(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) result[k] = v.filter((x): x is string => typeof x === 'string')
    else if (typeof v === 'string' && v) result[k] = [v]
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SolicitudCard({ s }: { s: Record<string, any> }) {
  const [open, setOpen] = useState(false)
  const [expandError, setExpandError] = useState(false)

  const importe = parseFloat(s.importe || 0)
  const rawDocs = s.documentos
  const isNewFormat = rawDocs && typeof rawDocs === 'object' && !Array.isArray(rawDocs) && ('t1' in rawDocs || 't2' in rawDocs || 'av' in rawDocs)
  const t1Docs = safeDocMap(isNewFormat ? rawDocs?.t1 : rawDocs)
  const t2Docs = safeDocMap(isNewFormat ? rawDocs?.t2 : null)
  const avDocs = safeDocMap(isNewFormat ? rawDocs?.av : null)
  const hasDocs = Object.values(t1Docs).flat().length + Object.values(t2Docs).flat().length + Object.values(avDocs).flat().length > 0

  const titular2 = s.titular2 && typeof s.titular2 === 'object' ? s.titular2 as Record<string, unknown> : null
  const avalista = s.avalista && typeof s.avalista === 'object' ? s.avalista as Record<string, unknown> : null

  return (
    <div className="card overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        type="button"
        onClick={() => { setExpandError(false); setOpen(o => !o) }}
        className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
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
              <span>{s.email}</span>
              <span>{s.telefono}</span>
              <span>DNI/NIE: <span className="font-medium text-gray-700">{s.nif}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(s.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && expandError && (
        <div className="px-5 pb-5 border-t border-gray-100 text-sm text-red-500">
          Erro ao carregar detalhes. Os dados deste registo podem estar incompletos.
        </div>
      )}
      {open && !expandError && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Titular 1 full detail */}
          <PersonaDetail title="Titular 1 — Datos completos" data={{
            nombre: s.nombre, primer_apellido: s.primer_apellido, segundo_apellido: s.segundo_apellido,
            email: s.email, telefono: s.telefono, nif: s.nif,
            tipo_documento: s.tipo_documento, fecha_emision_doc: s.fecha_emision_doc, fecha_caducidad_doc: s.fecha_caducidad_doc,
            fecha_nacimiento: s.fecha_nacimiento, nacionalidad: s.nacionalidad, pais_nacimiento: s.pais_nacimiento,
            estado_civil: s.estado_civil, situacion_vivienda: s.situacion_vivienda, vivienda_desde: s.vivienda_desde,
            personas_cargo: s.personas_cargo, situacion_laboral: s.situacion_laboral,
            tipo_contrato: s.tipo_contrato, empresa: s.empresa, sector_actividad: s.sector_actividad,
            profesion: s.profesion, empleo_desde: s.empleo_desde,
            ingresos_netos: s.ingresos_netos, otros_ingresos: s.otros_ingresos, num_pagas: s.num_pagas,
            alquiler_hipoteca: s.alquiler_hipoteca, prestamos_creditos: s.prestamos_creditos, iban: s.iban,
          }} />

          {/* Titular 2 */}
          {titular2 && <PersonaDetail title="2º Titular" data={titular2} />}

          {/* Avalista */}
          {avalista && <PersonaDetail title="Avalista" data={avalista} />}

          {/* Importe */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Financiamiento</p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Valor a financiar" value={importe ? `${importe.toLocaleString('es-ES')}€` : null} />
            </dl>
          </div>

          {/* Documents */}
          {hasDocs && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-4">
              <DocGroup title="Documentos — Titular 1" docs={t1Docs} />
              {Object.values(t2Docs).flat().length > 0 && <DocGroup title="Documentos — 2º Titular" docs={t2Docs} />}
              {Object.values(avDocs).flat().length > 0 && <DocGroup title="Documentos — Avalista" docs={avDocs} />}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            ID: {s.id} · {new Date(s.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  )
}
