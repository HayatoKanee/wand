/**
 * WandProvider — the root context provider for Wand.
 *
 * Wraps your app (or a section of it) to enable AI-controlled UI.
 * Creates the Zustand store and makes it available to all useWand hooks.
 *
 * @example
 * ```tsx
 * import { WandProvider } from "@anthropic-ai/wand-react"
 * import { AnthropicAdapter } from "@anthropic-ai/wand-adapter-anthropic"
 *
 * const adapter = new AnthropicAdapter({ apiKey: "..." })
 *
 * export default function App() {
 *   return (
 *     <WandProvider adapter={adapter} systemPrompt="You are a BaZi assistant.">
 *       <YourApp />
 *     </WandProvider>
 *   )
 * }
 * ```
 */

import { useEffect, useRef, type ReactNode } from "react"
import type { AIPort } from "@anthropic-ai/wand-core"
import { WandContext } from "./context"
import { createWandStore } from "./store"
import { getRegisteredWidgets } from "./register-widget"
import type { StoreApi } from "zustand/vanilla"
import type { WandStore } from "./store"

export interface WandProviderProps {
  children: ReactNode
  adapter: AIPort
  systemPrompt?: string
}

export function WandProvider({ children, adapter, systemPrompt }: WandProviderProps) {
  const storeRef = useRef<StoreApi<WandStore> | null>(null)

  if (storeRef.current === null) {
    storeRef.current = createWandStore()
  }

  // Sync module-level widget registrations into the store on mount
  useEffect(() => {
    const store = storeRef.current!
    for (const [, reg] of getRegisteredWidgets()) {
      store.getState().registerWidget(reg)
    }
  }, [])

  return (
    <WandContext value={storeRef.current}>
      {children}
    </WandContext>
  )
}
