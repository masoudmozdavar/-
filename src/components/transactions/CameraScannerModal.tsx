import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  isFa: boolean;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  isFa,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);

  // Start camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsLoadingCamera(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NOT_SUPPORTED');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoadingCamera(false);
    } catch (err: any) {
      setIsLoadingCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          isFa
            ? 'دسترسی به دوربین توسط کاربر یا مرورگر مسدود شده است. می‌توانید از گزینه بارگذاری عکس استفاده کنید.'
            : 'Camera permission was denied. You can upload an image from your device.'
        );
      } else {
        setCameraError(
          isFa
            ? 'دوربین دستگاه در دسترس نیست یا توسط برنامه دیگری استفاده می‌شود.'
            : 'Device camera is not available or is in use by another application.'
        );
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleSnap = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawData = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const compressed = await compressImage(rawData, 1024, 1024, 0.8);
      setCapturedPhoto(compressed);
      stopCamera();
    } catch {
      setCapturedPhoto(rawData);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1024, 1024, 0.8);
      setCapturedPhoto(compressed);
      stopCamera();
    } catch (err) {
      // fallback
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div key="camera-scanner-modal-overlay" className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden text-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {isFa ? 'عکس‌برداری از رسید یا فاکتور' : 'Scan / Capture Receipt'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isFa ? 'استفاده مستقیم از دوربین دستگاه' : 'Direct device camera capture'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            /* Captured photo preview */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedPhoto}
                alt="Receipt"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Check className="w-3 h-3" />
                <span>{isFa ? 'تصویر ثبت شد' : 'Captured'}</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Upload Fallback State */
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isFa ? 'انتخاب عکس از گالری / فایل‌ها' : 'Choose from files / gallery'}</span>
              </button>
            </div>
          ) : (
            /* Live Camera Stream with Viewfinder Grid */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder frame overlay */}
              <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr"></div>
                  <div className="w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl"></div>
                </div>
                <div className="text-center">
                  <span className="bg-slate-950/70 text-slate-300 text-[10px] px-3 py-1 rounded-full font-medium">
                    {isFa ? 'رسید یا فاکتور را در کادر قرار دهید' : 'Align receipt inside frame'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br"></div>
                  <div className="w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl"></div>
                </div>
              </div>

              {isLoadingCamera && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs text-slate-300">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-400" />
                  <span>{isFa ? 'در حال راه‌اندازی دوربین...' : 'Starting camera...'}</span>
                </div>
              )}
            </>
          )}

          {/* Hidden File Input for Native Mobile Camera / File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800">
          {capturedPhoto ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isFa ? 'عکس‌برداری مجدد' : 'Retake'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{isFa ? 'تأیید و ضمیمه به تراکنش' : 'Attach Receipt'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isFa ? 'انتخاب فایل از دستگاه' : 'Pick from device'}
              >
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">{isFa ? 'فایل گالری' : 'Gallery'}</span>
              </button>

              {/* Central Big Shutter Button */}
              <button
                type="button"
                onClick={handleSnap}
                disabled={isLoadingCamera || !!cameraError}
                className="w-14 h-14 rounded-full bg-white hover:bg-slate-200 active:scale-90 transition-all p-1.5 flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                title={isFa ? 'ثبت عکس' : 'Take photo'}
              >
                <div className="w-full h-full rounded-full border-2 border-slate-950 bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </button>

              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={isLoadingCamera || !!cameraError}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title={isFa ? 'تغییر دوربین جلو / پشت' : 'Switch camera'}
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{isFa ? 'چرخش' : 'Flip'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
