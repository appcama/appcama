export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm py-6 sm:py-10 mt-auto border-t border-gray-200/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <img 
            src="/rodape-logos.png" 
            alt="Logos governamentais - CAMA, Catadores de Sonhos, Ministério dos Direitos Humanos e Governo do Brasil" 
            className="h-20 sm:h-32 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  );
}
