import { Component, ContentChild, contentChild, input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Directionality } from '@angular/cdk/bidi';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-card',
  imports: [CommonModule, MatCardModule, MatIcon],
  templateUrl: './card.component.html',
  standalone: true,
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  /**
   * Class to be applied at card level
   */
  cardClass = input<string>('');

  /**
   * To hide header from card
   */
  showHeader = input<boolean>(true);

  /**
   * To hide content from card
   */
  showContent = input<boolean>(true);

  /**
   * Class to be applied on card header
   */
  headerClass = input<string>('');

  /**
   * Class to be applied on action section of mat card
   */
  actionClass = input<string>('card-action');

  /**
   * Title of card. It will be visible at left side of card header
   */
  cardTitle = input<string>('');

  /**
   * Padding around card content. Default in px
   */
  padding = input<number>(24);

  /**
   * Template reference of header actions on right side
   */
  readonly headerOptionsTemplate = contentChild<TemplateRef<unknown>>('headerOptionsTemplate');

  /**
   * Template reference of header actions besides title at left
   */
  readonly headerTitleTemplate = contentChild<TemplateRef<unknown>>('headerTitleTemplate');

  /**
   * Template reference for mat-actions at bottom
   */
  @ContentChild('actionTemplate') actionTemplate: TemplateRef<unknown> | null = null;

  /**
   * Optional icon name for the card header (Material icon name)
   */
  icon = input<string | null>(null);

  /**
   * Icon position: 'left' | 'right'. Defaults to 'left'.
   */
  iconPosition = input<'left' | 'right'>('left');

  /**
   * Icon color (optional, e.g. 'primary', 'accent', 'warn', or custom)
   */
  iconColor = input<string>('');

  /**
   * RTL support: detect directionality if needed
   */
  constructor(public dir?: Directionality) {}

  get effectiveIconPosition(): 'left' | 'right' {
    if (!this.icon) return 'left';
    const pos = this.iconPosition();
    if (pos) {
      if (this.dir && this.dir.value === 'rtl') {
        return pos === 'left' ? 'right' : 'left';
      }
      return pos;
    }
    return 'left';
  }
}
