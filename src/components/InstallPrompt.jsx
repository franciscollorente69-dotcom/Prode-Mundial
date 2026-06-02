import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone) return

    if (isIOSDevice) {
      setIsIOS(true)
      setVisible(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') dismiss()
  }

  const dismiss = () => {
    localStorage.setItem('pwa-dismissed', '1')
    setVisible(false)
    setDismissed(true)
  }

  if (!visible || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Instalá Prode Mundial 2026</p>
            {isIOS ? (
              <p className="text-gray-400 text-xs mt-1">
                Tocá <strong className="text-white">Compartir</strong> luego{' '}
                <strong className="text-white">"Agregar a inicio"</strong> para instalar la app.
              </p>
            ) : (
              <p className="text-gray-400 text-xs mt-1">
                Instalá la app para acceder sin internet y recibir notificaciones.
              </p>
            )}
          </div>
        </div>
        {!isIOS && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-2 text-gray-400 hover:text-white text-sm rounded-xl hover:bg-gray-800 transition-colors"
            >
              Ahora no
            </button>
          </div>
        )}
        {isIOS && (
          <button onClick={dismiss} className="mt-2 w-full text-center text-xs text-gray-500 hover:text-gray-300">
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}
