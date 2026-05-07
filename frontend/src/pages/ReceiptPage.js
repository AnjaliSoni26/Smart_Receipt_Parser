import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchReceipt } from '../api';
import ReceiptEditor from '../components/ReceiptEditor';
export default function ReceiptPage() {
    const { id } = useParams();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!id)
            return;
        fetchReceipt(id)
            .then(setReceipt)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);
    if (loading) {
        return (_jsxs("div", { children: [_jsx("div", { className: "loading-bar", children: _jsx("div", { className: "loading-bar-inner" }) }), _jsx("p", { className: "loading-text", style: { marginTop: '1rem' }, children: "Loading receipt\u2026" })] }));
    }
    if (error || !receipt) {
        return _jsxs("div", { className: "error-banner", children: ["\u26A0 ", error ?? 'Receipt not found'] });
    }
    return (_jsx(ReceiptEditor, { receipt: receipt, onSaved: (updated) => setReceipt(updated) }));
}
