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

import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {filter, map, tap} from 'rxjs/operators';

import {Subscription} from 'rxjs/Subscription';
import {isArray, isNullOrUndefined, isObject} from 'util';
import {CollectionService, SearchService} from '../../../../core/rest';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {selectDocumentsByQuery} from '../../../../core/store/documents/documents.state';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {selectViewSearchConfig} from '../../../../core/store/views/views.state';
import {UserSettingsService} from '../../../../core/user-settings.service';
import {SizeType} from '../../../../shared/slider/size-type';

@Component({
  templateUrl: './search-documents.component.html',
  styleUrls: ['./search-documents.component.scss']
})
export class SearchDocumentsComponent implements OnInit, OnDestroy {

  @ViewChild('sTemplate')
  private sTempl: TemplateRef<any>;

  @ViewChild('mTemplate')
  private mTempl: TemplateRef<any>;

  @ViewChild('lTemplate')
  private lTempl: TemplateRef<any>;

  @ViewChild('xlTemplate')
  private xlTempl: TemplateRef<any>;

  public size: SizeType;
  public documents$: Observable<DocumentModel[]>;
  public expandedDocumentIds: string[] = [];

  private querySubscription: Subscription;
  private searchConfigSubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>,
              private collectionService: CollectionService,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    let userSettings = this.userSettingsService.getUserSettings();
    this.size = userSettings.searchSize ? userSettings.searchSize : SizeType.M;
    this.querySubscription = this.store.select(selectQuery)
      .pipe(
        filter(query => isNullOrUndefined(query)),
        map(query => ({...query, page: 0, pageSize: 100})), // TODO implement pagination logic
        tap(query => this.store.dispatch(new DocumentsAction.Get({query}))),
        tap(() => this.store.dispatch(new ViewsAction.ChangeSearchConfig({config: {expandedDocumentIds: []}})))
      ).subscribe();
    this.documents$ = this.store.select(selectDocumentsByQuery).pipe(
      map(documents => documents.filter(doc => doc.id))
    );
    this.searchConfigSubscription = this.store.select(selectViewSearchConfig)
      .subscribe(config => this.expandedDocumentIds = config.expandedDocumentIds.slice());
  }

  public ngOnDestroy() {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
    if (this.searchConfigSubscription) {
      this.searchConfigSubscription.unsubscribe();
    }
  }

  public onSizeChange(newSize: SizeType) {
    this.size = newSize;
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.searchSize = newSize;
    this.userSettingsService.updateUserSettings(userSettings);
  }

  public getTemplate(document: DocumentModel): TemplateRef<any> {
    if (this.isDocumentOpened(document)) {
      return this.xlTempl;
    }
    switch (this.size) {
      case SizeType.S:
        return this.sTempl;
      case SizeType.M:
        return this.mTempl;
      case SizeType.L:
        return this.lTempl;
      case SizeType.XL:
        return this.xlTempl;
      default:
        return this.mTempl;
    }
  }

  public isXlTemplatePresented(): boolean {
    return this.size === SizeType.XL;
  }

  public isDocumentOpened(document: DocumentModel): boolean {
    return this.expandedDocumentIds.includes(document.id);
  }

  public createDefaultAttributeHtml(document: DocumentModel): string {
    const data = document.data;
    if (isNullOrUndefined(data)) {
      return '';
    }
    return this.valueHtml(Object.values(data)[0]);
  }

  public toggleDocument(document: DocumentModel) {
    const newIds = this.isDocumentOpened(document) ? this.expandedDocumentIds.filter(id => id !== document.id)
      : [...this.expandedDocumentIds, document.id];
    this.store.dispatch(new ViewsAction.ChangeSearchConfig({config: {expandedDocumentIds: newIds}}));
  }

  public onLinkClick(document: DocumentModel) {
    // TODO
  }

  public onCommentClick(document: DocumentModel) {
    // TODO
  }

  public onDetailClick(document: DocumentModel) {
    // TODO
  }

  public createValuesHtml(document: DocumentModel): string {
    return this.getValues(document)
      .map(value => `<span class="search-documents-value">${value}</span>`)
      .join(', ');
  }

  private getValues(document: DocumentModel): string[] {
    if (isNullOrUndefined(document.data)) {
      return [];
    }
    return this.getValuesFromArray(Object.values(document.data));
  }

  private getValuesFromAny(value: any): string[] | string {
    if (isArray(value)) {
      return this.getValuesFromArray(value as any[]);
    } else if (isObject(value)) {
      return this.getValuesFromObject(value as Object);
    } else {
      return value as string;
    }
  }

  private getValuesFromArray(array: any[]): string[] {
    let values: string[] = [];
    for (let value of array) {
      values = values.concat(this.getValuesFromAny(value));
    }
    return values;
  }

  private getValuesFromObject(object: Object): string[] {
    return this.getValuesFromArray(Object.values(object));
  }

  public createEntriesHtml(document: DocumentModel): string {
    if (isNullOrUndefined(document.data)) {
      return '';
    }

    return this.entriesHtml(Object.entries(document.data), document);
  }

  private entriesHtml(entries: [string, any][], document?: DocumentModel): string {
    return entries
      .map(([key, value]) => `${this.attributeHtml(key, document)}${this.valueHtml(value)}`)
      .join(', ');
  }

  private attributeHtml(attribute: string, document: DocumentModel): string {
    return `<i class="${this.attributeHtmlClasses(attribute, document)}">${attribute}</i>: `;
  }

  private attributeHtmlClasses(attribute: string, document: DocumentModel): string {
    return `search-documents-attribute ${this.isDefaultAttribute(attribute, document) ? 'search-documents-default-attribute' : ''}`;
  }

  private isDefaultAttribute(attributeFullName: string, document: DocumentModel): boolean {
    return document && attributeFullName === document.collection.defaultAttributeId;
  }

  private valueHtml(value: any): string {
    if (isNullOrUndefined(value)) {
      return '';
    } else if (isArray(value)) {
      return `[${this.arrayHtml(value as any[])}]`;
    } else if (isObject(value)) {
      return `{${this.entriesHtml(Object.entries(value))}}`;
    } else {
      return `<span class="search-documents-value">${value.toString()}</span>`;
    }
  }

  private arrayHtml(array: any[]): string {
    let html = '';
    for (let i = 0; i < array.length; i++) {
      html += this.valueHtml(array[i]);
      if (i !== array.length - 1) {
        html += ', ';
      }
    }
    return html;
  }

}
