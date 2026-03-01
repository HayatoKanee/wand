/**
 * @anthropic-ai/wand-core
 *
 * The framework-agnostic core of Wand.
 * Contains domain types, port interfaces, and orchestration logic.
 * Zero dependencies — pure TypeScript.
 */

// Domain: value objects, entities, aggregates
export {
  createActorId,
  createWidgetName,
  createPrimitiveType,
  createScene,
  createEmptyStage,
  registerActor,
  unregisterActor,
  applyActions,
  addSpawnedWidget,
  PRIMITIVE_TYPES,
  isBuiltinPrimitive,
} from "./domain"

export type {
  ActorId,
  WidgetName,
  PrimitiveType,
  Scene,
  Action,
  SpawnDirective,
  CreateDirective,
  Actor,
  ActionHandler,
  SpawnedWidget,
  Stage,
  ApplyResult,
  ApplyError,
  BuiltinPrimitiveType,
  PrimitiveProps,
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
} from "./domain"

// Ports: abstract interfaces for AI providers and UI frameworks
export type {
  AIPort,
  AIMessage,
  ActorSummary,
  WidgetSummary,
  StageContext,
  StagePort,
} from "./ports"

// Application: orchestration use cases
export type { OrchestratorDeps, SceneEvent, PromptBuilderOptions } from "./application"
export { orchestrateScene, buildStageContext, formatStageContext } from "./application"
