import { jsx as _jsx } from "react/jsx-runtime";
export const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled = false, className = '', type = 'button' }) => {
    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
        ghost: 'hover:bg-gray-100 text-gray-700'
    };
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };
    return (_jsx("button", { type: type, onClick: onClick, disabled: disabled, className: `inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`, children: children }));
};
