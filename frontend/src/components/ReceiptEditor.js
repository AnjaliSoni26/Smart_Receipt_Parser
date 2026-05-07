import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { saveReceipt, deleteReceipt } from '../api';
import { useNavigate } from 'react-router-dom';
function FlagBadges({ flags }) {
    const items = [];
    if (flags.low_quality_image)
        items.push({ label: 'Low image quality — verify carefully', type: 'warning', emoji: '📷' });
    if (flags.partial_parse)
        items.push({ label: 'Partial extraction — some fields were missed', type: 'error', emoji: '⚠️' });
    if (flags.merchant_uncertain)
        items.push({ label: 'Merchant uncertain', type: 'warning', emoji: '◆' });
    if (flags.date_uncertain)
        items.push({ label: 'Date uncertain', type: 'warning', emoji: '◆' });
    if (flags.total_mismatch)
        items.push({ label: 'Total ≠ sum of items', type: 'error', emoji: '🔢' });
    if (items.length === 0)
        return (_jsx("div", { className: "flags-list", style: { padding: '0.75rem 1rem', background: 'rgba(76, 175, 80, 0.08)', borderRadius: 6, border: '1px solid rgba(76, 175, 80, 0.2)', animation: 'fadeInScale 0.4s ease-out' }, children: _jsx("span", { style: { fontSize: '0.85rem', color: 'var(--ink-faint)' }, children: "\u2713 All systems go \u2014 no issues detected" }) }));
    return (_jsx("div", { className: "flags-list", children: items.map((f, idx) => (_jsxs("span", { className: `flag ${f.type}`, title: f.label, style: { animation: `slideInLeft 0.3s ease-out ${idx * 0.08}s both` }, children: [f.emoji, " ", f.label] }, f.label))) }));
}
function sumItems(items) {
    return items.reduce((acc, i) => acc + (i.amount || 0), 0);
}
export default function ReceiptEditor({ receipt, onSaved }) {
    const navigate = useNavigate();
    const [merchant, setMerchant] = useState(receipt.merchant ?? '');
    const [date, setDate] = useState(receipt.date ?? '');
    const [lineItems, setLineItems] = useState(receipt.line_items);
    const [total, setTotal] = useState(receipt.total?.toString() ?? '');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [deleting, setDeleting] = useState(false);
    const isDirty = merchant !== (receipt.merchant ?? '') ||
        date !== (receipt.date ?? '') ||
        total !== (receipt.total?.toString() ?? '') ||
        JSON.stringify(lineItems) !== JSON.stringify(receipt.line_items);
    const computedSum = sumItems(lineItems);
    const totalNum = parseFloat(total);
    const showMismatch = !isNaN(totalNum) && lineItems.length > 0
        && Math.abs(computedSum - totalNum) > Math.max(0.1, totalNum * 0.01);
    const updateItem = (idx, field, value) => {
        setLineItems((prev) => {
            const next = [...prev];
            if (field === 'name') {
                next[idx] = { ...next[idx], name: value };
            }
            else {
                next[idx] = { ...next[idx], amount: parseFloat(value) || 0 };
            }
            return next;
        });
    };
    const removeItem = (idx) => {
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
        }
        catch {
            setSaveStatus('error');
        }
        finally {
            setSaving(false);
        }
    }, [receipt.id, merchant, date, lineItems, total, onSaved]);
    const handleDelete = async () => {
        if (!confirm('Delete this receipt? This cannot be undone.'))
            return;
        setDeleting(true);
        try {
            await deleteReceipt(receipt.id);
            navigate('/receipts');
        }
        catch {
            setDeleting(false);
        }
    };
    const flags = receipt.confidence_flags;
    return (_jsxs("div", { className: "receipt-card", children: [_jsxs("div", { className: "receipt-header", children: [_jsxs("div", { className: "receipt-header-left", children: [_jsx("h2", { style: { animation: 'slideInLeft 0.4s ease-out' }, children: merchant || 'Untitled Receipt' }), receipt.image_filename && (_jsx("div", { className: "file-name", style: { animation: 'fadeIn 0.5s ease-out 0.1s both' }, children: receipt.image_filename }))] }), _jsx("div", { style: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', opacity: 0.4, letterSpacing: '0.04em', textAlign: 'right', animation: 'fadeIn 0.5s ease-out 0.2s both' }, children: new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })] }), _jsx("div", { className: "receipt-tape" }), _jsxs("div", { className: "receipt-body", children: [_jsx(FlagBadges, { flags: flags }), _jsxs("div", { className: "fields-grid", children: [_jsxs("div", { className: "field-group", style: { animation: 'slideInLeft 0.4s ease-out' }, children: [_jsxs("label", { children: ["Merchant ", flags.merchant_uncertain && _jsx("span", { style: { color: 'var(--accent)', fontSize: '0.8rem' }, children: "\u2022 uncertain" })] }), _jsx("input", { type: "text", value: merchant, onChange: (e) => setMerchant(e.target.value), placeholder: "e.g. Starbucks", className: flags.merchant_uncertain ? 'flagged' : '', "aria-label": "Merchant name" }), !merchant && flags.partial_parse && (_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem', animation: 'fadeIn 0.3s ease-out' }, children: "\u2717 Not detected by AI \u2014 please fill in" }))] }), _jsxs("div", { className: "field-group", style: { animation: 'slideInLeft 0.4s ease-out 0.1s both' }, children: [_jsxs("label", { children: ["Date ", flags.date_uncertain && _jsx("span", { style: { color: 'var(--accent)', fontSize: '0.8rem' }, children: "\u2022 uncertain" })] }), _jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: flags.date_uncertain ? 'flagged' : '', "aria-label": "Receipt date" }), !date && flags.partial_parse && (_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem', animation: 'fadeIn 0.3s ease-out' }, children: "\u2717 Not detected by AI \u2014 please fill in" }))] })] }), _jsxs("div", { className: "section-title", children: [_jsx("span", { children: "Line Items" }), _jsxs("span", { style: { color: 'var(--ink-faint)' }, children: [lineItems.length, " ", lineItems.length === 1 ? 'item' : 'items'] })] }), lineItems.length === 0 && flags.partial_parse && (_jsx("div", { style: { padding: '0.75rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--ink)' }, children: "\u26A0\uFE0F No items were detected. Add them manually or upload a clearer receipt photo." })), _jsx("div", { className: "line-items-list", children: lineItems.length === 0 ? (_jsxs("div", { style: {
                                textAlign: 'center',
                                padding: '2rem 1rem',
                                opacity: 0.6,
                                animation: 'fadeIn 0.4s ease-out'
                            }, children: [_jsx("div", { style: { fontSize: '1.5rem', marginBottom: '0.5rem' }, children: "\uD83D\uDED2" }), _jsx("div", { style: { fontSize: '0.85rem', color: 'var(--ink-faint)' }, children: "No items to display" })] })) : (lineItems.map((item, idx) => (_jsxs("div", { className: "line-item-row", style: { animation: `slideInLeft 0.3s ease-out ${idx * 0.05}s both` }, children: [_jsx("input", { type: "text", value: item.name, onChange: (e) => updateItem(idx, 'name', e.target.value), placeholder: "Item name", className: "item-input" }), _jsx("input", { type: "number", value: item.amount, onChange: (e) => updateItem(idx, 'amount', e.target.value), step: "0.01", className: "amount", placeholder: "0.00" }), _jsx("button", { className: "btn-remove", onClick: () => removeItem(idx), title: "Remove item", onMouseEnter: (e) => (e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)'), onMouseLeave: (e) => (e.currentTarget.style.transform = 'scale(1)'), style: { transition: 'transform 0.2s ease' }, children: "\u00D7" })] }, idx)))) }), _jsx("button", { className: "btn-add-item", onClick: addItem, style: { animation: 'fadeIn 0.4s ease-out' }, children: "+ Add line item" }), _jsxs("div", { className: "total-row", style: { animation: 'slideUp 0.4s ease-out' }, children: [_jsx("span", { className: "total-label", children: "Total" }), _jsxs("div", { children: [_jsxs("div", { className: "total-input-wrap", children: [_jsx("span", { className: "currency-sign", children: "$" }), _jsx("input", { type: "number", value: total, onChange: (e) => setTotal(e.target.value), step: "0.01", className: `total-input ${flags.total_mismatch || showMismatch ? 'flagged' : ''}`, placeholder: "0.00" })] }), showMismatch && (_jsxs("div", { className: "mismatch-hint", style: { fontWeight: 500, animation: 'slideDown 0.3s ease-out' }, children: ["\u26A0\uFE0F Items sum to $", computedSum.toFixed(2), " but total is $", totalNum.toFixed(2), " ($", Math.abs(computedSum - totalNum).toFixed(2), " difference). Fix items or total."] }))] })] }), _jsxs("div", { className: "action-bar", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, disabled: saving || !isDirty, title: !isDirty ? 'No changes to save' : 'Save all corrections', children: saving ? '⏳ Saving…' : isDirty ? '✓ Save corrections' : '✓ All saved' }), _jsx("button", { className: "btn btn-secondary", onClick: () => navigate('/receipts'), children: "\u2190 All receipts" }), saveStatus === 'saved' && (_jsx("span", { className: "save-status", style: { color: 'var(--ink-faint)', fontWeight: 500 }, children: "\u2713 Saved to Postgres" })), saveStatus === 'error' && (_jsx("span", { className: "save-status", style: { color: 'var(--accent)', fontWeight: 500 }, children: "\u2717 Save failed \u2014 try again" })), _jsx("button", { className: "btn btn-danger", onClick: handleDelete, disabled: deleting, title: "Permanently delete this receipt", children: deleting ? '⏳ Deleting…' : '🗑 Delete' })] })] })] }));
}
