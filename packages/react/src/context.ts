/**
 * WandContext — React context for accessing the Wand store and config.
 */

import { createContext, useContext } from "react"
import type { AIPort } from "@anthropic-ai/wand-core"
import type { WandStore } from "./store"
import type { StoreApi } from "zustand/vanilla"

export const WandContext = createContext<StoreApi<WandStore> | null>(null)

export interface WandConfig {
  adapter: AIPort
  systemPrompt: string
}

export const WandConfigContext = createContext<WandConfig | null>(null)

export function useWandStore(): StoreApi<WandStore> {
  const store = useContext(WandContext)
  if (!store) {
    throw new Error("useWand* hooks must be used within a <WandProvider>")
  }
  return store
}

/** Returns the store or null if outside a WandProvider. */
export function useOptionalWandStore(): StoreApi<WandStore> | null {
  return useContext(WandContext)
}

/** Returns the adapter and systemPrompt from the nearest WandProvider. */
export function useWandConfig(): WandConfig {
  const config = useContext(WandConfigContext)
  if (!config) {
    throw new Error("useWandConfig must be used within a <WandProvider>")
  }
  return config
}
