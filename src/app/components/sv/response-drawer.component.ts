import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { Contact, Question, Response, Survey } from '../../core/data/types';
import { DrawerComponent } from '../ui/drawer.component';
import { AvatarComponent } from '../ui/avatar.component';
import { BadgeComponent } from '../ui/badge.component';
import { IconComponent } from '../ui/icon-base.component';
import { answerToText, answersToMap, contactById, formatSeconds, isHiddenQuestion, ordered } from '../../core/data/query';
import { formatDateTime } from '../../lib/format';
import { useLang } from '../../lib/i18n';
import { SourceBadgeComponent } from './status-pill.component';

/** Resposta completa, pergunta a pergunta, com o que foi pulado marcado. */
@Component({
  selector: 'app-response-drawer',
  standalone: true,
  imports: [
    TranslocoModule,
    DrawerComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    SourceBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-drawer
        [open]="open()"
        (closed)="closed.emit()"
        [title]="t('results.responseTitle', { id: response()?.id ?? 0 })"
        [subtitle]="subtitle()"
        width="max-w-xl"
      >
        @if (response(); as response) {
          @if (survey(); as survey) {
            <div class="flex flex-col gap-5">
              <div class="flex flex-wrap items-center gap-2">
                <app-source-badge [source]="response.source" />
                <app-badge [color]="response.completed ? 'success' : 'warning'" [dot]="true">
                  {{ t(response.completed ? 'results.completed' : 'results.partial') }}
                </app-badge>
                <app-badge color="gray" icon="clock">{{ duration(response.durationSec) }}</app-badge>
              </div>

              @if (contact(); as contact) {
                <div class="flex items-center gap-3 rounded-xl border border-themed p-3">
                  <app-avatar [src]="contact.avatar" [name]="contact.name" size="sm" />
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-heading">{{ contact.name }}</p>
                    <p class="truncate text-xs text-muted">{{ contact.email }}</p>
                  </div>
                </div>
              }

              <ol class="flex flex-col gap-4">
                @for (question of questions(); track question.id; let index = $index) {
                  <li class="min-w-0 border-b border-themed pb-4 last:border-0 last:pb-0">
                    <p class="text-xs text-muted">
                      {{ t('results.questionNumber', { index: index + 1 }) }} ·
                      {{ t('questionTypes.' + question.type) }}
                    </p>
                    <p class="mt-0.5 text-sm font-medium break-words text-heading">{{ question.title }}</p>

                    @if (hasValue(question)) {
                      @if (isMatrix(question)) {
                        <ul class="mt-2 flex flex-col gap-1">
                          @for (row of matrixRows(question); track row.row) {
                            <li class="flex flex-wrap items-center gap-2 text-sm">
                              <span class="text-muted">{{ row.row }}:</span>
                              <span class="font-medium text-body">{{ row.column }}</span>
                            </li>
                          }
                        </ul>
                      } @else {
                        <p class="mt-2 text-sm break-words text-body">{{ text(question) }}</p>
                      }
                    } @else {
                      <p class="mt-2 flex items-center gap-1.5 text-sm text-muted">
                        <app-icon [name]="hidden(question) ? 'git-branch' : 'minus'" [size]="14" />
                        {{ t(hidden(question) ? 'results.hiddenByLogic' : 'results.skipped') }}
                      </p>
                    }
                  </li>
                }
              </ol>
            </div>
          }
        }
      </app-drawer>
    </ng-container>
  `,
})
export class ResponseDrawerComponent {
  readonly open = input<boolean>(false);
  readonly survey = input<Survey | undefined>(undefined);
  readonly response = input<Response | null>(null);
  readonly contacts = input<Contact[]>([]);
  readonly closed = output<void>();

  private lang = useLang();

  readonly map = computed(() => {
    const r = this.response();
    return r ? answersToMap(r.answers) : {};
  });

  readonly contact = computed(() => {
    const r = this.response();
    return r ? contactById(this.contacts(), r.contactId) : undefined;
  });

  readonly questions = computed(() => {
    const s = this.survey();
    return s ? ordered(s.questions) : [];
  });

  readonly subtitle = computed(() => {
    const r = this.response();
    return r ? formatDateTime(r.at, this.lang()) : undefined;
  });

  duration(seconds: number) {
    return formatSeconds(seconds);
  }

  hasValue(question: Question) {
    return this.map()[question.id] !== undefined;
  }

  isMatrix(question: Question) {
    const value = this.map()[question.id];
    return question.type === 'matriz' && typeof value === 'object' && !Array.isArray(value);
  }

  matrixRows(question: Question) {
    const value = (this.map()[question.id] ?? {}) as Record<string, string>;
    return Object.entries(value).map(([row, column]) => ({ row, column }));
  }

  text(question: Question) {
    return answerToText(this.map()[question.id]);
  }

  hidden(question: Question) {
    const s = this.survey();
    return s ? isHiddenQuestion(s, question.id, this.map()) : false;
  }
}
