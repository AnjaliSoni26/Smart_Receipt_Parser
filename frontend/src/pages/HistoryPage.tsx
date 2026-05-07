import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReceipts } from '../api';
import type { Receipt, ConfidenceFlags } from '../types';

function hasWarnings(flags: ConfidenceFlags) {
  return flags.merchant_uncertain || flags.date_uncertain || flags.low_quality_image;
}

function hasErrors(flags: ConfidenceFlags) {
  return flags.partial_parse || flags.total_mismatch;
}

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts()
      .then(setReceipts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="loading-bar"><div className="loading-bar-inner" /></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Receipts</h1>
      <p className="page-subtitle">{receipts.length} saved · sorted by date added</p>

      {receipts.length === 0 ? (
        <div className="empty-state">
          <p>No receipts yet.</p>
          <span>Upload one to get started.</span>
        </div>
      ) : (
        <div className="history-list">
          {receipts.map((r) => (
            <Link key={r.id} to={`/receipts/${r.id}`} className="history-item">
              <div>
                <div className="history-item-merchant">
                  {r.merchant ?? <em style={{ opacity: 0.4 }}>Unknown merchant</em>}
                </div>
                <div className="history-item-meta">
                  {r.date ?? 'No date'} · {r.line_items.length} items · {r.image_filename ?? 'no file'}
                </div>
              </div>

              <div className="history-item-flags">
                {hasErrors(r.confidence_flags) && <div className="flag-dot error" title="Has errors" />}
                {hasWarnings(r.confidence_flags) && <div className="flag-dot warning" title="Has warnings" />}
              </div>

              <div className="history-item-total">
                {r.total != null ? `$${Number(r.total).toFixed(2)}` : '—'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
