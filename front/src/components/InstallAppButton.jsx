import { useEffect, useState } from 'react'
import { Icon } from './Icon.jsx'

/**
 * Botón de instalación de la PWA.
 *
 * Chrome no siempre muestra el aviso nativo de instalación (puede tardar o
 * aparecer en el ícono de la barra de direcciones). Este botón captura el
 * evento `beforeinstallprompt` y dispara el instalador directamente con un clic.
 * No se muestra si la app ya está instalada o si el navegador no la permite.
 */
export function InstallAppButton({ className = 'btn btn-secondary btn-sm' }) {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const syncPrompt = () => setPromptEvent(window.__pwaInstallPrompt || null)
    syncPrompt()
    window.addEventListener('pwa-install-changed', syncPrompt)

    // La app ya corre como aplicación instalada.
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('pwa-install-changed', syncPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  if (installed || !promptEvent) return null

  const handleClick = async () => {
    try {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') setInstalled(true)
    } catch {
      // El usuario canceló o el navegador falló: silencioso, sin romper la UI.
    }
    window.__pwaInstallPrompt = null
    setPromptEvent(null)
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      <Icon name="download" size={15} />
      Instalar app
    </button>
  )
}

export default InstallAppButton
