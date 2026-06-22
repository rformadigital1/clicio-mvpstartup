import { Check } from "lucide-react"

const STEPS = ["Día y Hora", "Servicios", "Tus Datos", "Confirmar"]

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted
                    ? "bg-green-600 text-white"
                    : isCurrent
                      ? "bg-azul-rey text-white"
                      : "bg-bg-superficie text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`text-[10px] leading-tight text-center max-w-14 ${
                  isCurrent ? "text-azul-rey font-semibold" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-px mx-1 mt-[-1.25rem] ${
                  i < currentStep ? "bg-green-600" : "bg-border-subtil"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
