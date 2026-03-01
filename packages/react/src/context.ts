/**
 * WandContext — React context for accessing the Wand store.
 */

import { createContext, useContext } from "react"
import type { WandStore } from "./store"
import type { StoreApi } from "zustand/vanilla"

export const WandContext = createContext<StoreApi<WandStore> | null>(null)

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
