import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { BadgeComponent } from '../ui/badge.component';
import type { FormStatus, QuestionType, ResponseSource } from '../../core/data/types';
import { QUESTION_ICON } from '../../lib/question-types';

const STATUS_COLOR: Record<FormStatus, 'brand' | 'success' | 'warning' | 'gray'> = {
  rascunho: 'warning',
  publicado: 'success',
  encerrado: 'gray',
};

@Component({
  selector: 'app-survey-status',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-badge *transloco="let t" [color]="color()" [dot]="true">{{ t('statuses.' + status) }}</app-badge>
  `,
})
export class SurveyStatusComponent {
  @Input({ required: true }) status!: FormStatus;
  color() {
    return STATUS_COLOR[this.status];
  }
}

const SOURCE_ICON: Record<ResponseSource, string> = {
  link: 'link',
  email: 'mail',
  qr: 'qr',
  incorporado: 'code',
};

@Component({
  selector: 'app-source-badge',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-badge *transloco="let t" color="gray" [icon]="icon()">{{ t('sources.' + source) }}</app-badge>
  `,
})
export class SourceBadgeComponent {
  @Input({ required: true }) source!: ResponseSource;
  icon() {
    return SOURCE_ICON[this.source];
  }
}

@Component({
  selector: 'app-type-badge',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-badge *transloco="let t" color="brand" [icon]="icon()">{{ t('questionTypes.' + type) }}</app-badge>
  `,
})
export class TypeBadgeComponent {
  @Input({ required: true }) type!: QuestionType;
  icon() {
    return QUESTION_ICON[this.type];
  }
}
