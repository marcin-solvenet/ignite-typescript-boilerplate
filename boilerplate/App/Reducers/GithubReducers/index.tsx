import { Action, AnyAction, Reducer } from 'redux';
import * as SI from 'seamless-immutable';
import { ActionType, createStandardAction, getType } from 'typesafe-actions';
import { createReducer } from '../../Lib/ReduxHelpers';

/* ------------- Types and Action Creators ------------- */
interface RequestParams {
  username: string;
}
interface SuccessParams {
  avatar: string;
}
const actions = {
  userRequest: createStandardAction('githubUserRequest')<RequestParams>(),
  userSuccess: createStandardAction('githubUserSuccess')<SuccessParams>(),
  userFailure: createStandardAction('githubUserFailure')<undefined>()
};

export const GithubActions = actions;

interface GithubState {
  avatar?: string | null;
  fetching?: boolean | null;
  error?: boolean | null;
  username?: string | null;
}

export type GithubAction = ActionType<typeof actions>;

export type ImmutableGithubState = SI.ImmutableObject<GithubState>;

/* ------------- Initial State ------------- */

export const INITIAL_STATE: ImmutableGithubState = SI.from({
  avatar: null,
  fetching: null,
  error: null,
  username: null
});

/* ------------- Reducers ------------- */

// request the avatar for a user
export const userRequest = (
  state: ImmutableGithubState,
  { payload }: ReturnType<typeof GithubActions.userRequest>
) =>
  payload
    ? state.merge({ fetching: true, username: payload.username, avatar: null })
    : state;

// successful avatar lookup
export const userSuccess = (
  state: ImmutableGithubState,
  { payload }: ReturnType<typeof GithubActions.userSuccess>
) =>
  payload
    ? state.merge({ fetching: false, error: null, avatar: payload.avatar })
    : state;

// failed to get the avatar
export const userFailure = (state: ImmutableGithubState) =>
  state.merge({ fetching: false, error: true, avatar: null });

/* ------------- Hookup Reducers To Types ------------- */

export const GithubReducer = createReducer<ImmutableGithubState, GithubAction>(
  INITIAL_STATE,
  {
    [getType(GithubActions.userRequest)]: userRequest,
    [getType(GithubActions.userSuccess)]: userSuccess,
    [getType(GithubActions.userFailure)]: userFailure
  }
);

export default GithubReducer;
