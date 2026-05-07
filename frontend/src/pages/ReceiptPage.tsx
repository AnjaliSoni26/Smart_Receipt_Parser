import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchReceipt } from '../api';
import type { Receipt } from '../types';
import ReceiptEditor from '../components/ReceiptEditor';

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchReceipt(id)
      .then(setReceipt)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="loading-bar"><div className="loading-bar-inner" /></div>
        <p className="loading-text" style={{ marginTop: '1rem' }}>Loading receipt…</p>
      </div>
    );
  }

  if (error || !receipt) {
    return <div className="error-banner">⚠ {error ?? 'Receipt not found'}</div>;
  }

  return (
    <ReceiptEditor
      receipt={receipt}
      onSaved={(updated) => setReceipt(updated)}
    />
  );
}
