import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

function personaFromForm(formData: FormData, prefix = '') {
  const k = (f: string) => prefix ? `${prefix}_${f}` : f
  const g = (f: string) => (formData.get(k(f)) as string) || null
  return {
    nombre:            g('nombre'),
    primer_apellido:   g('primer_apellido'),
    segundo_apellido:  g('segundo_apellido') || null,
    email:             g('email'),
    telefono:          g('telefono'),
    fecha_nacimiento:  g('fecha_nacimiento'),
    nacionalidad:      g('nacionalidad'),
    pais_nacimiento:   g('pais_nacimiento'),
    tipo_documento:    g('tipo_documento'),
    nif:               g('nif'),
    fecha_emision_doc: g('fecha_emision_doc') || null,
    fecha_caducidad_doc: g('fecha_caducidad_doc') || null,
    estado_civil:      g('estado_civil'),
    situacion_vivienda: g('situacion_vivienda'),
    vivienda_desde:    g('vivienda_desde') || null,
    personas_cargo:    parseInt(formData.get(k('personas_cargo')) as string || '0') || 0,
    situacion_laboral: g('situacion_laboral'),
    tipo_contrato:     g('tipo_contrato') || null,
    empresa:           g('empresa') || null,
    sector_actividad:  g('sector_actividad') || null,
    profesion:         g('profesion') || null,
    empleo_desde:      g('empleo_desde') || null,
    ingresos_netos:    parseFloat(formData.get(k('ingresos_netos')) as string || '0') || 0,
    otros_ingresos:    parseFloat(formData.get(k('otros_ingresos')) as string || '0') || 0,
    num_pagas:         parseInt(formData.get(k('num_pagas')) as string || '14') || 14,
    alquiler_hipoteca: parseFloat(formData.get(k('alquiler_hipoteca')) as string || '0') || 0,
    prestamos_creditos: parseFloat(formData.get(k('prestamos_creditos')) as string || '0') || 0,
    iban: g('iban') || null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const RESEND_KEY    = process.env.RESEND_API_KEY
    const NOTIFY_EMAILS = (process.env.NOTIFY_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const formData = await req.formData()
    const supabase = createAdminClient()

    const numTitulares = parseInt(formData.get('num_titulares') as string || '1')
    const conAvalista  = formData.get('con_avalista') === 'true'

    // Upload documents (prefix: t1_, t2_, av_)
    const docs: Record<string, Record<string, string[]>> = { t1: {}, t2: {}, av: {} }

    for (const [key, value] of formData.entries()) {
      if (!(value instanceof File)) continue
      const m = key.match(/^(t1|t2|av)_doc_(.+)_(\d+)$/)
      if (!m) continue
      const [, prefix, docId, indexStr] = m
      const ext  = value.name.split('.').pop() || 'bin'
      const path = `${Date.now()}_${prefix}_${docId}_${indexStr}.${ext}`
      const { error: uploadError } = await supabase.storage.from('Financiamentos-docs').upload(path, value, { contentType: value.type })
      if (uploadError) return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
      const { data: urlData } = supabase.storage.from('Financiamentos-docs').getPublicUrl(path)
      if (!docs[prefix][docId]) docs[prefix][docId] = []
      docs[prefix][docId][parseInt(indexStr)] = urlData.publicUrl
    }

    const t1 = personaFromForm(formData)
    const t2 = numTitulares >= 2 ? personaFromForm(formData, 't2') : null
    const av = conAvalista        ? personaFromForm(formData, 'av') : null

    const { data: solicitude, error: dbError } = await supabase
      .from('solicitudes')
      .insert({
        // Titular 1 flat columns
        ...t1,
        // Vehículo
        marca:               formData.get('marca') as string,
        modelo:              formData.get('modelo') as string,
        fecha_matriculacion: (formData.get('fecha_matriculacion') as string) || null,
        precio:              parseFloat(formData.get('precio') as string),
        entrada:             parseFloat(formData.get('entrada') as string) || 0,
        plazo:               parseInt(formData.get('plazo') as string),
        importe:             parseFloat(formData.get('importe') as string),
        // Estructura
        num_titulares: numTitulares,
        con_avalista:  conAvalista,
        titular2:      t2,
        avalista:      av,
        documentos:    docs,
        status:        'pendente',
      })
      .select('id')
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Send notification email
    if (RESEND_KEY && NOTIFY_EMAILS.length) {
      const resend = new Resend(RESEND_KEY)
      const extras: string[] = []
      if (t2) extras.push(`<p><strong>2º Titular:</strong> ${t2.nombre} ${t2.primer_apellido} — ${t2.nif}</p>`)
      if (av) extras.push(`<p><strong>Avalista:</strong> ${av.nombre} ${av.primer_apellido} — ${av.nif}</p>`)

      await resend.emails.send({
        from: 'Importrust <onboarding@resend.dev>',
        to: NOTIFY_EMAILS,
        subject: `Nueva solicitud de financiamiento — ${t1.nombre} ${t1.primer_apellido}`,
        html: `
          <h2>Nueva solicitud de financiamiento</h2>
          <p><strong>Titular 1:</strong> ${t1.nombre} ${t1.primer_apellido} (${t1.email})</p>
          ${extras.join('')}
          <p><strong>Vehículo:</strong> ${formData.get('marca')} ${formData.get('modelo')}</p>
          <p><strong>Importe:</strong> €${parseFloat(formData.get('importe') as string).toLocaleString('es-ES')}</p>
          <p><strong>Ingresos netos:</strong> €${t1.ingresos_netos?.toLocaleString('es-ES') ?? '—'}/mes (${t1.num_pagas} pagas)</p>
          <p><strong>ID:</strong> ${solicitude?.id}</p>
          <hr/>
          <p style="color:#666;font-size:12px">Importrust España — Sistema de financiamiento</p>
        `,
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
