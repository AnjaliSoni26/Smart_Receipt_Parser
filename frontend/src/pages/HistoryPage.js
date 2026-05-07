import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReceipts } from '../api';
function hasWarnings(flags) {
    return flags.merchant_uncertain || flags.date_uncertain || flags.low_quality_image;
}
function hasErrors(flags) {
    return flags.partial_parse || flags.total_mismatch;
}
export default function HistoryPage() {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchReceipts()
            .then(setReceipts)
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsx("div", { children: _jsx("div", { className: "loading-bar", children: _jsx("div", { className: "loading-bar-inner" }) }) }));
    }
    return (_jsxs("div", { children: [_jsx("h1", { className: "page-title", children: "Receipts" }), _jsxs("p", { className: "page-subtitle", children: [receipts.length, " saved \u00B7 sorted by date added"] }), receipts.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("p", { children: "No receipts yet." }), _jsx("span", { children: "Upload one to get started." })] })) : (_jsx("div", { className: "history-list", children: receipts.map((r) => (_jsxs(Link, { to: `/receipts/${r.id}`, className: "history-item", children: [_jsxs("div", { children: [_jsx("div", { className: "history-item-merchant", children: r.merchant ?? _jsx("em", { style: { opacity: 0.4 }, children: "Unknown merchant" }) }), _jsxs("div", { className: "history-item-meta", children: [r.date ?? 'No date', " \u00B7 ", r.line_items.length, " items \u00B7 ", r.image_filename ?? 'no file'] })] }), _jsxs("div", { className: "history-item-flags", children: [hasErrors(r.confidence_flags) && _jsx("div", { className: "flag-dot error", title: "Has errors" }), hasWarnings(r.confidence_flags) && _jsx("div", { className: "flag-dot warning", title: "Has warnings" })] }), _jsx("div", { className: "history-item-total", children: r.total != null ? `$${Number(r.total).toFixed(2)}` : '—' })] }, r.id))) }))] }));
}
