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
      {error && (
        <div className="error-banner" style={{ padding: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          ⚠️ {error}
          {error.includes('Upload failed') && ' Please try a different image or check your connection.'}
        </div>
      )}

      {preview ? (
        <div className="preview-container" style={{ animation: 'fadeInScale 0.4s ease-out' }}>
          <h1 className="page-title">✓ Receipt captured</h1>
          
          <div className="preview-layout">
            {/* Image Preview */}
            <div className="preview-image-section" style={{ animation: 'slideInLeft 0.5s ease-out' }}>
              <div className="preview-image-wrapper">
                <img src={preview.imageUrl} alt="Receipt" className="preview-image" style={{ animation: 'fadeIn 0.4s ease-out' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.5rem', textAlign: 'center' }}>
                Original receipt image
              </div>
            </div>

            {/* Parsed Data */}
            <div className="preview-data-section" style={{ animation: 'slideInLeft 0.5s ease-out 0.1s both' }}>
              <div className="preview-card">
                <div className="preview-field" style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}>
                  <label>Merchant</label>
                  <div className="preview-value">
                    {preview.receipt.merchant || <span style={{ color: 'var(--accent)' }}>(not detected — you can add it)</span>}
                  </div>
                </div>

                <div className="preview-field" style={{ animation: 'slideUp 0.4s ease-out 0.25s both' }}>
                  <label>Date</label>
                  <div className="preview-value">
                    {preview.receipt.date ? new Date(preview.receipt.date).toLocaleDateString() : <span style={{ color: 'var(--accent)' }}>(not detected — you can add it)</span>}
                  </div>
                </div>

                <div className="preview-field" style={{ animation: 'slideUp 0.4s ease-out 0.3s both' }}>
                  <label>Total</label>
                  <div className="preview-value" style={{ fontSize: '1.25rem', fontWeight: 600, background: 'linear-gradient(135deg, var(--paper-warm) 0%, var(--paper) 100%)' }}>
                    {preview.receipt.total ? `$${Number(preview.receipt.total).toFixed(2)}` : <span style={{ color: 'var(--accent)' }}>(not detected)</span>}
                  </div>
                </div>

                <div className="preview-field" style={{ animation: 'slideUp 0.4s ease-out 0.35s both' }}>
                  <label>Items ({preview.receipt.line_items.length})</label>
                  {preview.receipt.line_items.length === 0 ? (
                    <div style={{ color: 'var(--accent)', fontSize: '0.9rem', padding: '0.5rem 0', animation: 'fadeIn 0.3s ease-out' }}>
                      No items detected. You can add them after confirming.
                    </div>
                  ) : (
                    <div className="preview-items-list">
                      {preview.receipt.line_items.map((item, idx) => (
                        <div key={idx} className="preview-item" style={{ animation: `slideInLeft 0.3s ease-out ${0.4 + idx * 0.05}s both` }}>
                          <span className="item-name">{item.name || '(unnamed)'}</span>
                          <span className="item-amount">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {Object.values(preview.receipt.confidence_flags).some(Boolean) && (
                  <div className="preview-warnings" style={{ animation: 'slideDown 0.4s ease-out' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 500 }}>
                      ⚠️ Issues detected — please review before confirming
                    </div>
                    {preview.receipt.confidence_flags.merchant_uncertain && <div className="warning-tag">◆ Merchant uncertain</div>}
                    {preview.receipt.confidence_flags.date_uncertain && <div className="warning-tag">◆ Date uncertain</div>}
                    {preview.receipt.confidence_flags.low_quality_image && <div className="warning-tag">📷 Low image quality</div>}
                    {preview.receipt.confidence_flags.partial_parse && <div className="warning-tag">⚠️ Partial extraction — fields missing</div>}
                    {preview.receipt.confidence_flags.total_mismatch && <div className="warning-tag">🔢 Total ≠ sum of items</div>}
                  </div>
                )}
              </div>

              <div className="preview-actions" style={{ animation: 'slideUp 0.4s ease-out 0.4s both' }}>
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
                <span className="upload-icon" style={{ animation: 'float 3s ease-in-out infinite' }}>🧾</span>
                <h2 style={{ animation: 'fadeIn 0.5s ease-out' }}>Drop a receipt photo here</h2>
                <p style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>or click to browse — JPG or PNG, up to 10MB</p>
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
                <span className="upload-icon" style={{ opacity: 0.3, animation: 'pulse 1.5s ease-in-out infinite' }}>🧾</span>
                <h2 style={{ opacity: 0.4 }}>Extracting data…</h2>
                <div className="loading-bar" style={{ maxWidth: 300, margin: '1.5rem auto 0' }}>
                  <div className="loading-bar-inner" />
                </div>
                <p className="loading-text">Gemini is reading your receipt</p>
              </>
            )}
          </div>

          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--paper-warm)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', lineHeight: 1.8, letterSpacing: '0.02em' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--ink)' }}>WHAT GETS EXTRACTED:</strong> Merchant · Date · Line items (including tax, tip, discounts) · Total.
              </div>
              <div>
                <strong style={{ color: 'var(--ink)' }}>EDGE CASES:</strong> Blurry image? Flagged before you confirm. Missing fields? Shown as empty—you fill them in. Math doesn't add up? Detected live in the editor.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
