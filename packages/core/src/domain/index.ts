// Domain layer public API

// Value objects
export type { ActorId, WidgetName, PrimitiveType } from "./types"
export { createActorId, createWidgetName, createPrimitiveType } from "./types"

// Scene (AI response structure)
export type { Scene, Action, SpawnDirective, CreateDirective } from "./scene"
export { createScene } from "./scene"

// Stage (current visual state)
export type { Actor, ActionHandler, SpawnedWidget, Stage, ApplyResult, ApplyError } from "./stage"
export {
  createEmptyStage,
  registerActor,
  unregisterActor,
  applyActions,
  addSpawnedWidget,
} from "./stage"

// Primitives
export type { BuiltinPrimitiveType, PrimitiveProps } from "./primitives"
export type {
  TextPrimitive,
  BoxPrimitive,
  ArrowPrimitive,
  FlowPrimitive,
  FlowStep,
  BadgePrimitive,
  BarPrimitive,
  TablePrimitive,
  ListPrimitive,
  DividerPrimitive,
  HighlightPrimitive,
  AnnotationPrimitive,
  ComparePrimitive,
  ComparePanel,
  CompassPrimitive,
  GridPrimitive,
} from "./primitives"
export { PRIMITIVE_TYPES, isBuiltinPrimitive } from "./primitives"
