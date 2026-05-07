import { useState, useCallback } from 'react';
import type { Receipt, LineItem, ConfidenceFlags } from '../types';
import { saveReceipt, deleteReceipt } from '../api';
import { useNavigate } from 'react-router-dom';

interface Props {
  receipt: Receipt;
  onSaved?: (updated: Receipt) => void;
}

function FlagBadges({ flags }: { flags: ConfidenceFlags }) {
  const items: { label: string; type: 'warning' | 'error'; emoji: string }[] = [];
  if (flags.low_quality_image) items.push({ label: 'Low image quality — verify carefully', type: 'warning', emoji: '📷' });
  if (flags.partial_parse) items.push({ label: 'Partial extraction — some fields were missed', type: 'error', emoji: '⚠️' });
  if (flags.merchant_uncertain) items.push({ label: 'Merchant uncertain', type: 'warning', emoji: '◆' });
  if (flags.date_uncertain) items.push({ label: 'Date uncertain', type: 'warning', emoji: '◆' });
  if (flags.total_mismatch) items.push({ label: 'Total ≠ sum of items', type: 'error', emoji: '🔢' });

  if (items.length === 0) return (
    <div className="flags-list" style={{ padding: '0.75rem 1rem', background: 'rgba(76, 175, 80, 0.08)', borderRadius: 6, border: '1px solid rgba(76, 175, 80, 0.2)', animation: 'fadeInScale 0.4s ease-out' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>✓ All systems go — no issues detected</span>
    </div>
  );

  return (
    <div className="flags-list">
      {items.map((f, idx) => (
        <span 
          key={f.label} 
          className={`flag ${f.type}`} 
          title={f.label}
          style={{ animation: `slideInLeft 0.3s ease-out ${idx * 0.08}s both` }}
        >
          {f.emoji} {f.label}
        </span>
      ))}
    </div>
  );
}

function sumItems(items: LineItem[]): number {
  return items.reduce((acc, i) => acc + (i.amount || 0), 0);
}

export default function ReceiptEditor({ receipt, onSaved }: Props) {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(receipt.merchant ?? '');
  const [date, setDate] = useState(receipt.date ?? '');
  const [lineItems, setLineItems] = useState<LineItem[]>(receipt.line_items);
  const [total, setTotal] = useState(receipt.total?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState(false);

  const isDirty =
    merchant !== (receipt.merchant ?? '') ||
    date !== (receipt.date ?? '') ||
    total !== (receipt.total?.toString() ?? '') ||
    JSON.stringify(lineItems) !== JSON.stringify(receipt.line_items);

  const computedSum = sumItems(lineItems);
  const totalNum = parseFloat(total);
  const showMismatch = !isNaN(totalNum) && lineItems.length > 0
    && Math.abs(computedSum - totalNum) > Math.max(0.1, totalNum * 0.01);

  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) => {
      const next = [...prev];
      if (field === 'name') {
        next[idx] = { ...next[idx], name: value };
      } else {
        next[idx] = { ...next[idx], amount: parseFloat(value) || 0 };
      }
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setLineItems((prev) => [...prev, { name: '', amount: 0 }]);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const updated = await saveReceipt(receipt.id, {
        merchant: merchant || null,
        date: date || null,
        line_items: lineItems,
        total: parseFloat(total) || null,
      });
      setSaveStatus('saved');
      onSaved?.(updated);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [receipt.id, merchant, date, lineItems, total, onSaved]);

  const handleDelete = async () => {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteReceipt(receipt.id);
      navigate('/receipts');
    } catch {
      setDeleting(false);
    }
  };

  const flags = receipt.confidence_flags;

  return (
    <div className="receipt-card">
      <div className="receipt-header">
        <div className="receipt-header-left">
          <h2 style={{ animation: 'slideInLeft 0.4s ease-out' }}>{merchant || 'Untitled Receipt'}</h2>
          {receipt.image_filename && (
            <div className="file-name" style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>{receipt.image_filename}</div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', opacity: 0.4, letterSpacing: '0.04em', textAlign: 'right', animation: 'fadeIn 0.5s ease-out 0.2s both' }}>
          {new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="receipt-tape" />

      <div className="receipt-body">
        <FlagBadges flags={flags} />

        <div className="fields-grid">
          <div className="field-group" style={{ animation: 'slideInLeft 0.4s ease-out' }}>
            <label>Merchant {flags.merchant_uncertain && <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>• uncertain</span>}</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks"
              className={flags.merchant_uncertain ? 'flagged' : ''}
              aria-label="Merchant name"
            />
            {!merchant && flags.partial_parse && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem', animation: 'fadeIn 0.3s ease-out' }}>✗ Not detected by AI — please fill in</div>
            )}
          </div>
          <div className="field-group" style={{ animation: 'slideInLeft 0.4s ease-out 0.1s both' }}>
            <label>Date {flags.date_uncertain && <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>• uncertain</span>}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={flags.date_uncertain ? 'flagged' : ''}
              aria-label="Receipt date"
            />
            {!date && flags.partial_parse && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem', animation: 'fadeIn 0.3s ease-out' }}>✗ Not detected by AI — please fill in</div>
            )}
          </div>
        </div>

        <div className="section-title">
          <span>Line Items</span>
          <span style={{ color: 'var(--ink-faint)' }}>{lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}</span>
        </div>

        {lineItems.length === 0 && flags.partial_parse && (
          <div style={{ padding: '0.75rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--ink)' }}>
            ⚠️ No items were detected. Add them manually or upload a clearer receipt photo.
          </div>
        )}

        <div className="line-items-list">
          {lineItems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem 1rem', 
              opacity: 0.6,
              animation: 'fadeIn 0.4s ease-out'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛒</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>No items to display</div>
            </div>
          ) : (
            lineItems.map((item, idx) => (
              <div 
                className="line-item-row" 
                key={idx}
                style={{ animation: `slideInLeft 0.3s ease-out ${idx * 0.05}s both` }}
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  placeholder="Item name"
                  className="item-input"
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                  step="0.01"
                  className="amount"
                  placeholder="0.00"
                />
                <button 
                  className="btn-remove" 
                  onClick={() => removeItem(idx)} 
                  title="Remove item"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  style={{ transition: 'transform 0.2s ease' }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <button 
          className="btn-add-item" 
          onClick={addItem}
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        >
          + Add line item
        </button>

        <div className="total-row" style={{ animation: 'slideUp 0.4s ease-out' }}>
          <span className="total-label">Total</span>
          <div>
            <div className="total-input-wrap">
              <span className="currency-sign">$</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                step="0.01"
                className={`total-input ${flags.total_mismatch || showMismatch ? 'flagged' : ''}`}
                placeholder="0.00"
              />
            </div>
            {showMismatch && (
              <div className="mismatch-hint" style={{ fontWeight: 500, animation: 'slideDown 0.3s ease-out' }}>
                ⚠️ Items sum to ${computedSum.toFixed(2)} but total is ${totalNum.toFixed(2)} (${Math.abs(computedSum - totalNum).toFixed(2)} difference). Fix items or total.
              </div>
            )}
          </div>
        </div>

        <div className="action-bar">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isDirty}
            title={!isDirty ? 'No changes to save' : 'Save all corrections'}
          >
            {saving ? '⏳ Saving…' : isDirty ? '✓ Save corrections' : '✓ All saved'}
          </button>

          <button className="btn btn-secondary" onClick={() => navigate('/receipts')}>
            ← All receipts
          </button>

          {saveStatus === 'saved' && (
            <span className="save-status" style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>✓ Saved to Postgres</span>
          )}
          {saveStatus === 'error' && (
            <span className="save-status" style={{ color: 'var(--accent)', fontWeight: 500 }}>✗ Save failed — try again</span>
          )}

          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Permanently delete this receipt"
          >
            {deleting ? '⏳ Deleting…' : '🗑 Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
