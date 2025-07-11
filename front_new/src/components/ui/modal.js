import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
export const Modal = ({ open, onClose, children }) => {
    useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60", onClick: onClose, "aria-modal": "true", role: "dialog", children: _jsx("div", { className: "bg-gray-900 rounded-lg shadow-lg max-w-lg w-full mx-4 relative animate-fadeIn", onClick: e => e.stopPropagation(), children: children }) }));
};
