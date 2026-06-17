'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import {
  SITUACION_LABORAL_OPTIONS, TIPO_CONTRATO_OPTIONS, TIPO_DOCUMENTO_OPTIONS,
  ESTADO_CIVIL_OPTIONS, SITUACION_VIVIENDA_OPTIONS, SECTOR_ACTIVIDAD_OPTIONS,
  PROFESION_OPTIONS, NUM_PAGAS_OPTIONS, PAISES_OPTIONS,
  getDocumentosRequeridos, needsProfessionalFields,
} from '@/lib/documentos'
import PhoneInput from './PhoneInput'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PersonaData {
  // Contacto
  nombre: string
  primer_apellido: string
  segundo_apellido: string
  email: string
  telefono: string
  // Identidad
  fecha_nacimiento: string
  nacionalidad: string
  pais_nacimiento: string
  tipo_documento: string
  nif: string
  fecha_emision_doc: string
  fecha_caducidad_doc: string
  // Situación personal
  estado_civil: string
  situacion_vivienda: string
  vivienda_desde: string
  personas_cargo: string
  // Situación profesional
  situacion_laboral: string
  tipo_contrato: string
  empresa: string
  sector_actividad: string
  profesion: string
  empleo_desde: string
  // Situación financiera
  ingresos_netos: string
  otros_ingresos: string
  num_pagas: string
  alquiler_hipoteca: string
  prestamos_creditos: string
  // Morada
  tipo_via: string
  nombre_via: string
  numero_via: string
  codigo_postal: string
  complemento: string
  // IBAN
  iban: string
  // Docs
  documentos: Record<string, (File | null)[]>
}

const emptyPersona = (): PersonaData => ({
  nombre: '', primer_apellido: '', segundo_apellido: '',
  email: '', telefono: '',
  fecha_nacimiento: '', nacionalidad: 'España', pais_nacimiento: 'España',
  tipo_documento: '', nif: '', fecha_emision_doc: '', fecha_caducidad_doc: '',
  estado_civil: '', situacion_vivienda: '', vivienda_desde: '', personas_cargo: '0',
  situacion_laboral: '', tipo_contrato: '', empresa: '', sector_actividad: '', profesion: '', empleo_desde: '',
  ingresos_netos: '', otros_ingresos: '0', num_pagas: '14', alquiler_hipoteca: '0', prestamos_creditos: '0',
  tipo_via: '', nombre_via: '', numero_via: '', codigo_postal: '', complemento: '',
  iban: '',
  documentos: {},
})

type PersonaKey = 'titular1' | 'titular2' | 'avalista'

type StepDef =
  | { kind: 'info'; who: PersonaKey }
  | { kind: 'docs'; who: PersonaKey }

function buildSteps(numTitulares: 1 | 2, conAvalista: boolean): StepDef[] {
  const s: StepDef[] = [
    { kind: 'info', who: 'titular1' },
    { kind: 'docs', who: 'titular1' },
  ]
  if (numTitulares === 2) { s.push({ kind: 'info', who: 'titular2' }); s.push({ kind: 'docs', who: 'titular2' }) }
  if (conAvalista)        { s.push({ kind: 'info', who: 'avalista' }); s.push({ kind: 'docs', who: 'avalista' }) }
  return s
}

const STEP_LABELS: Record<string, string> = {
  'info-titular1': 'Titular 1', 'docs-titular1': 'Docs. T1',
  'info-titular2': 'Titular 2', 'docs-titular2': 'Docs. T2',
  'info-avalista': 'Avalista',  'docs-avalista': 'Docs. Av.',
}
const stepKey = (s: StepDef) => `${s.kind}-${s.who}`

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">{children}</p>
}

// ── Main component ────────────────────────────────────────────────────────────

async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, Math.sqrt((maxSizeMB * 1024 * 1024) / file.size))
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file)
      }, 'image/jpeg', 0.8)
    }
    img.src = url
  })
}

export default function FormularioFinanciamento() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [numTitulares, setNumTitulares] = useState<1 | 2>(1)
  const [conAvalista, setConAvalista] = useState(false)

  const [titular1, setTitular1] = useState<PersonaData>(emptyPersona())
  const [titular2, setTitular2] = useState<PersonaData>(emptyPersona())
  const [avalistaData, setAvalistaData] = useState<PersonaData>(emptyPersona())
  const [videoCheck, setVideoCheck] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const [valorFinanciar, setValorFinanciar] = useState('')

  const steps = buildSteps(numTitulares, conAvalista)
  const currentStep = steps[paso]
  const importe = parseFloat(valorFinanciar || '0') || 0

  // ── Persona helpers ────────────────────────────────────────────────────────

  function getPersona(who: PersonaKey) { return who === 'titular1' ? titular1 : who === 'titular2' ? titular2 : avalistaData }
  function getSetter(who: PersonaKey) { return who === 'titular1' ? setTitular1 : who === 'titular2' ? setTitular2 : setAvalistaData }

  function setPersonaField(who: PersonaKey, field: string, value: string) {
    getSetter(who)(p => ({ ...p, [field]: value }))
    setErrors(e => ({ ...e, [`${who}_${field}`]: '' }))
  }

  function setDoc(who: PersonaKey, id: string, index: number, file: File | null) {
    getSetter(who)(p => {
      const cur = [...(p.documentos[id] ?? [null])]; cur[index] = file
      return { ...p, documentos: { ...p.documentos, [id]: cur } }
    })
  }
  function addDocSlot(who: PersonaKey, id: string) {
    getSetter(who)(p => ({ ...p, documentos: { ...p.documentos, [id]: [...(p.documentos[id] ?? [null]), null] } }))
  }
  function removeDocSlot(who: PersonaKey, id: string, index: number) {
    getSetter(who)(p => {
      const cur = [...(p.documentos[id] ?? [null])]; cur.splice(index, 1)
      return { ...p, documentos: { ...p.documentos, [id]: cur.length ? cur : [null] } }
    })
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validarPersona(who: PersonaKey) {
    const p = getPersona(who)
    const e: Record<string, string> = {}
    const req = (f: string, v: string) => { if (!v.trim()) e[`${who}_${f}`] = 'Obligatorio' }
    req('nombre', p.nombre); req('primer_apellido', p.primer_apellido)
    if (!p.email.trim() || !p.email.includes('@')) e[`${who}_email`] = 'Email inválido'
    req('telefono', p.telefono)
    if (!p.fecha_nacimiento) e[`${who}_fecha_nacimiento`] = 'Obligatorio'
    req('tipo_documento', p.tipo_documento); req('nif', p.nif)
    if (!p.fecha_caducidad_doc) e[`${who}_fecha_caducidad_doc`] = 'Obligatorio'
    req('estado_civil', p.estado_civil); req('situacion_vivienda', p.situacion_vivienda)
    if (!p.vivienda_desde) e[`${who}_vivienda_desde`] = 'Obligatorio'
    req('tipo_via', p.tipo_via); req('nombre_via', p.nombre_via); req('numero_via', p.numero_via); req('codigo_postal', p.codigo_postal)
    req('situacion_laboral', p.situacion_laboral)
    if (needsProfessionalFields(p.situacion_laboral)) {
      req('tipo_contrato', p.tipo_contrato)
      req('sector_actividad', p.sector_actividad)
      req('profesion', p.profesion)
      if (!p.empleo_desde) e[`${who}_empleo_desde`] = 'Obligatorio'
    }
    if (!p.ingresos_netos) e[`${who}_ingresos_netos`] = 'Obligatorio'
    if (who === 'titular1') {
      if (!p.iban.trim()) e[`${who}_iban`] = 'Obligatorio'
      if (!videoCheck) e['video_check'] = 'Debes aceptar para continuar'
      if (!valorFinanciar || parseFloat(valorFinanciar) <= 0) e['importe'] = 'Introduce un importe válido'
    }
    return e
  }

  function validarDocs(who: PersonaKey): Record<string, string> {
    const p = getPersona(who)
    const docs = getDocumentosRequeridos(p.situacion_laboral, p.tipo_contrato, importe)
    const faltantes = docs.filter(d => !p.documentos[d.id]?.some(f => f !== null))
    if (faltantes.length) return { docs: `Falta documentación: ${faltantes.map(d => d.label).join(', ')}` }
    return {}
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function avancar() {
    let e: Record<string, string> = {}
    if (currentStep.kind === 'info') e = validarPersona(currentStep.who)
    if (currentStep.kind === 'docs') e = validarDocs(currentStep.who)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    if (paso < steps.length - 1) setPaso(p => p + 1)
    else submeter()
  }

  function retroceder() { setErrors({}); setPaso(p => Math.max(0, p - 1)) }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function submeter() {
    setLoading(true)
    try {
      const data = new FormData()
      data.append('num_titulares', String(numTitulares))
      data.append('con_avalista', String(conAvalista))

      const appendPersona = (p: PersonaData, prefix = '') => {
        const k = (f: string) => prefix ? `${prefix}_${f}` : f
        data.append(k('nombre'), p.nombre)
        data.append(k('primer_apellido'), p.primer_apellido)
        data.append(k('segundo_apellido'), p.segundo_apellido)
        data.append(k('email'), p.email)
        data.append(k('telefono'), p.telefono)
        data.append(k('fecha_nacimiento'), p.fecha_nacimiento)
        data.append(k('nacionalidad'), p.nacionalidad)
        data.append(k('pais_nacimiento'), p.pais_nacimiento)
        data.append(k('tipo_documento'), p.tipo_documento)
        data.append(k('nif'), p.nif)
        data.append(k('fecha_emision_doc'), p.fecha_emision_doc)
        data.append(k('fecha_caducidad_doc'), p.fecha_caducidad_doc)
        data.append(k('estado_civil'), p.estado_civil)
        data.append(k('situacion_vivienda'), p.situacion_vivienda)
        data.append(k('vivienda_desde'), p.vivienda_desde)
        data.append(k('personas_cargo'), p.personas_cargo)
        data.append(k('situacion_laboral'), p.situacion_laboral)
        data.append(k('tipo_contrato'), p.tipo_contrato)
        data.append(k('empresa'), p.empresa)
        data.append(k('sector_actividad'), p.sector_actividad)
        data.append(k('profesion'), p.profesion)
        data.append(k('empleo_desde'), p.empleo_desde)
        data.append(k('ingresos_netos'), p.ingresos_netos)
        data.append(k('otros_ingresos'), p.otros_ingresos)
        data.append(k('num_pagas'), p.num_pagas)
        data.append(k('alquiler_hipoteca'), p.alquiler_hipoteca)
        data.append(k('prestamos_creditos'), p.prestamos_creditos)
        data.append(k('tipo_via'), p.tipo_via)
        data.append(k('nombre_via'), p.nombre_via)
        data.append(k('numero_via'), p.numero_via)
        data.append(k('codigo_postal'), p.codigo_postal)
        data.append(k('complemento'), p.complemento)
        data.append(k('iban'), p.iban)
      }

      appendPersona(titular1)
      if (numTitulares === 2) appendPersona(titular2, 't2')
      if (conAvalista)        appendPersona(avalistaData, 'av')

      data.append('importe', importe.toString())

      const uploadDocs = async (p: PersonaData, prefix: string) => {
        const docs = getDocumentosRequeridos(p.situacion_laboral, p.tipo_contrato, importe)
        for (const doc of docs) {
          const files = p.documentos[doc.id] ?? []
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file) continue
            const fileToUpload = file.type.startsWith('image/') ? await compressImage(file) : file
            const ext = file.name.split('.').pop() || 'bin'
            const path = `${Date.now()}_${prefix}_${doc.id}_${i}.${ext}`
            const { error: uploadError } = await supabaseBrowser.storage
              .from('Financiamentos-docs')
              .upload(path, fileToUpload, { contentType: fileToUpload.type })
            if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)
            const { data: urlData } = supabaseBrowser.storage.from('Financiamentos-docs').getPublicUrl(path)
            data.append(`${prefix}_doc_${doc.id}_${i}_url`, urlData.publicUrl)
          }
        }
      }
      await uploadDocs(titular1, 't1')
      if (numTitulares === 2) await uploadDocs(titular2, 't2')
      if (conAvalista)        await uploadDocs(avalistaData, 'av')

      const res = await fetch('/api/submeter', { method: 'POST', body: data })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error')
      }
      router.push('/obrigado')
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Ocurrió un error. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Render: Info step ──────────────────────────────────────────────────────

  function renderInfoStep(who: PersonaKey) {
    const p = getPersona(who)
    const err = (f: string) => errors[`${who}_${f}`]
    const ch  = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setPersonaField(who, f, e.target.value)
    const showProfessional = needsProfessionalFields(p.situacion_laboral)
    const isTitular1 = who === 'titular1'

    const titles: Record<PersonaKey, string> = {
      titular1: 'Información personal — Titular 1',
      titular2: 'Información personal — 2º Titular',
      avalista: 'Información personal — Avalista',
    }

    return (
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">{titles[who]}</h2>

        {/* ── Contacto ── */}
        <SectionTitle>Datos de contacto</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nombre" required error={err('nombre')}>
            <input className={`input-field ${err('nombre') ? 'input-error' : ''}`} value={p.nombre} onChange={ch('nombre')} placeholder="Juan" />
          </Field>
          <Field label="Primer apellido" required error={err('primer_apellido')}>
            <input className={`input-field ${err('primer_apellido') ? 'input-error' : ''}`} value={p.primer_apellido} onChange={ch('primer_apellido')} placeholder="García" />
          </Field>
          <Field label="Segundo apellido">
            <input className="input-field" value={p.segundo_apellido} onChange={ch('segundo_apellido')} placeholder="López" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" required error={err('email')}>
            <input type="email" className={`input-field ${err('email') ? 'input-error' : ''}`} value={p.email} onChange={ch('email')} placeholder="juan@email.com" />
          </Field>
          <Field label="Teléfono" required error={err('telefono')}>
            <PhoneInput value={p.telefono} onChange={v => setPersonaField(who, 'telefono', v)} error={!!err('telefono')} />
          </Field>
        </div>

        {/* ── Identidad ── */}
        <SectionTitle>Identidad</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha de nacimiento" required error={err('fecha_nacimiento')}>
            <input type="date" className={`input-field ${err('fecha_nacimiento') ? 'input-error' : ''}`} value={p.fecha_nacimiento} onChange={ch('fecha_nacimiento')} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nacionalidad">
              <select className="input-field" value={p.nacionalidad} onChange={ch('nacionalidad')}>
                {PAISES_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="País de nacimiento">
              <select className="input-field" value={p.pais_nacimiento} onChange={ch('pais_nacimiento')}>
                {PAISES_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Tipo de documento" required error={err('tipo_documento')}>
            <select className={`input-field ${err('tipo_documento') ? 'input-error' : ''}`} value={p.tipo_documento} onChange={ch('tipo_documento')}>
              <option value="">Selecciona...</option>
              {TIPO_DOCUMENTO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="DNI/NIE" required error={err('nif')}>
            <input className={`input-field ${err('nif') ? 'input-error' : ''}`} value={p.nif} onChange={ch('nif')} placeholder="12345678A" />
          </Field>
          <div />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha de emisión">
            <input type="date" className="input-field" value={p.fecha_emision_doc} onChange={ch('fecha_emision_doc')} />
          </Field>
          <Field label="Fecha de caducidad" required error={err('fecha_caducidad_doc')}>
            <input type="date" className={`input-field ${err('fecha_caducidad_doc') ? 'input-error' : ''}`} value={p.fecha_caducidad_doc} onChange={ch('fecha_caducidad_doc')} />
          </Field>
        </div>

        {/* ── Situación personal ── */}
        <SectionTitle>Situación personal</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Estado civil" required error={err('estado_civil')}>
            <select className={`input-field ${err('estado_civil') ? 'input-error' : ''}`} value={p.estado_civil} onChange={ch('estado_civil')}>
              <option value="">Selecciona...</option>
              {ESTADO_CIVIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Personas a cargo">
            <input type="number" min="0" max="20" className="input-field" value={p.personas_cargo} onChange={ch('personas_cargo')} placeholder="0" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Situación de vivienda" required error={err('situacion_vivienda')}>
            <select className={`input-field ${err('situacion_vivienda') ? 'input-error' : ''}`} value={p.situacion_vivienda} onChange={ch('situacion_vivienda')}>
              <option value="">Selecciona...</option>
              {SITUACION_VIVIENDA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Desde cuando" required error={err('vivienda_desde')}>
            <input type="date" className={`input-field ${err('vivienda_desde') ? 'input-error' : ''}`} value={p.vivienda_desde} onChange={ch('vivienda_desde')} />
          </Field>
        </div>

        {/* ── Dirección ── */}
        <SectionTitle>Dirección en España</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Tipo de vía" required error={err('tipo_via')}>
            <select className={`input-field ${err('tipo_via') ? 'input-error' : ''}`} value={p.tipo_via} onChange={ch('tipo_via')}>
              <option value="">Selecciona...</option>
              {['Calle','Avenida','Paseo','Plaza','Camino','Carretera','Ronda','Travesía','Vía','Urbanización','Callejón','Bulevar','Glorieta','Parque','Polígono'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Nombre de la vía" required error={err('nombre_via')} className="sm:col-span-2">
            <input className={`input-field ${err('nombre_via') ? 'input-error' : ''}`} value={p.nombre_via} onChange={ch('nombre_via')} placeholder="Gran Vía" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Número" required error={err('numero_via')}>
            <input className={`input-field ${err('numero_via') ? 'input-error' : ''}`} value={p.numero_via} onChange={ch('numero_via')} placeholder="42" />
          </Field>
          <Field label="Código postal" required error={err('codigo_postal')}>
            <input className={`input-field ${err('codigo_postal') ? 'input-error' : ''}`} value={p.codigo_postal} onChange={ch('codigo_postal')} placeholder="28001" maxLength={5} />
          </Field>
          <Field label="Complemento">
            <input className="input-field" value={p.complemento} onChange={ch('complemento')} placeholder="Piso 3, Puerta B" />
          </Field>
        </div>

        {/* ── Situación profesional ── */}
        <SectionTitle>Situación profesional</SectionTitle>

        <Field label="Situación laboral" required error={err('situacion_laboral')}>
          <select className={`input-field ${err('situacion_laboral') ? 'input-error' : ''}`} value={p.situacion_laboral} onChange={ch('situacion_laboral')}>
            <option value="">Selecciona...</option>
            {SITUACION_LABORAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        {showProfessional && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tipo de contrato" required error={err('tipo_contrato')}>
                <select className={`input-field ${err('tipo_contrato') ? 'input-error' : ''}`} value={p.tipo_contrato} onChange={ch('tipo_contrato')}>
                  <option value="">Selecciona...</option>
                  {TIPO_CONTRATO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Empresa">
                <input className="input-field" value={p.empresa} onChange={ch('empresa')} placeholder="Nombre de la empresa" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Sector de actividad" required error={err('sector_actividad')}>
                <select className={`input-field ${err('sector_actividad') ? 'input-error' : ''}`} value={p.sector_actividad} onChange={ch('sector_actividad')}>
                  <option value="">Selecciona...</option>
                  {SECTOR_ACTIVIDAD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Profesión" required error={err('profesion')}>
                <select className={`input-field ${err('profesion') ? 'input-error' : ''}`} value={p.profesion} onChange={ch('profesion')}>
                  <option value="">Selecciona...</option>
                  {PROFESION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Empleado desde" required error={err('empleo_desde')}>
              <input type="date" className={`input-field ${err('empleo_desde') ? 'input-error' : ''}`} value={p.empleo_desde} onChange={ch('empleo_desde')} />
            </Field>
          </>
        )}

        {/* ── Situación financiera ── */}
        <SectionTitle>Situación financiera</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Field label="Ingresos mensuales netos (€)" required error={err('ingresos_netos')}>
            <input type="number" min="0" className={`input-field ${err('ingresos_netos') ? 'input-error' : ''}`} value={p.ingresos_netos} onChange={ch('ingresos_netos')} placeholder="0" />
          </Field>
          <Field label="Otros ingresos netos (€)" required>
            <input type="number" min="0" className="input-field" value={p.otros_ingresos} onChange={ch('otros_ingresos')} placeholder="0" />
            {parseFloat(p.otros_ingresos) > 0 && (
              <p className="mt-1 text-xs text-amber-600 flex items-start gap-1">
                <span>⚠️</span>
                <span>Estos ingresos deben poder acreditarse ante la financiera mediante documentación (extractos bancarios, declaración de la renta, etc.).</span>
              </p>
            )}
          </Field>
          <Field label="Número de pagas" required>
            <select className="input-field" value={p.num_pagas} onChange={ch('num_pagas')}>
              {NUM_PAGAS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Alquiler o hipoteca (€/mes)" required>
            <input type="number" min="0" className="input-field" value={p.alquiler_hipoteca} onChange={ch('alquiler_hipoteca')} placeholder="0" />
          </Field>
          <Field label="Préstamos o créditos (€/mes)" required>
            <input type="number" min="0" className="input-field" value={p.prestamos_creditos} onChange={ch('prestamos_creditos')} placeholder="0" />
          </Field>
        </div>

        {/* ── IBAN + aviso vídeo (solo titular 1) ── */}
        {isTitular1 && (
          <>
            <SectionTitle>Datos bancarios</SectionTitle>

            <Field label="IBAN" required error={err('iban')}>
              <input
                className={`input-field ${err('iban') ? 'input-error' : ''}`}
                value={p.iban}
                onChange={ch('iban')}
                placeholder="ES00 0000 0000 0000 0000 0000"
              />
            </Field>

            <div className={`rounded-lg border p-4 ${errors.video_check ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoCheck}
                  onChange={e => { setVideoCheck(e.target.checked); setErrors(er => ({ ...er, video_check: '' })) }}
                  className="mt-0.5 shrink-0 accent-brand-900"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Venta a distancia - video identificación y comprobación identidad:</span>{' '}
                  Sofinco tratará los datos (incluida tu imagen, sonido, dato biométrico) para la prevención del fraude (interés legítimo), la prevención del blanqueo de capitales y financiación al terrorismo (obligación legal)
                </span>
              </label>
              {errors.video_check && <p className="text-xs text-red-500 mt-2">{errors.video_check}</p>}
            </div>
          </>
        )}

        {/* ── Valor a financiar (solo titular 1) ── */}
        {isTitular1 && (
          <>
            <SectionTitle>Financiamiento</SectionTitle>
            <Field label="Valor a financiar (€)" required error={errors.importe}>
              <input
                type="number"
                min="0"
                className={`input-field ${errors.importe ? 'input-error' : ''}`}
                value={valorFinanciar}
                onChange={e => { setValorFinanciar(e.target.value); setErrors(er => ({ ...er, importe: '' })) }}
                placeholder="25000"
              />
              {importe >= 30000 && (
                <p className="text-xs text-amber-600 mt-1">⚠ Importe ≥ 30.000€ — se requerirá Modelo 100</p>
              )}
            </Field>
          </>
        )}

        {/* ── Estructura (solo titular 1) ── */}
        {isTitular1 && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Estructura de la solicitud</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Número de titulares</label>
                <div className="flex gap-2">
                  {([1, 2] as const).map(n => (
                    <button key={n} type="button" onClick={() => setNumTitulares(n)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${numTitulares === n ? 'bg-brand-900 border-brand-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                      {n} titular{n === 2 ? 'es' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Incluye avalista?</label>
                <div className="flex gap-2">
                  {([false, true] as const).map(v => (
                    <button key={String(v)} type="button" onClick={() => setConAvalista(v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${conAvalista === v ? 'bg-brand-900 border-brand-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                      {v ? 'Sí' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
          {paso > 0 ? <button onClick={retroceder} className="btn-secondary">← Atrás</button> : <div />}
          <button onClick={avancar} className="btn-primary px-6">Siguiente →</button>
        </div>
      </div>
    )
  }

  // ── Render: Docs step ──────────────────────────────────────────────────────

  function renderDocsStep(who: PersonaKey) {
    const p = getPersona(who)
    const docs = getDocumentosRequeridos(p.situacion_laboral, p.tipo_contrato, importe)
    const isLastStep = paso === steps.length - 1
    const titles: Record<PersonaKey, string> = { titular1: 'Titular 1', titular2: '2º Titular', avalista: 'Avalista' }

    return (
      <div className="card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Documentación — {titles[who]}</h2>
          <p className="text-sm text-gray-500 mt-1">Documentos requeridos según el perfil:</p>
        </div>

        <div className="space-y-4">
          {docs.map(doc => {
            const slots = p.documentos[doc.id]?.length ? p.documentos[doc.id] : [null]
            const uploadedCount = slots.filter(f => f !== null).length
            return (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                    {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5">{doc.descripcion}</p>}
                  </div>
                  {uploadedCount > 0 && (
                    <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ {uploadedCount} archivo{uploadedCount > 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="space-y-2">
                  {slots.map((file, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <label className="cursor-pointer flex-1">
                        <div className={`border-2 border-dashed rounded-lg px-4 py-3 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                          {file
                            ? <p className="text-xs text-green-700 truncate">{file.name}</p>
                            : <p className="text-xs text-gray-500">Haz clic para subir (PDF, JPG, PNG)</p>
                          }
                        </div>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setDoc(who, doc.id, i, e.target.files?.[0] ?? null)} />
                      </label>
                      {slots.length > 1 && (
                        <button type="button" onClick={() => removeDocSlot(who, doc.id, i)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Eliminar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addDocSlot(who, doc.id)} className="mt-2 text-xs text-brand-600 hover:text-brand-900 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Añadir otro archivo
                </button>
              </div>
            )
          })}
        </div>

        {errors.docs   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{errors.docs}</p>}
        {errors.submit && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{errors.submit}</p>}

        <div className="flex justify-between pt-2">
          <button onClick={retroceder} disabled={loading} className="btn-secondary">← Atrás</button>
          {isLastStep
            ? <button onClick={avancar} disabled={loading} className="btn-primary px-6">{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
            : <button onClick={avancar} className="btn-primary px-6">Siguiente →</button>
          }
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center mb-8">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 shrink-0 ${i <= paso ? 'text-brand-900' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                i < paso ? 'bg-brand-900 border-brand-900 text-white' :
                i === paso ? 'border-brand-900 text-brand-900' : 'border-gray-300 text-gray-400'
              }`}>
                {i < paso ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block whitespace-nowrap">{STEP_LABELS[stepKey(step)]}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 min-w-1 ${i < paso ? 'bg-brand-900' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {currentStep.kind === 'info' && renderInfoStep(currentStep.who)}
      {currentStep.kind === 'docs' && renderDocsStep(currentStep.who)}
    </div>
  )
}
