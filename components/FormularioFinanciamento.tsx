'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SITUACION_LABELS, getDocumentosRequeridos, type SituacionLaboral } from '@/lib/documentos'

interface FormData {
  // Step 1 - Cliente
  nombre: string
  email: string
  telefono: string
  fecha_nacimiento: string
  nif: string
  situacion_laboral: SituacionLaboral | ''
  // Step 2 - Vehículo
  marca: string
  modelo: string
  nuevo_usado: 'nuevo' | 'usado' | ''
  fecha_matriculacion: string
  precio: string
  entrada: string
  plazo: string
  // Step 3 - Documentos
  documentos: Record<string, File | null>
}

const INITIAL: FormData = {
  nombre: '', email: '', telefono: '', fecha_nacimiento: '', nif: '', situacion_laboral: '',
  marca: '', modelo: '', nuevo_usado: '', fecha_matriculacion: '', precio: '', entrada: '', plazo: '',
  documentos: {},
}

const PASOS = ['Información personal', 'Datos del vehículo', 'Documentación']

export default function FormularioFinanciamento() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const importe = parseFloat(form.precio || '0') - parseFloat(form.entrada || '0')
  const documentosNecessarios = form.situacion_laboral
    ? getDocumentosRequeridos(form.situacion_laboral as SituacionLaboral, importe)
    : []

  function validarPaso0() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Obligatorio'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email inválido'
    if (!form.telefono.trim()) e.telefono = 'Obligatorio'
    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'Obligatorio'
    if (!form.nif.trim()) e.nif = 'Obligatorio'
    if (!form.situacion_laboral) e.situacion_laboral = 'Obligatorio'
    return e
  }

  function validarPaso1() {
    const e: Record<string, string> = {}
    if (!form.marca.trim()) e.marca = 'Obligatorio'
    if (!form.modelo.trim()) e.modelo = 'Obligatorio'
    if (!form.nuevo_usado) e.nuevo_usado = 'Obligatorio'
    if (form.nuevo_usado === 'usado' && !form.fecha_matriculacion) e.fecha_matriculacion = 'Obligatorio'
    if (!form.precio || parseFloat(form.precio) <= 0) e.precio = 'Introduce un precio válido'
    if (!form.plazo || parseInt(form.plazo) <= 0) e.plazo = 'Introduce un plazo válido'
    return e
  }

  function avancar() {
    let e: Record<string, string> = {}
    if (paso === 0) e = validarPaso0()
    if (paso === 1) e = validarPaso1()
    if (Object.keys(e).length) { setErrors(e); return }
    setPaso(p => p + 1)
  }

  function setDoc(id: string, file: File | null) {
    setForm(f => ({ ...f, documentos: { ...f.documentos, [id]: file } }))
  }

  async function submeter() {
    // Validate all required documents are uploaded
    const faltantes = documentosNecessarios.filter(d => !form.documentos[d.id])
    if (faltantes.length) {
      setErrors({ docs: `Falta documentación: ${faltantes.map(d => d.label).join(', ')}` })
      return
    }

    setLoading(true)
    try {
      const data = new FormData()
      data.append('nombre', form.nombre)
      data.append('email', form.email)
      data.append('telefono', form.telefono)
      data.append('fecha_nacimiento', form.fecha_nacimiento)
      data.append('nif', form.nif)
      data.append('situacion_laboral', form.situacion_laboral)
      data.append('marca', form.marca)
      data.append('modelo', form.modelo)
      data.append('nuevo_usado', form.nuevo_usado)
      data.append('fecha_matriculacion', form.fecha_matriculacion)
      data.append('precio', form.precio)
      data.append('entrada', form.entrada || '0')
      data.append('plazo', form.plazo)
      data.append('importe', importe.toString())

      for (const doc of documentosNecessarios) {
        const file = form.documentos[doc.id]
        if (file) data.append(`doc_${doc.id}`, file)
      }

      const res = await fetch('/api/submeter', { method: 'POST', body: data })
      if (!res.ok) throw new Error('Erro ao submeter')
      router.push('/obrigado')
    } catch {
      setErrors({ submit: 'Ocurrió un error. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {PASOS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= paso ? 'text-brand-900' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < paso ? 'bg-brand-900 border-brand-900 text-white' :
                i === paso ? 'border-brand-900 text-brand-900' :
                'border-gray-300 text-gray-400'
              }`}>
                {i < paso ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-px ${i < paso ? 'bg-brand-900' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {paso === 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Información personal</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input className={`input-field ${errors.nombre ? 'input-error' : ''}`} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan García López" />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>
            <div>
              <label className="label">NIF *</label>
              <input className={`input-field ${errors.nif ? 'input-error' : ''}`} value={form.nif} onChange={e => set('nif', e.target.value)} placeholder="12345678A" />
              {errors.nif && <p className="text-xs text-red-500 mt-1">{errors.nif}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className={`input-field ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input type="tel" className={`input-field ${errors.telefono ? 'input-error' : ''}`} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600 000 000" />
              {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de nacimiento *</label>
              <input type="date" className={`input-field ${errors.fecha_nacimiento ? 'input-error' : ''}`} value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
              {errors.fecha_nacimiento && <p className="text-xs text-red-500 mt-1">{errors.fecha_nacimiento}</p>}
            </div>
            <div>
              <label className="label">Situación laboral *</label>
              <select className={`input-field ${errors.situacion_laboral ? 'input-error' : ''}`} value={form.situacion_laboral} onChange={e => set('situacion_laboral', e.target.value)}>
                <option value="">Selecciona...</option>
                {(Object.entries(SITUACION_LABELS) as [SituacionLaboral, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {errors.situacion_laboral && <p className="text-xs text-red-500 mt-1">{errors.situacion_laboral}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={avancar} className="btn-primary px-6">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {paso === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Datos del vehículo</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Marca *</label>
              <input className={`input-field ${errors.marca ? 'input-error' : ''}`} value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="BMW" />
              {errors.marca && <p className="text-xs text-red-500 mt-1">{errors.marca}</p>}
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input className={`input-field ${errors.modelo ? 'input-error' : ''}`} value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Serie 3" />
              {errors.modelo && <p className="text-xs text-red-500 mt-1">{errors.modelo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nuevo o usado *</label>
              <select className={`input-field ${errors.nuevo_usado ? 'input-error' : ''}`} value={form.nuevo_usado} onChange={e => set('nuevo_usado', e.target.value)}>
                <option value="">Selecciona...</option>
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado</option>
              </select>
              {errors.nuevo_usado && <p className="text-xs text-red-500 mt-1">{errors.nuevo_usado}</p>}
            </div>
            {form.nuevo_usado === 'usado' && (
              <div>
                <label className="label">Fecha 1ª matriculación *</label>
                <input type="month" className={`input-field ${errors.fecha_matriculacion ? 'input-error' : ''}`} value={form.fecha_matriculacion} onChange={e => set('fecha_matriculacion', e.target.value)} />
                {errors.fecha_matriculacion && <p className="text-xs text-red-500 mt-1">{errors.fecha_matriculacion}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Precio del vehículo (€) *</label>
              <input type="number" min="0" className={`input-field ${errors.precio ? 'input-error' : ''}`} value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="25000" />
              {errors.precio && <p className="text-xs text-red-500 mt-1">{errors.precio}</p>}
            </div>
            <div>
              <label className="label">Entrada (€)</label>
              <input type="number" min="0" className="input-field" value={form.entrada} onChange={e => set('entrada', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Plazo (meses) *</label>
              <input type="number" min="1" max="120" className={`input-field ${errors.plazo ? 'input-error' : ''}`} value={form.plazo} onChange={e => set('plazo', e.target.value)} placeholder="60" />
              {errors.plazo && <p className="text-xs text-red-500 mt-1">{errors.plazo}</p>}
            </div>
          </div>

          {form.precio && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              Importe a financiar: <span className="font-semibold text-gray-900">
                {importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setPaso(0)} className="btn-secondary">← Atrás</button>
            <button onClick={avancar} className="btn-primary px-6">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {paso === 2 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Documentación requerida</h2>
            <p className="text-sm text-gray-500 mt-1">
              Basado en tu perfil, necesitamos los siguientes documentos:
            </p>
          </div>

          <div className="space-y-4">
            {documentosNecessarios.map(doc => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                    {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5">{doc.descripcion}</p>}
                  </div>
                  {form.documentos[doc.id] && (
                    <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ Subido</span>
                  )}
                </div>
                <div className="mt-3">
                  <label className="cursor-pointer">
                    <div className={`border-2 border-dashed rounded-lg px-4 py-3 text-center transition-colors ${
                      form.documentos[doc.id] ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}>
                      {form.documentos[doc.id] ? (
                        <p className="text-xs text-green-700 truncate">{form.documentos[doc.id]!.name}</p>
                      ) : (
                        <p className="text-xs text-gray-500">Haz clic para subir el archivo (PDF, JPG, PNG)</p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => setDoc(doc.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {errors.docs && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{errors.docs}</p>
          )}
          {errors.submit && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{errors.submit}</p>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setPaso(1)} disabled={loading} className="btn-secondary">← Atrás</button>
            <button onClick={submeter} disabled={loading} className="btn-primary px-6">
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
