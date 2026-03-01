/**
 * Stage — the aggregate root for current visual state.
 *
 * The Stage tracks what is currently on screen: which actors (controllable
 * components) are registered and which widgets have been spawned.
 * Pure functions operate on Stage, returning new Stage instances.
 */

import type { Action, SpawnDirective, CreateDirective, Scene } from "./scene"

/** Handler function registered by an actor for a specific action. */
export type ActionHandler = (args: Record<string, unknown>) => void

/** An actor registered on the stage — a controllable component. */
export interface Actor {
  readonly id: string
  readonly actions: ReadonlyMap<string, ActionHandler>
  readonly description?: string
}

/** A widget that has been spawned onto the stage by AI. */
export interface SpawnedWidget {
  readonly widget: string
  readonly data: Readonly<Record<string, unknown>>
  readonly id: string
}

/** The Stage aggregate — current state of all visible actors and widgets. */
export interface Stage {
  readonly actors: ReadonlyMap<string, Actor>
  readonly spawnedWidgets: ReadonlyMap<string, SpawnedWidget>
}

/** Create an empty stage. */
export function createEmptyStage(): Stage {
  return {
    actors: new Map(),
    spawnedWidgets: new Map(),
  }
}

/** Register an actor on the stage. Returns a new Stage. */
export function registerActor(stage: Stage, actor: Actor): Stage {
  const next = new Map(stage.actors)
  next.set(actor.id, actor)
  return { ...stage, actors: next }
}

/** Remove an actor from the stage. Returns a new Stage. */
export function unregisterActor(stage: Stage, id: string): Stage {
  const next = new Map(stage.actors)
  next.delete(id)
  return { ...stage, actors: next }
}

/** Result of applying a scene to a stage. */
export interface ApplyResult {
  readonly stage: Stage
  readonly errors: readonly ApplyError[]
}

export interface ApplyError {
  readonly type: "actor-not-found" | "action-not-found" | "widget-not-registered"
  readonly message: string
}

/**
 * Apply a scene's actions to the current stage.
 *
 * Dispatches each action to its target actor. Collects errors for
 * missing actors or actions rather than throwing (graceful degradation).
 */
export function applyActions(stage: Stage, actions: readonly Action[]): readonly ApplyError[] {
  const errors: ApplyError[] = []

  for (const action of actions) {
    const actor = stage.actors.get(action.target)
    if (!actor) {
      errors.push({
        type: "actor-not-found",
        message: `Actor "${action.target}" not found on stage`,
      })
      continue
    }

    const handler = actor.actions.get(action.do)
    if (!handler) {
      errors.push({
        type: "action-not-found",
        message: `Action "${action.do}" not found on actor "${action.target}"`,
      })
      continue
    }

    handler(action.args ?? {})
  }

  return errors
}

/** Add a spawned widget to the stage. Returns a new Stage. */
export function addSpawnedWidget(stage: Stage, directive: SpawnDirective): Stage {
  const id = directive.id ?? `spawn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const next = new Map(stage.spawnedWidgets)
  next.set(id, {
    widget: directive.widget,
    data: directive.data,
    id,
  })
  return { ...stage, spawnedWidgets: next }
}
