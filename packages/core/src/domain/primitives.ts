/**
 * Built-in primitive types that AI can compose.
 *
 * These are the visual building blocks for Power 3: Create.
 * Each primitive has a type identifier and type-specific props.
 */

/** All built-in primitive type identifiers. */
export const PRIMITIVE_TYPES = [
  "text",
  "box",
  "arrow",
  "flow",
  "badge",
  "bar",
  "table",
  "list",
  "divider",
  "highlight",
  "annotation",
  "compare",
  "compass",
  "grid",
] as const

export type BuiltinPrimitiveType = (typeof PRIMITIVE_TYPES)[number]

/** Check if a string is a known built-in primitive type. */
export function isBuiltinPrimitive(type: string): type is BuiltinPrimitiveType {
  return (PRIMITIVE_TYPES as readonly string[]).includes(type)
}

// Type-specific prop interfaces for each primitive

export interface TextPrimitive {
  readonly type: "text"
  readonly content: string
  readonly style?: "normal" | "bold" | "muted" | "heading"
}

export interface BoxPrimitive {
  readonly type: "box"
  readonly title?: string
  readonly children?: readonly PrimitiveProps[]
  readonly border?: string
  readonly bg?: string
}

export interface ArrowPrimitive {
  readonly type: "arrow"
  readonly from: string
  readonly to: string
  readonly label?: string
  readonly color?: string
  readonly style?: "solid" | "dashed"
}

export interface FlowPrimitive {
  readonly type: "flow"
  readonly steps: readonly FlowStep[]
  readonly annotation?: string
}

export interface FlowStep {
  readonly label: string
  readonly color?: string
}

export interface BadgePrimitive {
  readonly type: "badge"
  readonly label: string
  readonly color?: string
  readonly variant?: "filled" | "outline"
}

export interface BarPrimitive {
  readonly type: "bar"
  readonly label: string
  readonly value: number
  readonly max?: number
  readonly color?: string
}

export interface TablePrimitive {
  readonly type: "table"
  readonly headers: readonly string[]
  readonly rows: readonly (readonly string[])[]
}

export interface ListPrimitive {
  readonly type: "list"
  readonly items: readonly string[]
  readonly ordered?: boolean
}

export interface DividerPrimitive {
  readonly type: "divider"
}

export interface HighlightPrimitive {
  readonly type: "highlight"
  readonly target: string
  readonly color?: string
  readonly effect?: "glow" | "pulse" | "border"
}

export interface AnnotationPrimitive {
  readonly type: "annotation"
  readonly target: string
  readonly content: string
  readonly position?: "top" | "bottom" | "left" | "right"
}

export interface ComparePrimitive {
  readonly type: "compare"
  readonly before: ComparePanel
  readonly after: ComparePanel
}

export interface ComparePanel {
  readonly label: string
  readonly bars?: Readonly<Record<string, number>>
  readonly items?: readonly string[]
}

export interface CompassPrimitive {
  readonly type: "compass"
  readonly directions: Readonly<Record<string, string>>
  readonly center?: string
}

export interface GridPrimitive {
  readonly type: "grid"
  readonly columns?: number
  readonly children: readonly PrimitiveProps[]
}

/** Union of all primitive prop types. */
export type PrimitiveProps =
  | TextPrimitive
  | BoxPrimitive
  | ArrowPrimitive
  | FlowPrimitive
  | BadgePrimitive
  | BarPrimitive
  | TablePrimitive
  | ListPrimitive
  | DividerPrimitive
  | HighlightPrimitive
  | AnnotationPrimitive
  | ComparePrimitive
  | CompassPrimitive
  | GridPrimitive
