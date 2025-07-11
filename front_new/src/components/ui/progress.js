import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Progress = ({ value, max = 100, className = '', showLabel = false }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    return (_jsxs("div", { className: className, children: [showLabel && (_jsxs("div", { className: "flex justify-between text-sm text-gray-600 mb-1", children: [_jsx("span", { children: "\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441" }), _jsxs("span", { children: [Math.round(percentage), "%"] })] })), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: `${percentage}%` } }) })] }));
};
