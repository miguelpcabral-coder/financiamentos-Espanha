import Image from 'next/image'
import FormularioFinanciamento from '@/components/FormularioFinanciamento'

export default function Formulario() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-brand-900">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/"><Image src="/logo.png" alt="Importrust" width={140} height={40} style={{ width: 140, height: 'auto' }} priority /></a>
          <div className="h-5 w-px bg-white/30" />
          <div className="text-sm text-white/70">Ahorre en la compra de su próximo coche</div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Solicitud de financiamiento</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Para conseguirte las mejores condiciones, vamos a recopilar tus datos y documentación para compartirlos con nuestros bancos colaboradores. En cuanto tengamos una respuesta, te la comunicaremos a la mayor brevedad.
          </p>
        </div>
        <FormularioFinanciamento />
      </div>
    </main>
  )
}
