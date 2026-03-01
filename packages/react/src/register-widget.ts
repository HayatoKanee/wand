/**
 * registerWidget — register a component as a spawnable widget.
 *
 * The AI can spawn registered widgets by name with structured data.
 * Registration happens outside React (at module scope) so the widget
 * list is available before any component renders.
 *
 * @example
 * ```tsx
 * import { registerWidget } from "@anthropic-ai/wand-react"
 * import { DayunCard } from "./dayun-card"
 *
 * registerWidget("dayun-chart", {
 *   description: "大运走势图",
 *   component: DayunCard,
 * })
 * ```
 */

import type { WidgetRegistration } from "./store"

// Module-level registry (shared across all WandProvider instances)
const globalWidgetRegistry = new Map<string, WidgetRegistration>()

export interface RegisterWidgetOptions {
  description: string
  component: React.ComponentType<{ data: Record<string, unknown> }>
}

export function registerWidget(name: string, options: RegisterWidgetOptions): void {
  globalWidgetRegistry.set(name, {
    name,
    description: options.description,
    component: options.component,
  })
}

/** Get all registered widgets (used internally by WandProvider on mount). */
export function getRegisteredWidgets(): Map<string, WidgetRegistration> {
  return globalWidgetRegistry
}
