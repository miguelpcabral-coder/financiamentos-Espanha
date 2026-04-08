// ── Dropdown options ─────────────────────────────────────────────────────────

export const SITUACION_LABORAL_OPTIONS = [
  'Ama de casa',
  'Cuenta ajena',
  'Desempleado con prestación',
  'Desempleado sin prestación',
  'Empleado público',
  'Estudiante',
  'Jubilado',
  'Otras pensiones',
  'Pensionista Incapacidad',
  'Pensionista Orfandad',
  'Pensionista Viudedad',
  'Pre-Jubilado',
] as const

export const TIPO_CONTRATO_OPTIONS = [
  'En prácticas / Becario',
  'Fijo',
  'Fijo discontinuo',
  'Interino',
  'Temporal/obra y servicio',
] as const

export const TIPO_DOCUMENTO_OPTIONS = ['DNI', 'NIE', 'Pasaporte'] as const

export const ESTADO_CIVIL_OPTIONS = [
  'Soltero/a',
  'Casado/a',
  'Divorciado/a',
  'Separado/a',
  'Viudo/a',
  'Unión de hecho',
] as const

export const SITUACION_VIVIENDA_OPTIONS = [
  'Alquiler',
  'Alquiler Habitacion',
  'Otros',
  'Propiedad con hipoteca',
  'Propiedad sin hipoteca',
  'Vivienda Familiar',
] as const

export const SECTOR_ACTIVIDAD_OPTIONS = [
  'Administración Pública',
  'Agricultura, Ganadería y Pesca',
  'Comercio',
  'Comunicación, Radio y Televisión, Prensa',
  'Consultoría',
  'Cultura y Deportes',
  'Enseñanza',
  'Hostelería y restauración',
  'Industria y energía',
  'Inmobiliaria y construcción',
  'Salud',
  'Servicios financieros y seguros',
  'Servicios Profesionales',
  'Transporte',
] as const

export const PROFESION_OPTIONS = [
  'Abogado', 'Administrativo', 'Agricultor/Ganadero', 'Analista', 'Arquitecto',
  'Artista', 'Auxiliar', 'Ayudante', 'Bibliotecario', 'Camarero', 'Cargos políticos',
  'Celadores', 'Cocinero', 'Comercial ventas', 'Conductor', 'Consultor', 'Contable',
  'Creativo', 'Delineante', 'Dentista', 'Dependiente', 'Deportista', 'Diplomático',
  'Director', 'Diseñador', 'Economista', 'Enfermero', 'Farmacéutico', 'Fisioterapeuta',
  'Fuerzas de seguridad del estado', 'Funcionario A1', 'Funcionario A2', 'Funcionario B',
  'Funcionario C1', 'Funcionario C2', 'Gerente', 'Informático', 'Ingeniero',
  'Investigador', 'Jefes de estudios', 'Jefes de proyecto', 'Locutores',
  'Mandos intermedios', 'Militar de carrera', 'Obrero', 'Oficial', 'Operario',
  'Otra profesión liberal', 'Periodista/Escritor', 'Personal de limpieza',
  'Personal laboral Grupo 1', 'Personal laboral Grupo 2', 'Personal laboral Grupo 3',
  'Personal laboral Grupo 4', 'Personal laboral Grupo 5', 'Profesionales de la salud',
  'Profesor', 'Profesor universitario', 'Propietario / Administrador empresa',
  'Psicólogos', 'Religioso', 'Responsable de obra', 'Secretario/a', 'Soldado profesional',
  'Subalterno', 'Supervisor', 'Técnico', 'Técnico de ejecución', 'Temporero',
  'Traductor', 'Venta ambulante', 'Venta directa', 'Veterinarios', 'Vigilantes seguridad',
] as const

export const NUM_PAGAS_OPTIONS = ['12', '14'] as const

export const PAISES_OPTIONS = [
  'España', 'Alemania', 'Argentina', 'Bolivia', 'Brasil', 'Chile', 'China',
  'Colombia', 'Cuba', 'Ecuador', 'Francia', 'Honduras', 'Italia', 'Marruecos',
  'México', 'Nicaragua', 'Paraguay', 'Perú', 'Portugal', 'República Dominicana',
  'Rumanía', 'Rusia', 'Senegal', 'Ucrania', 'Uruguay', 'Venezuela', 'Otro',
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Whether this situacion_laboral requires professional fields (contrato, empresa, etc.) */
export function needsProfessionalFields(situacion: string): boolean {
  return situacion === 'Cuenta ajena' || situacion === 'Empleado público'
}

const TEMP_CONTRACTS = ['En prácticas / Becario', 'Fijo discontinuo', 'Temporal/obra y servicio']

function isPensionista(situacion: string): boolean {
  return ['Jubilado', 'Otras pensiones', 'Pensionista Incapacidad', 'Pensionista Orfandad', 'Pensionista Viudedad', 'Pre-Jubilado'].includes(situacion)
}

// ── Document logic ────────────────────────────────────────────────────────────

export interface DocumentoRequerido {
  id: string
  label: string
  descripcion?: string
}

export function getDocumentosRequeridos(
  situacion: string,
  tipoContrato: string,
  importe: number
): DocumentoRequerido[] {
  const docs: DocumentoRequerido[] = [
    { id: 'nif', label: 'DNI/NIE', descripcion: 'Documento Nacional de Identidad o Número de Identificación de Extranjero' },
  ]
  const alto = importe > 30000

  if (situacion === 'Cuenta ajena' || situacion === 'Empleado público') {
    docs.push({ id: 'nomina', label: 'Nómina del mes anterior' })
    if (TEMP_CONTRACTS.includes(tipoContrato)) {
      docs.push({ id: 'vida_laboral', label: 'Vida Laboral' })
    }
    if (alto) docs.push({ id: 'modelo100', label: 'Modelo 100 (IRPF)' })
  }

  if (isPensionista(situacion)) {
    docs.push({ id: 'justificante_pension', label: 'Justificante de pensión / Apunte en cuenta' })
    if (alto) docs.push({ id: 'modelo100', label: 'Modelo 100 (IRPF)' })
  }

  if (situacion === 'Desempleado con prestación') {
    docs.push({ id: 'justificante_prestacion', label: 'Justificante de prestación por desempleo' })
    docs.push({ id: 'vida_laboral', label: 'Vida Laboral' })
  }

  if (situacion === 'Desempleado sin prestación') {
    docs.push({ id: 'vida_laboral', label: 'Vida Laboral' })
  }

  return docs
}
