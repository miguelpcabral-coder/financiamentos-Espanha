import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const NOTIFY_EMAILS = (process.env.NOTIFY_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const formData = await req.formData()
    const supabase = createAdminClient()

    // Upload documents to Supabase Storage
    const docUrls: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('doc_') && value instanceof File) {
        const docId = key.replace('doc_', '')
        const ext = value.name.split('.').pop()
        const path = `${Date.now()}_${docId}.${ext}`
        const { error } = await supabase.storage
          .from('financiamentos-docs')
          .upload(path, value, { contentType: value.type })
        if (!error) {
          const { data: urlData } = supabase.storage.from('financiamentos-docs').getPublicUrl(path)
          docUrls[docId] = urlData.publicUrl
        }
      }
    }

    // Insert into DB
    const { data: solicitude, error: dbError } = await supabase
      .from('solicitudes')
      .insert({
        nombre:            formData.get('nombre') as string,
        email:             formData.get('email') as string,
        telefono:          formData.get('telefono') as string,
        fecha_nacimiento:  formData.get('fecha_nacimiento') as string,
        nif:               formData.get('nif') as string,
        situacion_laboral: formData.get('situacion_laboral') as string,
        marca:             formData.get('marca') as string,
        modelo:            formData.get('modelo') as string,
        nuevo_usado:       formData.get('nuevo_usado') as string,
        fecha_matriculacion: (formData.get('fecha_matriculacion') as string) || null,
        precio:            parseFloat(formData.get('precio') as string),
        entrada:           parseFloat(formData.get('entrada') as string) || 0,
        plazo:             parseInt(formData.get('plazo') as string),
        importe:           parseFloat(formData.get('importe') as string),
        documentos:        docUrls,
        status:            'pendente',
      })
      .select('id')
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Send notification email
    if (NOTIFY_EMAILS.length) {
      const nombre = formData.get('nombre') as string
      const email = formData.get('email') as string
      const marca = formData.get('marca') as string
      const modelo = formData.get('modelo') as string
      const importe = formData.get('importe') as string

      await resend.emails.send({
        from: 'Importrust <no-reply@importrust.com>',
        to: NOTIFY_EMAILS,
        subject: `Nueva solicitud de financiamiento — ${nombre}`,
        html: `
          <h2>Nueva solicitud de financiamiento</h2>
          <p><strong>Cliente:</strong> ${nombre} (${email})</p>
          <p><strong>Vehículo:</strong> ${marca} ${modelo}</p>
          <p><strong>Importe:</strong> €${parseFloat(importe).toLocaleString('es-ES')}</p>
          <p><strong>ID:</strong> ${solicitude?.id}</p>
          <hr/>
          <p style="color:#666;font-size:12px">Importrust España — Sistema de financiamiento</p>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
