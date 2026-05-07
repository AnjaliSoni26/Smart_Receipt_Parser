const BASE = '/api';
export async function uploadReceipt(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${BASE}/receipts`, { method: 'POST', body: form });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? 'Upload failed');
    }
    return res.json();
}
export async function fetchReceipts() {
    const res = await fetch(`${BASE}/receipts`);
    if (!res.ok)
        throw new Error('Failed to fetch receipts');
    return res.json();
}
export async function fetchReceipt(id) {
    const res = await fetch(`${BASE}/receipts/${id}`);
    if (!res.ok)
        throw new Error('Receipt not found');
    return res.json();
}
export async function saveReceipt(id, updates) {
    const res = await fetch(`${BASE}/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok)
        throw new Error('Save failed');
    return res.json();
}
export async function deleteReceipt(id) {
    const res = await fetch(`${BASE}/receipts/${id}`, { method: 'DELETE' });
    if (!res.ok)
        throw new Error('Delete failed');
}
