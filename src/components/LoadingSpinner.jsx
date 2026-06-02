export default function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-green-900" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}
