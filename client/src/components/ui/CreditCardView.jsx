import React from 'react';
import { X, Wifi } from 'lucide-react';

const CreditCardView = ({ isOpen, onClose, bankName, accountNumber, cardholderName, ifscCode }) => {
  if (!isOpen) return null;

  // Format account number to look like a credit card (groups of 4)
  const formattedAccount = accountNumber
    ? accountNumber.replace(/(.{4})/g, '$1 ').trim()
    : 'XXXX XXXX XXXX XXXX';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="relative w-full max-w-md mx-4 animate-[slideDown_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button outside the card */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* The Credit Card */}
        <div className="relative w-full aspect-[1.586/1] bg-gradient-to-br from-[#1a1c23] via-[#242730] to-[#121318] rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden text-white font-mono select-none border border-white/10 group">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative h-full flex flex-col justify-between z-10">
            
            {/* Top Row: Bank Name and Type */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white rounded-br-full rounded-tl-sm opacity-90"></div>
                <span className="font-semibold tracking-widest uppercase text-sm md:text-base opacity-90">
                  {bankName || 'BANK NAME'}
                </span>
              </div>
              <span className="text-xs md:text-sm tracking-wider opacity-70 uppercase">Salary Account</span>
            </div>

            {/* Middle Row: Chip and Contactless */}
            <div className="flex justify-between items-center mt-2">
              {/* EMV Chip */}
              <div className="w-12 h-10 md:w-14 md:h-11 rounded-md bg-gradient-to-br from-[#e0b976] via-[#f5d68f] to-[#c69a47] overflow-hidden relative shadow-inner">
                {/* Chip lines */}
                <div className="absolute inset-0 border border-black/20 rounded-md"></div>
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/20"></div>
                <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-black/20"></div>
                <div className="absolute top-0 bottom-0 right-1/3 w-[1px] bg-black/20"></div>
                <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-black/20"></div>
                <div className="absolute bottom-[25%] left-0 right-0 h-[1px] bg-black/20"></div>
                {/* Center rectangle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-5 border border-black/20 rounded-sm"></div>
              </div>
              
              {/* Contactless Icon */}
              <div className="opacity-80 rotate-90">
                <Wifi size={28} strokeWidth={2.5} />
              </div>
            </div>

            {/* Account Number */}
            <div className="mt-2">
              <div className="text-xl md:text-3xl font-bold tracking-[0.15em] text-white/90" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {formattedAccount}
              </div>
            </div>

            {/* Bottom Row: Name and IFSC */}
            <div className="flex justify-between items-end mt-4">
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs opacity-50 mb-1 uppercase tracking-widest">Account Holder</span>
                <span className="text-sm md:text-lg font-semibold tracking-widest uppercase opacity-90 truncate max-w-[200px]">
                  {cardholderName || 'CARDHOLDER NAME'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] opacity-50 mb-1 uppercase tracking-widest">IFSC Code</span>
                <span className="text-xs md:text-sm font-semibold tracking-wider opacity-90">
                  {ifscCode || 'IFSC0000000'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardView;
