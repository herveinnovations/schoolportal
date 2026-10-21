import * as React from "react"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ value, onValueChange, children, className }) => (
  <RadioGroupContext.Provider value={{ value, onValueChange }}>
    <div className={className} role="radiogroup">{children}</div>
  </RadioGroupContext.Provider>
)

interface RadioGroupItemProps {
  value: string
  id: string
  className?: string
}

export const RadioGroupItem: React.FC<RadioGroupItemProps> = ({ value, id, className }) => {
  const context = React.useContext(RadioGroupContext)
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")
  const { value: selectedValue, onValueChange } = context
  return (
    <input type="radio" id={id} value={value} checked={selectedValue === value} onChange={() => onValueChange(value)}
      className={`w-4 h-4 text-emerald-700 focus:ring-2 focus:ring-emerald-600 ${className ?? ''}`} />
  )
}
