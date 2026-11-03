import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Alert } from './Alert.jsx'
import { Icon } from './Icon.jsx'

/**
 * Lector de código QR con la cámara del navegador (librería ligera jsQR).
 *
 * - Requiere permiso de cámara y un contexto seguro (localhost cuenta como seguro).
 * - Si la cámara no está disponible, muestra un mensaje claro y sugiere buscar por placa.
 * - El token leído se valida SIEMPRE contra el backend.
 */
export function QRScanner({ onDetected, active = true }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!active) return undefined
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador no permite acceder a la cámara. Usa la búsqueda por placa.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setScanning(true)
      } catch {
        setError(
          'No se pudo acceder a la cámara. Verifica los permisos del navegador o usa la búsqueda por placa.',
        )
      }
    }

    start()

    return () => {
      cancelled = true
      setScanning(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [active])

  useEffect(() => {
    if (!scanning) return undefined
    let stopped = false

    const tick = () => {
      if (stopped) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(image.data, image.width, image.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code?.data) {
          onDetected(code.data)
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scanning, onDetected])

  if (error) {
    return (
      <Alert type="warning" title="Cámara no disponible">
        {error}
      </Alert>
    )
  }

  return (
    <div>
      <div className="qr-reader">
        <video ref={videoRef} muted playsInline />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="meta-row justify-center mt-1" style={{ justifyContent: 'center' }}>
        <Icon name="scan" size={15} />
        {scanning ? 'Escaneando… apunta la cámara al código QR del vehículo.' : 'Preparando la cámara…'}
      </div>
    </div>
  )
}

export default QRScanner
