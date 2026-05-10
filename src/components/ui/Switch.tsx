import { motion } from "framer-motion"
import { cn } from "../../utils/cn"

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function Switch({ checked, onChange, className }: SwitchProps) {
  return (
    <div
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-input",
        className
      )}
      onClick={() => onChange(!checked)}
    >
      <motion.div
        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  )
}
