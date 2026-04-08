import Image from 'next/image'
import Link from 'next/link'

export default function Obrigado() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-brand-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <a href="/"><Image src="/logo.png" alt="Importrust" width={140} height={40} style={{ width: 140, height: "auto" }} priority /></a>
          <div className="h-5 w-px bg-white/30" />
          <div className="text-sm text-white/70">Ahorre en la compra de su próximo coche</div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Hemos recibido tus datos y documentación. Vamos a compartirlos con nuestros bancos colaboradores para conseguirte las mejores condiciones. En cuanto tengamos una respuesta, te la comunicaremos lo antes posible.
          </p>
          <Link href="/" className="btn-secondary mt-8 inline-flex">
            ← Nueva solicitud
          </Link>
        </div>
      </div>
    </main>
  )
}
