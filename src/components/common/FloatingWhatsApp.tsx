const WHATSAPP_NUMBER = '+918618176219';

export const FloatingWhatsApp = () => {
  const handleClick = () => {
    const phone = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}`;
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed z-40 bottom-20 right-4 md:bottom-6 md:right-6 rounded-full shadow-lg shadow-black/20 hover:scale-105 transition-transform w-16 h-16 flex items-center justify-center bg-transparent"
      aria-label="Chat on WhatsApp"
    >
      <img
        src="/asses/image.png"
        alt="Chat on WhatsApp"
        className="w-full h-full object-contain"
      />
    </button>
  );
};

export default FloatingWhatsApp;

