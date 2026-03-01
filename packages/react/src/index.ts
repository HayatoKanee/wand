/**
 * @anthropic-ai/wand-react
 *
 * React bindings for Wand — hooks, components, and primitive renderers
 * for building AI-controlled UIs.
 */

// Provider
export { WandProvider } from "./provider"
export type { WandProviderProps } from "./provider"
export type { WandConfig } from "./context"

// Hooks
export { useWand } from "./hooks/use-wand"
export { useFeed } from "./hooks/use-feed"
export { useWandChat } from "./hooks/use-wand-chat"
export { useManualStage } from "./hooks/use-manual-stage"
export type { ManualStage } from "./hooks/use-manual-stage"

// Components
export { WandFeed } from "./components/feed"
export type { WandFeedProps } from "./components/feed"

// Primitive renderers
export { PrimitiveRenderer } from "./components/primitives/index"

// Widget registration
export { registerWidget, getRegisteredWidgets } from "./register-widget"
export type { RegisterWidgetOptions } from "./register-widget"

// Store types (for advanced usage)
export type { WandStore, WandState, WandActions, FeedItem, SceneEntry, WidgetRegistration } from "./store"
