import React from 'react';
import { X, Download, Trash2, ZoomIn, Eye } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onRemove?: () => void;
  isFa: boolean;
  title?: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onRemove,
  isFa,
  title,
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `receipt-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div key="receipt-viewer-modal-overlay" className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden text-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold">
              {title || (isFa ? 'مشاهده تصویر رسید / فاکتور' : 'Receipt / Invoice Photo')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFa ? 'دانلود تصویر' : 'Download image'}
            >
              <Download className="w-4 h-4" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors cursor-pointer"
                title={isFa ? 'حذف این رسید' : 'Remove receipt'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full Image Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
          <img
            src={imageUrl}
            alt="Receipt Full View"
            className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
