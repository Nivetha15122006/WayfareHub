import React from 'react';
import { X, Receipt, Download, ZoomIn } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, image, title, amount, currency }) => {
  if (!isOpen || !image) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window receipt-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Receipt size={20} className="text-primary" />
            <div>
              <h3 className="modal-title">{title || 'Receipt Inspection'}</h3>
              {amount && (
                <span className="receipt-modal-sub">
                  Amount: {amount} {currency}
                </span>
              )}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="receipt-modal-body">
          <img
            src={image}
            alt="Uploaded Bill / Receipt"
            className="receipt-full-image"
          />
        </div>

        <div className="receipt-modal-footer">
          <a
            href={image}
            download={`Receipt_${(title || 'Expense').replace(/\s+/g, '_')}.jpg`}
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} /> Download Receipt
          </a>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
