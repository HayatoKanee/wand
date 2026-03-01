/**
 * StagePort — the port through which the orchestrator interacts with the UI.
 *
 * React, Vue, or any framework implements this to wire AI commands to components.
 */

import type { Action, SpawnDirective, CreateDirective } from "../domain/scene"

export interface StagePort {
  /** Get IDs and available actions of all registered actors. */
  getActors(): ReadonlyMap<string, { readonly actions: readonly string[] }>

  /** Dispatch an action to a registered actor's handler. */
  dispatch(action: Action): void

  /** Mount a spawned widget into the feed. */
  mountWidget(directive: SpawnDirective): void

  /** Render a built-in primitive into the feed. */
  renderPrimitive(directive: CreateDirective): void
}
