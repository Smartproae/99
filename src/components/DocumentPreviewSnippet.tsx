import React from "react";

interface DocumentProps {
  title: string;
  content: string;
  companyName: string;
  letterheadModeEnabled?: boolean;
}

export const DocumentPreview: React.FC<DocumentProps> = ({
  title,
  content,
  companyName,
  letterheadModeEnabled = false,
}) => {
  return (
    <div
      id="printable-document"
      className="w-full max-w-[800px] bg-white text-[#1A1A1A] p-4 sm:p-6 relative font-serif text-xs leading-snug"
    >
      {/* HEADER SECTION: Hide digital branding when printing on pre-printed paper */}
      {!letterheadModeEnabled ? (
        <div className="flex justify-between items-center border-b-2 border-[#1A1A1A] pb-2 mb-2.5">
          <h2 className="text-base font-bold text-[#2D2A26]">{companyName}</h2>
          <span className="text-[9px] uppercase tracking-wider text-[#C5A059] font-bold">
            Official Instrument
          </span>
        </div>
      ) : (
        /* Empty spacing for pre-printed letterhead paper alignment */
        <div className="h-10 sm:h-14" />
      )}

      {/* DOCUMENT BODY */}
      <div className="my-2 space-y-1.5 text-[11px] leading-snug">
        <h3 className="font-bold text-xs border-l-2 border-[#C5A059] pl-2 py-0.5 bg-[#F9F8F6]">
          {title}
        </h3>
        <p className="whitespace-pre-line text-[#2D2A26]">{content}</p>
      </div>

      {/* FOOTER SECTION: Hide digital footer when printing on pre-printed paper */}
      {!letterheadModeEnabled ? (
        <div className="mt-4 pt-2 border-t border-[#ECE9E1] flex justify-between text-[8px] uppercase tracking-widest text-[#A39E92]">
          <span>Ref Code: REG-2026</span>
          <span>Page 01 of 01</span>
        </div>
      ) : (
        /* Empty spacing for pre-printed letterhead paper bottom margin */
        <div className="h-8 sm:h-10" />
      )}
    </div>
  );
};
