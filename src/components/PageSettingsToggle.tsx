import React from "react";
import { Printer } from "lucide-react";

interface ToggleProps {
  letterheadModeEnabled: boolean;
  setLetterheadModeEnabled: (val: boolean) => void;
}

export const PageSettingsToggle: React.FC<ToggleProps> = ({
  letterheadModeEnabled,
  setLetterheadModeEnabled,
}) => {
  return (
    <label className="flex items-center justify-between cursor-pointer p-2 bg-[#F9F8F6] border border-[#D1CEC7] hover:border-[#2D2A26] transition-colors">
      <div className="flex items-center gap-2">
        <Printer className="w-4 h-4 text-[#C5A059]" />
        <div>
          <span className="text-xs font-semibold text-[#2D2A26]">Pre-printed Letterhead Paper Mode</span>
          <p className="text-[9px] text-[#8B8678] font-medium">Hides digital header & footer for printing on pre-printed paper</p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={letterheadModeEnabled}
        onChange={(e) => setLetterheadModeEnabled(e.target.checked)}
        className="w-4 h-4 text-[#2D2A26] bg-white border-[#D1CEC7] accent-[#2D2A26]"
      />
    </label>
  );
};
