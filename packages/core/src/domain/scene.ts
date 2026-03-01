/**
 * Scene — the core value object of Wand.
 *
 * A Scene is the structured output from an AI response.
 * It bundles all three powers (control, spawn, create) plus text narration.
 * Scenes are immutable once created.
 */

/** An action targeting an existing actor on stage. (Power 1: Control) */
export interface Action {
  readonly target: string
  readonly do: string
  readonly args?: Readonly<Record<string, unknown>>
}

/** A directive to spawn a registered widget with data. (Power 2: Spawn) */
export interface SpawnDirective {
  readonly widget: string
  readonly data: Readonly<Record<string, unknown>>
  readonly id?: string
}

/** A directive to create a visual from built-in primitives. (Power 3: Create) */
export interface CreateDirective {
  readonly type: string
  readonly [key: string]: unknown
}

/** A complete scene — one AI response rendered as a visual unit. */
export interface Scene {
  readonly actions: readonly Action[]
  readonly spawn: readonly SpawnDirective[]
  readonly create: readonly CreateDirective[]
  readonly text: string | undefined
  readonly suggestions: readonly string[]
}

/**
 * Validate and normalize raw AI output into a Scene.
 *
 * Throws if the input is structurally invalid.
 * Fills missing optional fields with defaults (empty arrays, undefined text).
 */
export function createScene(raw: unknown): Scene {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    throw new Error("Scene must be a non-null object")
  }

  const obj = raw as Record<string, unknown>

  const actions = validateActions(obj.actions)
  const spawn = validateSpawn(obj.spawn)
  const create = validateCreate(obj.create)
  const text = typeof obj.text === "string" ? obj.text : undefined
  const suggestions = validateSuggestions(obj.suggestions)

  return Object.freeze({ actions, spawn, create, text, suggestions })
}

function validateActions(raw: unknown): readonly Action[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) throw new Error("actions must be an array")

  return raw.map((item, i) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`actions[${i}] must be an object`)
    }
    const a = item as Record<string, unknown>
    if (typeof a.target !== "string") {
      throw new Error(`actions[${i}].target must be a string`)
    }
    if (typeof a.do !== "string") {
      throw new Error(`actions[${i}].do must be a string`)
    }
    return Object.freeze({
      target: a.target,
      do: a.do,
      ...(a.args !== undefined ? { args: a.args as Record<string, unknown> } : {}),
    }) as Action
  })
}

function validateSpawn(raw: unknown): readonly SpawnDirective[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) throw new Error("spawn must be an array")

  return raw.map((item, i) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`spawn[${i}] must be an object`)
    }
    const s = item as Record<string, unknown>
    if (typeof s.widget !== "string") {
      throw new Error(`spawn[${i}].widget must be a string`)
    }
    if (typeof s.data !== "object" || s.data === null) {
      throw new Error(`spawn[${i}].data must be an object`)
    }
    return Object.freeze({
      widget: s.widget,
      data: s.data as Record<string, unknown>,
      ...(typeof s.id === "string" ? { id: s.id } : {}),
    }) as SpawnDirective
  })
}

function validateCreate(raw: unknown): readonly CreateDirective[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) throw new Error("create must be an array")

  return raw.map((item, i) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`create[${i}] must be an object`)
    }
    const c = item as Record<string, unknown>
    if (typeof c.type !== "string") {
      throw new Error(`create[${i}].type must be a string`)
    }
    return Object.freeze({ ...c }) as CreateDirective
  })
}

function validateSuggestions(raw: unknown): readonly string[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) throw new Error("suggestions must be an array")
  return raw.filter((s): s is string => typeof s === "string")
}
