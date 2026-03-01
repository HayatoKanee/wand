/**
 * Branded types for compile-time safety.
 *
 * Prevents accidentally passing an ActorId where a WidgetName is expected.
 * Uses intersection with a phantom brand field that exists only at the type level.
 */

declare const __brand: unique symbol

type Brand<T, B extends string> = T & { readonly [__brand]: B }

/** Unique identifier for a registered actor (component on stage). */
export type ActorId = Brand<string, "ActorId">

/** Name of a registered spawnable widget. */
export type WidgetName = Brand<string, "WidgetName">

/** Type identifier for a built-in primitive. */
export type PrimitiveType = Brand<string, "PrimitiveType">

// Factory functions — the only way to create branded values
export function createActorId(id: string): ActorId {
  return id as ActorId
}

export function createWidgetName(name: string): WidgetName {
  return name as WidgetName
}

export function createPrimitiveType(type: string): PrimitiveType {
  return type as PrimitiveType
}
