import * as React from "react"
import { cn } from "@/lib/utils"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Steps({ className, children, ...props }: StepsProps) {
  const childrenArray = React.Children.toArray(children)
  const steps = childrenArray.map((step, index) => {
    if (React.isValidElement(step)) {
      return React.cloneElement(step, {
        stepNumber: index + 1,
        ...step.props,
      })
    }
    return step
  })

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {steps}
    </div>
  )
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  stepNumber?: number
  children?: React.ReactNode
}

export function Step({ title, stepNumber, className, children, ...props }: StepProps) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr] gap-x-4", className)} {...props}>
      <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-sm font-medium">
        {stepNumber}
      </div>
      <div className="space-y-2">
        <h3 className="font-medium leading-none">{title}</h3>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

