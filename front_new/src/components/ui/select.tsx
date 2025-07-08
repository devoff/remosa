import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  // Находим SelectContent среди всех children
  const selectContent = React.Children.toArray(children).find(child => 
    React.isValidElement(child) && child.type === SelectContent
  );

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child, { value, onValueChange, selectContent } as any)
        }
        // Не рендерим SelectContent напрямую - он рендерится только внутри SelectTrigger
        if (React.isValidElement(child) && child.type === SelectContent) {
          return null
        }
        return child
      })}
    </div>
  )
}

interface SelectTriggerProps {
  value?: string
  onValueChange?: (value: string) => void
  selectContent?: React.ReactElement
  children?: React.ReactNode
  className?: string
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ value, onValueChange, selectContent, children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedValue, setSelectedValue] = React.useState(value || '')

    const handleClick = () => {
      setIsOpen(!isOpen)
    }

    const handleSelect = (newValue: string) => {
      setSelectedValue(newValue)
      onValueChange?.(newValue)
      setIsOpen(false)
    }

    // Обновляем selectedValue при изменении value извне
    React.useEffect(() => {
      setSelectedValue(value || '');
    }, [value]);

    // Находим SelectValue среди children, чтобы показать placeholder
    let selectValueChild = React.Children.toArray(children).find(child =>
      React.isValidElement(child) && child.type === SelectValue
    );

    return (
      <div className="relative">
        <button
          ref={ref}
          type="button"
          onClick={handleClick}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {/* Показываем выбранное значение или placeholder */}
          {selectedValue
            ? <span>{selectedValue}</span>
            : selectValueChild || <span></span>
          }
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {isOpen && selectContent && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
            <div className="py-1">
              {/* Рендерим SelectContent с onSelect */}
              {React.cloneElement(selectContent, { onSelect: handleSelect } as any)}
            </div>
          </div>
        )}
      </div>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent: React.FC<{ 
  children?: React.ReactNode;
  onSelect?: (value: string) => void;
  className?: string;
}> = ({ children, onSelect, className }) => {
  return (
    <div className={cn("max-h-60 overflow-auto", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, { onSelect } as any)
        }
        return child
      })}
    </div>
  )
}

const SelectItem: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  onSelect?: (value: string) => void;
  className?: string;
}> = ({ value, children, onSelect, className }) => {
  const handleClick = () => {
    onSelect?.(value)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-700 focus:bg-gray-700 focus:text-gray-100",
        className
      )}
    >
      {children}
    </div>
  )
}

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span className="text-gray-400">{placeholder}</span>
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} 