import React, { useState, useRef, useEffect } from 'react';
import html5QrCode from '@zxing/library';

const StudentMeetingScanner = ({ meetingId, onSuccess, onError, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  useEffect(() => {
    codeReader.current = new html5QrCode.Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScanning(true);
      } catch (err) {
        onError('Camera access denied');
      }
    };

    startScanner();

    return () => {
      if (codeReader.current) {
        codeReader.current.clear();
      }
    };
  }, []);

  const handleScan = (decodedText, decodedResult) => {
    if (decodedText.includes(meetingId)) {
      onSuccess(decodedText);
      codeReader.current.clear();
      onClose();
    }
  };

  const handleError = (error) => {
    console.warn('QR scan error:', error);
  };

  return (
    <div className="scanner-modal-overlay" style={{
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)', 
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        textAlign: 'center'
      }}>
        <h3>📱 Scan Meeting QR</h3>
        <p style={{ marginBottom: '16px' }}>Scan teacher's QR code to mark attendance</p>
        <div id="qr-reader" style={{ width: '300px', height: '300px', margin: '0 auto' }}></div>
        <div style={{ marginTop: '16px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentMeetingScanner;

