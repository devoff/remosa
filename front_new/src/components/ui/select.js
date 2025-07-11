import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
const Select = ({ value, onValueChange, children }) => {
    // Находим SelectContent среди всех children
    const selectContent = React.Children.toArray(children).find(child => React.isValidElement(child) && child.type === SelectContent);
    return (_jsx("div", { className: "relative", children: React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectTrigger) {
                return React.cloneElement(child, { value, onValueChange, selectContent });
            }
            // Не рендерим SelectContent напрямую - он рендерится только внутри SelectTrigger
            if (React.isValidElement(child) && child.type === SelectContent) {
                return null;
            }
            return child;
        }) }));
};
const SelectTrigger = React.forwardRef(({ value, onValueChange, selectContent, children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value || '');
    const handleClick = () => {
        setIsOpen(!isOpen);
    };
    const handleSelect = (newValue) => {
        setSelectedValue(newValue);
        onValueChange?.(newValue);
        setIsOpen(false);
    };
    // Обновляем selectedValue при изменении value извне
    React.useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);
    // Находим SelectValue среди children, чтобы показать placeholder
    let selectValueChild = React.Children.toArray(children).find(child => React.isValidElement(child) && child.type === SelectValue);
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { ref: ref, type: "button", onClick: handleClick, className: cn("flex h-10 w-full items-center justify-between rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50", className), ...props, children: [selectedValue
                        ? _jsx("span", { children: selectedValue })
                        : selectValueChild || _jsx("span", {}), _jsx(ChevronDown, { className: "h-4 w-4 opacity-50" })] }), isOpen && selectContent && (_jsx("div", { className: "absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg", children: _jsx("div", { className: "py-1", children: React.cloneElement(selectContent, { onSelect: handleSelect }) }) }))] }));
});
SelectTrigger.displayName = "SelectTrigger";
const SelectContent = ({ children, onSelect, className }) => {
    return (_jsx("div", { className: cn("max-h-60 overflow-auto", className), children: React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectItem) {
                return React.cloneElement(child, { onSelect });
            }
            return child;
        }) }));
};
const SelectItem = ({ value, children, onSelect, className }) => {
    const handleClick = () => {
        onSelect?.(value);
    };
    return (_jsx("div", { onClick: handleClick, className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-700 focus:bg-gray-700 focus:text-gray-100", className), children: children }));
};
const SelectValue = ({ placeholder }) => {
    return _jsx("span", { className: "text-gray-400", children: placeholder });
};
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, };
