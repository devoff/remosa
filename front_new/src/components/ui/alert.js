import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const alertVariants = cva("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", {
    variants: {
        variant: {
            default: "bg-background text-foreground",
            destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
            error: "border-red-500/50 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-50 [&>svg]:text-red-600",
            success: "border-green-500/50 bg-green-50 text-green-900 dark:border-green-500 dark:bg-green-950 dark:text-green-50 [&>svg]:text-green-600",
            warning: "border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-50 [&>svg]:text-yellow-600",
            info: "border-blue-500/50 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-50 [&>svg]:text-blue-600",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (_jsx("div", { ref: ref, role: "alert", className: cn(alertVariants({ variant }), className), ...props })));
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx("h5", { ref: ref, className: cn("mb-1 font-medium leading-none tracking-tight", className), ...props })));
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props })));
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertTitle, AlertDescription };
