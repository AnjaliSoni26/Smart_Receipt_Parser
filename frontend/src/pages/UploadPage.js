import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReceipt } from '../api';
export default function UploadPage() {
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const navigate = useNavigate();
    const handleFile = useCallback(async (file) => {
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
                    imageUrl: e.target?.result,
                });
                setLoading(false);
            };
            reader.readAsDataURL(file);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
            setLoading(false);
            setImageFile(null);
        }
    }, []);
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file)
            handleFile(file);
    };
    return (_jsxs("div", { children: [error && (_jsxs("div", { className: "error-banner", style: { padding: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem' }, children: ["\u26A0\uFE0F ", error, error.includes('Upload failed') && ' Please try a different image or check your connection.'] })), preview ? (_jsxs("div", { className: "preview-container", style: { animation: 'fadeInScale 0.4s ease-out' }, children: [_jsx("h1", { className: "page-title", children: "\u2713 Receipt captured" }), _jsxs("div", { className: "preview-layout", children: [_jsxs("div", { className: "preview-image-section", style: { animation: 'slideInLeft 0.5s ease-out' }, children: [_jsx("div", { className: "preview-image-wrapper", children: _jsx("img", { src: preview.imageUrl, alt: "Receipt", className: "preview-image", style: { animation: 'fadeIn 0.4s ease-out' } }) }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.5rem', textAlign: 'center' }, children: "Original receipt image" })] }), _jsxs("div", { className: "preview-data-section", style: { animation: 'slideInLeft 0.5s ease-out 0.1s both' }, children: [_jsxs("div", { className: "preview-card", children: [_jsxs("div", { className: "preview-field", style: { animation: 'slideUp 0.4s ease-out 0.2s both' }, children: [_jsx("label", { children: "Merchant" }), _jsx("div", { className: "preview-value", children: preview.receipt.merchant || _jsx("span", { style: { color: 'var(--accent)' }, children: "(not detected \u2014 you can add it)" }) })] }), _jsxs("div", { className: "preview-field", style: { animation: 'slideUp 0.4s ease-out 0.25s both' }, children: [_jsx("label", { children: "Date" }), _jsx("div", { className: "preview-value", children: preview.receipt.date ? new Date(preview.receipt.date).toLocaleDateString() : _jsx("span", { style: { color: 'var(--accent)' }, children: "(not detected \u2014 you can add it)" }) })] }), _jsxs("div", { className: "preview-field", style: { animation: 'slideUp 0.4s ease-out 0.3s both' }, children: [_jsx("label", { children: "Total" }), _jsx("div", { className: "preview-value", style: { fontSize: '1.25rem', fontWeight: 600, background: 'linear-gradient(135deg, var(--paper-warm) 0%, var(--paper) 100%)' }, children: preview.receipt.total ? `$${Number(preview.receipt.total).toFixed(2)}` : _jsx("span", { style: { color: 'var(--accent)' }, children: "(not detected)" }) })] }), _jsxs("div", { className: "preview-field", style: { animation: 'slideUp 0.4s ease-out 0.35s both' }, children: [_jsxs("label", { children: ["Items (", preview.receipt.line_items.length, ")"] }), preview.receipt.line_items.length === 0 ? (_jsx("div", { style: { color: 'var(--accent)', fontSize: '0.9rem', padding: '0.5rem 0', animation: 'fadeIn 0.3s ease-out' }, children: "No items detected. You can add them after confirming." })) : (_jsx("div", { className: "preview-items-list", children: preview.receipt.line_items.map((item, idx) => (_jsxs("div", { className: "preview-item", style: { animation: `slideInLeft 0.3s ease-out ${0.4 + idx * 0.05}s both` }, children: [_jsx("span", { className: "item-name", children: item.name || '(unnamed)' }), _jsxs("span", { className: "item-amount", children: ["$", item.amount.toFixed(2)] })] }, idx))) }))] }), Object.values(preview.receipt.confidence_flags).some(Boolean) && (_jsxs("div", { className: "preview-warnings", style: { animation: 'slideDown 0.4s ease-out' }, children: [_jsx("div", { style: { fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 500 }, children: "\u26A0\uFE0F Issues detected \u2014 please review before confirming" }), preview.receipt.confidence_flags.merchant_uncertain && _jsx("div", { className: "warning-tag", children: "\u25C6 Merchant uncertain" }), preview.receipt.confidence_flags.date_uncertain && _jsx("div", { className: "warning-tag", children: "\u25C6 Date uncertain" }), preview.receipt.confidence_flags.low_quality_image && _jsx("div", { className: "warning-tag", children: "\uD83D\uDCF7 Low image quality" }), preview.receipt.confidence_flags.partial_parse && _jsx("div", { className: "warning-tag", children: "\u26A0\uFE0F Partial extraction \u2014 fields missing" }), preview.receipt.confidence_flags.total_mismatch && _jsx("div", { className: "warning-tag", children: "\uD83D\uDD22 Total \u2260 sum of items" })] }))] }), _jsxs("div", { className: "preview-actions", style: { animation: 'slideUp 0.4s ease-out 0.4s both' }, children: [_jsx("button", { className: "btn btn-primary", onClick: () => navigate(`/receipts/${preview.receipt.id}`), children: "\u2713 Confirm & Edit" }), _jsx("button", { className: "btn btn-secondary", onClick: () => {
                                                    setPreview(null);
                                                    setImageFile(null);
                                                    setError(null);
                                                }, children: "\u2715 Upload Different" })] })] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: `upload-area ${dragOver ? 'drag-over' : ''}`, onDragOver: (e) => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: onDrop, children: !loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "upload-icon", style: { animation: 'float 3s ease-in-out infinite' }, children: "\uD83E\uDDFE" }), _jsx("h2", { style: { animation: 'fadeIn 0.5s ease-out' }, children: "Drop a receipt photo here" }), _jsx("p", { style: { animation: 'fadeIn 0.5s ease-out 0.1s both' }, children: "or click to browse \u2014 JPG or PNG, up to 10MB" }), _jsx("input", { type: "file", accept: "image/jpeg,image/png", onChange: (e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                            handleFile(file);
                                    } })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "upload-icon", style: { opacity: 0.3, animation: 'pulse 1.5s ease-in-out infinite' }, children: "\uD83E\uDDFE" }), _jsx("h2", { style: { opacity: 0.4 }, children: "Extracting data\u2026" }), _jsx("div", { className: "loading-bar", style: { maxWidth: 300, margin: '1.5rem auto 0' }, children: _jsx("div", { className: "loading-bar-inner" }) }), _jsx("p", { className: "loading-text", children: "Gemini is reading your receipt" })] })) }), _jsx("div", { style: { marginTop: '2rem', padding: '1.25rem', background: 'var(--paper-warm)', borderRadius: 6, border: '1px solid var(--border)' }, children: _jsxs("div", { style: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', lineHeight: 1.8, letterSpacing: '0.02em' }, children: [_jsxs("div", { style: { marginBottom: '0.75rem' }, children: [_jsx("strong", { style: { color: 'var(--ink)' }, children: "WHAT GETS EXTRACTED:" }), " Merchant \u00B7 Date \u00B7 Line items (including tax, tip, discounts) \u00B7 Total."] }), _jsxs("div", { children: [_jsx("strong", { style: { color: 'var(--ink)' }, children: "EDGE CASES:" }), " Blurry image? Flagged before you confirm. Missing fields? Shown as empty\u2014you fill them in. Math doesn't add up? Detected live in the editor."] })] }) })] }))] }));
}
