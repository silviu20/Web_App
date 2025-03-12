/*
Exports the types for the app.
*/

export * from "./server-action-types"

// Action state type for server actions
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }

// Export optimization types
export * from "./optimization-types"
