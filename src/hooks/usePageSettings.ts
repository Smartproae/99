import { useState, useEffect } from "react";

export function usePageSettings() {
  const [letterheadModeEnabled, setLetterheadModeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("letterhead_mode_enabled");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("letterhead_mode_enabled", JSON.stringify(letterheadModeEnabled));
  }, [letterheadModeEnabled]);

  return {
    letterheadModeEnabled,
    setLetterheadModeEnabled,
    toggleLetterheadMode: () => setLetterheadModeEnabled((prev) => !prev),
  };
}
