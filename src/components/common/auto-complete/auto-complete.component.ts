import {
  Component, Input, SimpleChanges, Output, EventEmitter, ElementRef, Renderer, ContentChild,
  style, state, animate, transition, trigger, keyframes
} from '@angular/core';
import {getActionToKey, filterItems, inactive} from './autocomplete-actions';
import {LumEditable} from './lum-editable';

@Component({
  selector: 'lum-auto-complete, [lum-auto-complete]',
  template: require('./auto-complete.component.html'),
  styles: [ require('./auto-complete.component.scss').toString() ],
  animations: [
    trigger('animateIn', [
      state('in', style({transform: 'translateX(0)', opacity: 1})),
      transition('void => *', [
        animate(300, keyframes([
          style({opacity: 0, transform: 'translateX(-100%)', offset: 0}),
          style({opacity: 1, transform: 'translateX(0)',     offset: 1.0})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({opacity: 1, transform: 'translateX(0)',     offset: 0}),
          style({opacity: 0, transform: 'translateX(-100%)',  offset: 1.0})
        ]))
      ])
    ]),
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(200, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(200, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})

export class AutoCompleteComponent {
  @Input() public source: any[];
  @Input() public modelData: any;
  @Input() public options: any;

  @Output() public modelDataChange: any = new EventEmitter();

  @ContentChild(LumEditable) private editableContent: LumEditable;

  public pickerVisible = false;
  public filteredSource: any[];

  private focusFunction: Function;
  private blurFunction: Function;
  private keydownFunction: Function;
  constructor(private renderer: Renderer) {
  }

  public onShowPicker() {
    this.pickerVisible = true;
  }

  public onHidePicker($event?) {
    if ($event && $event.relatedTarget) {
      if (!$event.relatedTarget.classList.contains('autocomplete-item')) {
        this.pickerVisible = false;
      }
    } else {
      this.pickerVisible = false;
    }
  }

  private filterSource() {
    this.filteredSource = this.source.filter(filterItems.bind(this));
  }

  private updateData(item) {
    this.onHidePicker();
    this.modelDataChange.emit(item[this.options.displayKey]);
  }

  public onKeyDown($event) {
    let keyCode = $event.keyCode || $event.which;
    let action = getActionToKey(keyCode);
    action.call(this, $event);
  }

  public onMouseOver() {
    inactive.call(this);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelData']) {
      inactive.call(this);
      this.filterSource();
    }
  }

  protected ngAfterContentInit() {
    this.focusFunction = this.renderer.listen(this.editableContent.el.nativeElement, 'focus', (event) => {
      this.onShowPicker();
    });
    this.blurFunction = this.renderer.listen(this.editableContent.el.nativeElement, 'blur', (event) => {
      this.onHidePicker(event);
    });
    this.keydownFunction = this.renderer.listen(this.editableContent.el.nativeElement, 'keydown', (event) => {
      this.onKeyDown(event);
    });
  }

  protected ngOnDestroy() {
    this.focusFunction();
    this.blurFunction();
    this.keydownFunction();
  }
}