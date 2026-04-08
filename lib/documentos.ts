export type SituacionLaboral =
  | 'empleado_fijo'
  | 'temporal'
  | 'autonomo'
  | 'pensionista'

export const SITUACION_LABELS: Record<SituacionLaboral, string> = {
  empleado_fijo: 'Empleado Fijo',
  temporal: 'Temporal / Discontinuo / Hogar',
  autonomo: 'Autónomo / Freelance',
  pensionista: 'Pensionista',
}

export interface DocumentoRequerido {
  id: string
  label: string
  descripcion?: string
}

export function getDocumentosRequeridos(
  situacion: SituacionLaboral,
  importe: number
): DocumentoRequerido[] {
  const docs: DocumentoRequerido[] = [
    { id: 'nif', label: 'NIF', descripcion: 'Documento Nacional de Identidad (DNI/NIE)' },
  ]

  const alto = importe > 30000

  if (situacion === 'empleado_fijo') {
    docs.push({ id: 'nomina', label: 'Nómina del mes anterior' })
    if (alto) docs.push({ id: 'modelo100', label: 'Modelo 100 (IRPF)' })
  }

  if (situacion === 'temporal') {
    docs.push({ id: 'nomina', label: 'Nómina del mes anterior' })
    docs.push({ id: 'vida_laboral', label: 'Vida Laboral' })
    if (alto) docs.push({ id: 'modelo100', label: 'Modelo 100 (IRPF)' })
  }

  if (situacion === 'autonomo') {
    docs.push({ id: 'modelo130', label: 'Modelo 130/131' })
    docs.push({ id: 'modelo100', label: 'Modelo 100 (IRPF)' })
    if (alto) docs.push({ id: 'vida_laboral', label: 'Vida Laboral' })
  }

  if (situacion === 'pensionista') {
    docs.push({ id: 'justificante_pension', label: 'Justificante de pensión / Apunte en cuenta' })
    if (alto) docs.push({ id: 'modelo100', label: 'Modelo 100 (IRPF)' })
  }

  return docs
}
