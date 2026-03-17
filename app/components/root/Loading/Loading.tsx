import "./style.css"
import { useLoadingStore } from "~/store/loadingStore"

export default function Loading() {
  const { isLoading } = useLoadingStore();

  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 w-full h-dvh flex justify-center items-center bg-black/60 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <span className="loader"></span>
        <p className="text-white text-lg">Cargando...</p>
      </div>
    </div>
  )
}
