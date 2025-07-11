import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Tooltip = ({ content, children }) => {
    const [visible, setVisible] = React.useState(false);
    return (_jsxs("span", { className: "relative inline-block", onMouseEnter: () => setVisible(true), onMouseLeave: () => setVisible(false), children: [children, visible && (_jsx("span", { className: "absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-900 text-gray-100 text-xs whitespace-nowrap shadow-lg border border-gray-700", children: content }))] }));
};
