import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastState } from "../context/ToastContext";

const STYLES = {
  success: {
    icon: CheckCircle2,
    classes: "bg-white border-green-200 text-stone-900",
    iconClass: "text-green-600",
  },
  error: {
    icon: XCircle,
    classes: "bg-white border-red-200 text-stone-900",
    iconClass: "text-red-600",
  },
  info: {
    icon: Info,
    classes: "bg-white border-stone-200 text-stone-900",
    iconClass: "text-brand-600",
  },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToastState();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => {
        const style = STYLES[t.type] ?? STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 animate-toast-in ${style.classes}`}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${style.iconClass}`} />
            <p className="text-sm flex-1">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}