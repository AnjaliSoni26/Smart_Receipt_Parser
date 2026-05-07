import { useState, useCallback, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReceipt } from '../api';
import type { Receipt } from '../types';

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ receipt: Receipt; imageUrl: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleFile = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a JPG or PNG image.');
      return;
    }
    setError(null);
    setLoading(true);
    setImageFile(file);
    try {
      const receipt = await uploadReceipt(file);
      // Create a data URL for the image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview({
          receipt,
          imageUrl: e.target?.result as string,
        });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
      setLoading(false);
      setImageFile(null);
    }
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {error && <div className="error-banner">⚠ {error}</div>}

      {preview ? (
        <div className="preview-container">
          <h1 className="page-title">Review Extracted Data</h1>
          
          <div className="preview-layout">
            {/* Image Preview */}
            <div className="preview-image-section">
              <div className="preview-image-wrapper">
                <img src={preview.imageUrl} alt="Receipt" className="preview-image" />
              </div>
            </div>

            {/* Parsed Data */}
            <div className="preview-data-section">
              <div className="preview-card">
                <div className="preview-field">
                  <label>Merchant</label>
                  <div className="preview-value">{preview.receipt.merchant || '(not detected)'}</div>
                </div>

                <div className="preview-field">
                  <label>Date</label>
                  <div className="preview-value">{preview.receipt.date ? new Date(preview.receipt.date).toLocaleDateString() : '(not detected)'}</div>
                </div>

                <div className="preview-field">
                  <label>Total</label>
                  <div className="preview-value" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    ${Number(preview.receipt.total).toFixed(2)}
                  </div>
                </div>

                <div className="preview-field">
                  <label>Items ({preview.receipt.line_items.length})</label>
                  <div className="preview-items-list">
                    {preview.receipt.line_items.map((item, idx) => (
                      <div key={idx} className="preview-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-amount">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {Object.values(preview.receipt.confidence_flags).some(Boolean) && (
                  <div className="preview-warnings">
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>
                      ⚠️ Confidence issues detected — review carefully
                    </div>
                    {preview.receipt.confidence_flags.merchant_uncertain && <div className="warning-tag">Merchant uncertain</div>}
                    {preview.receipt.confidence_flags.date_uncertain && <div className="warning-tag">Date uncertain</div>}
                    {preview.receipt.confidence_flags.low_quality_image && <div className="warning-tag">Low image quality</div>}
                    {preview.receipt.confidence_flags.partial_parse && <div className="warning-tag">Partial extraction</div>}
                    {preview.receipt.confidence_flags.total_mismatch && <div className="warning-tag">Total ≠ sum of items</div>}
                  </div>
                )}
              </div>

              <div className="preview-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/receipts/${preview.receipt.id}`)}
                >
                  ✓ Confirm &amp; Edit
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setPreview(null);
                    setImageFile(null);
                    setError(null);
                  }}
                >
                  ✕ Upload Different
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {!loading ? (
              <>
                <span className="upload-icon">🧾</span>
                <h2>Drop a receipt photo here</h2>
                <p>or click to browse — JPG or PNG, up to 10MB</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </>
            ) : (
              <>
                <span className="upload-icon" style={{ opacity: 0.3 }}>🧾</span>
                <h2 style={{ opacity: 0.4 }}>Extracting data…</h2>
                <div className="loading-bar" style={{ maxWidth: 300, margin: '1.5rem auto 0' }}>
                  <div className="loading-bar-inner" />
                </div>
                <p className="loading-text">Gemini is reading your receipt</p>
              </>
            )}
          </div>

          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--paper-warm)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              WHAT GETS EXTRACTED — Merchant name · Date · Individual line items (including tax &amp; tip as separate items) · Total amount.
              Subtotals are omitted as redundant. You can edit any field after extraction.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
