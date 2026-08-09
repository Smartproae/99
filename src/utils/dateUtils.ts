export function formatDateDMY(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (!str) return '';

  // Check if it already matches DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Check if YYYY-MM-DD or ISO timestamp
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }

  // Parse via Date object
  const dObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (dObj && !isNaN(dObj.getTime())) {
    const day = String(dObj.getDate()).padStart(2, '0');
    const month = String(dObj.getMonth() + 1).padStart(2, '0');
    const year = dObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

export function formatTime12h(dateInput?: string | Date | null): string {
  if (!dateInput) return '00.00 AM';
  const dObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!dObj || isNaN(dObj.getTime())) {
    const str = String(dateInput).trim();
    if (/^\d{1,2}[\.\:]\d{2}\s*(AM|PM)$/i.test(str)) {
      return str.replace(':', '.');
    }
    return '00.00 AM';
  }
  let hours = dObj.getHours();
  const minutes = String(dObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}.${minutes} ${ampm}`;
}

export function formatDateTimeDMY(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const dmy = formatDateDMY(dateInput);
  const timeStr = formatTime12h(dateInput);
  return `${dmy} ${timeStr}`;
}
