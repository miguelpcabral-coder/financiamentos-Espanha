import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { path, contentType } = await req.json()
    if (!path || !contentType) {
      return NextResponse.json({ error: 'Missing path or contentType' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
      .from('Financiamentos-docs')
      .createSignedUploadUrl(path)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: urlData } = supabase.storage
      .from('Financiamentos-docs')
      .getPublicUrl(path)

    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: urlData.publicUrl })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
