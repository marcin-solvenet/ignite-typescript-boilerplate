import { getType } from 'typesafe-actions';

export function createReducer<S, A extends { type: string }>(
  initialState: S,
  handlers: {
    [P in A['type']]?: A extends { type: P }
      ? (state: S, action: A) => S
      : never
  }
) {
  return (state: S = initialState, action: A): S => {
    if (handlers.hasOwnProperty(action.type)) {
      return (handlers as any)[action.type](state, action);
    } else {
      return state;
    }
  };
}
