import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  text: string;
  className?: string;
  alt?: string;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({
  text,
  className = "w-28 h-28 shrink-0",
  alt = "QR Code"
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!text) return;

    QRCode.toDataURL(text, {
      margin: 1,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch(err => {
        console.error('Failed to generate QR Code Data URL:', err);
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [text]);

  if (error || !dataUrl) {
    return (
      <div className={`${className} bg-slate-100 rounded flex flex-col items-center justify-center p-2 border border-slate-200 text-center`}>
        <span className="text-[9px] text-slate-400 font-bold">Generating QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
    />
  );
};
