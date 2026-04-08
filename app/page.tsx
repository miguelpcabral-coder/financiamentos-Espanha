import FormularioFinanciamento from '@/components/FormularioFinanciamento'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-brand-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight">IMPORTRUST</div>
          <div className="h-5 w-px bg-white/30" />
          <div className="text-sm text-white/70">Financiamento España</div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Solicitud de financiamiento</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Rellena el formulario y sube la documentación requerida. Te contactaremos en breve.
          </p>
        </div>
        <FormularioFinanciamento />
      </div>
    </main>
  )
}
