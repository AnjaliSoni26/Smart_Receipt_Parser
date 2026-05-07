import { useState, useCallback } from 'react';
import type { Receipt, LineItem, ConfidenceFlags } from '../types';
import { saveReceipt, deleteReceipt } from '../api';
import { useNavigate } from 'react-router-dom';

interface Props {
  receipt: Receipt;
  onSaved?: (updated: Receipt) => void;
}

function FlagBadges({ flags }: { flags: ConfidenceFlags }) {
  const items: { label: string; type: 'warning' | 'error' }[] = [];
  if (flags.low_quality_image) items.push({ label: 'Low image quality', type: 'warning' });
  if (flags.partial_parse) items.push({ label: 'Partial extraction', type: 'error' });
  if (flags.merchant_uncertain) items.push({ label: 'Merchant uncertain', type: 'warning' });
  if (flags.date_uncertain) items.push({ label: 'Date uncertain', type: 'warning' });
  if (flags.total_mismatch) items.push({ label: 'Total ≠ sum of items', type: 'error' });

  if (items.length === 0) return null;
  return (
    <div className="flags-list">
      {items.map((f) => (
        <span key={f.label} className={`flag ${f.type}`}>{f.label}</span>
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
          <h2>{merchant || 'Untitled Receipt'}</h2>
          {receipt.image_filename && (
            <div className="file-name">{receipt.image_filename}</div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', opacity: 0.4, letterSpacing: '0.04em', textAlign: 'right' }}>
          {new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="receipt-tape" />

      <div className="receipt-body">
        <FlagBadges flags={flags} />

        <div className="fields-grid">
          <div className="field-group">
            <label>Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks"
              className={flags.merchant_uncertain ? 'flagged' : ''}
            />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={flags.date_uncertain ? 'flagged' : ''}
            />
          </div>
        </div>

        <div className="section-title">
          <span>Line Items</span>
          <span style={{ color: 'var(--ink-faint)' }}>{lineItems.length} items</span>
        </div>

        <div className="line-items-list">
          {lineItems.map((item, idx) => (
            <div className="line-item-row" key={idx}>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                placeholder="Item name"
              />
              <input
                type="number"
                value={item.amount}
                onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                step="0.01"
                className="amount"
                placeholder="0.00"
              />
              <button className="btn-remove" onClick={() => removeItem(idx)} title="Remove item">
                ×
              </button>
            </div>
          ))}
        </div>

        <button className="btn-add-item" onClick={addItem}>
          + Add line item
        </button>

        <div className="total-row">
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
              <div className="mismatch-hint">
                Items sum to ${computedSum.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="action-bar">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving…' : 'Save corrections'}
          </button>

          <button className="btn btn-secondary" onClick={() => navigate('/receipts')}>
            All receipts
          </button>

          {saveStatus === 'saved' && (
            <span className="save-status">✓ Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="save-status" style={{ color: 'var(--accent)' }}>✗ Save failed</span>
          )}

          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
