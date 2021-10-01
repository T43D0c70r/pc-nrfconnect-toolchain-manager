import { AnyAction } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { RootState } from './state';

export type TAction = ThunkAction<void, RootState, null, AnyAction>;
export type TDispatch = ThunkDispatch<RootState, null, AnyAction>;