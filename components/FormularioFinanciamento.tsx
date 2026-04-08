'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  iban: '',
  documentos: {},
})

interface VehiculoData {
  marca: string; modelo: string
  fecha_matriculacion_mes: string; fecha_matriculacion_ano: string
  precio: string; entrada: string; plazo: string
}

type PersonaKey = 'titular1' | 'titular2' | 'avalista'

type StepDef =
  | { kind: 'info'; who: PersonaKey }
  | { kind: 'vehiculo' }
  | { kind: 'docs'; who: PersonaKey }

function buildSteps(numTitulares: 1 | 2, conAvalista: boolean): StepDef[] {
  const s: StepDef[] = [
    { kind: 'info', who: 'titular1' },
    { kind: 'vehiculo' },
    { kind: 'docs', who: 'titular1' },
  ]
  if (numTitulares === 2) { s.push({ kind: 'info', who: 'titular2' }); s.push({ kind: 'docs', who: 'titular2' }) }
  if (conAvalista)        { s.push({ kind: 'info', who: 'avalista' }); s.push({ kind: 'docs', who: 'avalista' }) }
  return s
}

const STEP_LABELS: Record<string, string> = {
  'info-titular1': 'Titular 1', vehiculo: 'Vehículo', 'docs-titular1': 'Docs. T1',
  'info-titular2': 'Titular 2', 'docs-titular2': 'Docs. T2',
  'info-avalista': 'Avalista',  'docs-avalista': 'Docs. Av.',
}
const stepKey = (s: StepDef) => s.kind === 'vehiculo' ? 'vehiculo' : `${s.kind}-${s.who}`

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

export default function FormularioFinanciamento() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [numTitulares, setNumTitulares] = useState<1 | 2>(1)
  const [conAvalista, setConAvalista] = useState(false)

  const [titular1, setTitular1] = useState<PersonaData>(emptyPersona())
  const [titular2, setTitular2] = useState<PersonaData>(emptyPersona())
  const [avalistaData, setAvalistaData] = useState<PersonaData>(emptyPersona())
  const [vehiculo, setVehiculoData] = useState<VehiculoData>({
    marca: '', modelo: '', fecha_matriculacion_mes: '', fecha_matriculacion_ano: '',
    precio: '', entrada: '', plazo: '',
  })
  const [videoCheck, setVideoCheck] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const steps = buildSteps(numTitulares, conAvalista)
  const currentStep = steps[paso]
  const importe = parseFloat(vehiculo.precio || '0') - parseFloat(vehiculo.entrada || '0')

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

  function setVehiculoField(field: string, value: string) {
    setVehiculoData(v => ({ ...v, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
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
    }
    return e
  }

  function validarVehiculo() {
    const e: Record<string, string> = {}
    if (!vehiculo.marca.trim()) e.marca = 'Obligatorio'
    if (!vehiculo.modelo.trim()) e.modelo = 'Obligatorio'
    if (!vehiculo.fecha_matriculacion_mes || !vehiculo.fecha_matriculacion_ano) e.fecha_matriculacion = 'Obligatorio'
    if (!vehiculo.precio || parseFloat(vehiculo.precio) <= 0) e.precio = 'Introduce un precio válido'
    if (!vehiculo.plazo || parseInt(vehiculo.plazo) <= 0) e.plazo = 'Introduce un plazo válido'
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
    if (currentStep.kind === 'info')     e = validarPersona(currentStep.who)
    if (currentStep.kind === 'vehiculo') e = validarVehiculo()
    if (currentStep.kind === 'docs')     e = validarDocs(currentStep.who)
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
        data.append(k('iban'), p.iban)
      }

      appendPersona(titular1)
      if (numTitulares === 2) appendPersona(titular2, 't2')
      if (conAvalista)        appendPersona(avalistaData, 'av')

      data.append('marca', vehiculo.marca)
      data.append('modelo', vehiculo.modelo)
      data.append('fecha_matriculacion', `${vehiculo.fecha_matriculacion_ano}-${vehiculo.fecha_matriculacion_mes}`)
      data.append('precio',  vehiculo.precio)
      data.append('entrada', vehiculo.entrada || '0')
      data.append('plazo',   vehiculo.plazo)
      data.append('importe', importe.toString())

      const appendDocs = (p: PersonaData, prefix: string) => {
        const docs = getDocumentosRequeridos(p.situacion_laboral, p.tipo_contrato, importe)
        for (const doc of docs) {
          ;(p.documentos[doc.id] ?? []).forEach((file, i) => {
            if (file) data.append(`${prefix}_doc_${doc.id}_${i}`, file)
          })
        }
      }
      appendDocs(titular1, 't1')
      if (numTitulares === 2) appendDocs(titular2, 't2')
      if (conAvalista)        appendDocs(avalistaData, 'av')

      const res = await fetch('/api/submeter', { method: 'POST', body: data })
      if (!res.ok) throw new Error('Error')
      router.push('/obrigado')
    } catch {
      setErrors({ submit: 'Ocurrió un error. Inténtalo de nuevo.' })
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

  // ── Render: Vehículo step ──────────────────────────────────────────────────

  function renderVehiculoStep() {
    return (
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Datos del vehículo</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Marca" required error={errors.marca}>
            <input className={`input-field ${errors.marca ? 'input-error' : ''}`} value={vehiculo.marca} onChange={e => setVehiculoField('marca', e.target.value)} placeholder="BMW" />
          </Field>
          <Field label="Modelo" required error={errors.modelo}>
            <input className={`input-field ${errors.modelo ? 'input-error' : ''}`} value={vehiculo.modelo} onChange={e => setVehiculoField('modelo', e.target.value)} placeholder="Serie 3" />
          </Field>
        </div>

        <Field label="Fecha 1ª matriculación" required error={errors.fecha_matriculacion}>
          <div className="flex gap-2">
            <select className={`input-field ${errors.fecha_matriculacion ? 'input-error' : ''}`} value={vehiculo.fecha_matriculacion_mes} onChange={e => setVehiculoField('fecha_matriculacion_mes', e.target.value)}>
              <option value="">Mes</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>)}
            </select>
            <select className={`input-field ${errors.fecha_matriculacion ? 'input-error' : ''}`} value={vehiculo.fecha_matriculacion_ano} onChange={e => setVehiculoField('fecha_matriculacion_ano', e.target.value)}>
              <option value="">Año</option>
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Precio del vehículo (€)" required error={errors.precio}>
            <input type="number" min="0" className={`input-field ${errors.precio ? 'input-error' : ''}`} value={vehiculo.precio} onChange={e => setVehiculoField('precio', e.target.value)} placeholder="25000" />
          </Field>
          <Field label="Entrada (€)">
            <input type="number" min="0" className="input-field" value={vehiculo.entrada} onChange={e => setVehiculoField('entrada', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Plazo (meses)" required error={errors.plazo}>
            <input type="number" min="1" max="120" className={`input-field ${errors.plazo ? 'input-error' : ''}`} value={vehiculo.plazo} onChange={e => setVehiculoField('plazo', e.target.value)} placeholder="60" />
          </Field>
        </div>

        {vehiculo.precio && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
            Importe a financiar:{' '}
            <span className="font-semibold text-gray-900">
              {importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={retroceder} className="btn-secondary">← Atrás</button>
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

      {currentStep.kind === 'info'     && renderInfoStep(currentStep.who)}
      {currentStep.kind === 'vehiculo' && renderVehiculoStep()}
      {currentStep.kind === 'docs'     && renderDocsStep(currentStep.who)}
    </div>
  )
}
