/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {createSelector} from '@ngrx/store';
import {Perspective} from '../../../view/perspectives/perspective';
import {AppState} from '../app.state';
import {QueryModel} from './query.model';
import {Workspace} from './workspace.model';

export interface NavigationState {

  query: QueryModel;
  workspace: Workspace;
  perspective?: Perspective;
  searchBoxHidden?: boolean;
  viewName?: string;
  linkCollectionIds?: string[];

}

export const initialNavigationState: NavigationState = {

  query: {},
  workspace: {},
  searchBoxHidden: false

};

export const selectNavigation = (state: AppState) => state.navigation;
export const selectQuery = createSelector(selectNavigation, (state: NavigationState) => state.query);
export const selectPerspective = createSelector(selectNavigation, (state: NavigationState) => state.perspective);
export const selectWorkspace = createSelector(selectNavigation, (state: NavigationState) => state.workspace);
export const selectLinkCollectionIds = createSelector(selectNavigation, (state: NavigationState) => state.linkCollectionIds);
