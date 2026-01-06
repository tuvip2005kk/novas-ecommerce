"use client";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastProps {
    id: string;
    message: string;
    type?: "success" | "error" | "info";
    duration?: number;
    onClose: (id: string) => void;
}

function Toast({ id, message, type = "info", duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => onClose(id), duration);
        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle className="h-5 w-5" />,
        error: <AlertCircle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />
    };

    const colors = {
        success: "bg-green-50 text-green-800 border-green-200",
        error: "bg-red-50 text-red-800 border-red-200",
        info: "bg-blue-50 text-blue-800 border-blue-200"
    };

    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${colors[type]} animate-slide-in`}>
            {icons[type]}
            <p className="flex-1 font-medium">{message}</p>
            <button onClick={() => onClose(id)} className="p-1 hover:bg-black/10 rounded">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[], onClose: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = (message: string, type: "success" | "error" | "info" = "info", duration = 3000) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, duration, onClose: removeToast }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, showToast, removeToast };
}
