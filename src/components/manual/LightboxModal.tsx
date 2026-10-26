interface LightboxModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
}

export function LightboxModal({ isOpen, imageSrc, onClose }: LightboxModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-100 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-[95%] max-h-[92vh] flex items-center justify-center">
        <img 
          src={imageSrc} 
          alt="Enlarged inspection view" 
          className="rounded-xl shadow-2xl border border-white/20 object-contain max-h-[90vh] scale-100 animate-in zoom-in-95 transition-transform" 
        />
        <span className="absolute bottom-4 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs backdrop-blur-md pointer-events-none border border-white/10 shadow-lg">
          Click anywhere to close
        </span>
      </div>
    </div>
  );
}