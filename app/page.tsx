import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-900">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/"><Image src="/logo.png" alt="Importrust" width={140} height={40} style={{ width: 140, height: 'auto' }} priority /></a>
          <div className="h-5 w-px bg-white/30" />
          <div className="text-sm text-white/70">Ahorre en la compra de su próximo coche</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="card p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicita tu financiamiento</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Trabajamos con los mejores bancos colaboradores para conseguirte las condiciones más competitivas. El proceso es rápido y sencillo — solo necesitamos algunos datos y documentos tuyos.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">¿Qué necesitarás?</h2>

          <div className="card p-5 flex gap-4">
            <div className="w-9 h-9 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Tus datos personales</p>
              <p className="text-xs text-gray-500 mt-0.5">Nombre, apellidos, fecha de nacimiento, DNI/NIE, email y teléfono.</p>
            </div>
          </div>

          <div className="card p-5 flex gap-4">
            <div className="w-9 h-9 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Datos del vehículo</p>
              <p className="text-xs text-gray-500 mt-0.5">Marca, modelo, fecha de primera matriculación, precio y plazo de financiamiento deseado.</p>
            </div>
          </div>

          <div className="card p-5 flex gap-4">
            <div className="w-9 h-9 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Documentación</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">Los documentos varían según tu situación laboral. En general necesitaremos:</p>
              <div className="space-y-1">
                {[
                  { tipo: 'Empleado Fijo', docs: 'DNI/NIE + Nómina (+ Modelo 100 si financias más de 30.000€)' },
                  { tipo: 'Temporal / Discontinuo', docs: 'DNI/NIE + Nómina + Vida Laboral' },
                  { tipo: 'Autónomo / Freelance', docs: 'DNI/NIE + Modelo 130/131 + Modelo 100' },
                  { tipo: 'Pensionista', docs: 'DNI/NIE + Justificante de pensión' },
                ].map(({ tipo, docs }) => (
                  <div key={tipo} className="text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{tipo}:</span> {docs}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Link href="/formulario" className="btn-primary w-full justify-center py-3 text-base">
          Comenzar solicitud →
        </Link>
      </div>
    </main>
  )
}
