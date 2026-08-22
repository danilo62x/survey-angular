import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { UiService } from '../../core/services/ui.service';
import { PageHeaderComponent } from '../../components/app/page-header.component';
import { IconComponent } from '../../components/ui/icon-base.component';
import { ModalComponent } from '../../components/ui/modal.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';
import { TemplateCardComponent } from '../../components/sv/template-card.component';
import { QuestionRendererComponent } from '../../components/sv/question-renderer.component';
import { ordered } from '../../core/data/query';
import type { TemplateModel } from '../../core/data/types';

@Component({
  selector: 'app-templates-library-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    EmptyStateComponent,
    TemplateCardComponent,
    QuestionRendererComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-page-header
        [title]="t('templates.libraryTitle')"
        [subtitle]="t('templates.librarySubtitle')"
        [hasAction]="false"
      />

      <div class="mb-6 max-w-md">
        <div class="relative">
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <app-icon name="search" [size]="16" />
          </span>
          <input
            [ngModel]="term()"
            (ngModelChange)="term.set($event)"
            [placeholder]="t('templates.searchPlaceholder')"
            class="focus-ring surface-card w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm text-body"
          />
        </div>
      </div>

      @if (filtered().length === 0) {
        <div class="surface-card rounded-2xl border">
          <app-empty-state icon="layers" [title]="t('templates.emptyTitle')" [description]="t('templates.emptyDesc')">
            <button
              type="button"
              (click)="term.set('')"
              class="inline-flex h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body"
            >
              {{ t('common.clearFilters') }}
            </button>
          </app-empty-state>
        </div>
      } @else {
        <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          @for (template of filtered(); track template.id) {
            <div class="flex flex-col gap-2">
              <app-template-card
                [template]="template"
                [actionLabel]="t('templates.use')"
                (action)="use(template)"
              />
              <button
                type="button"
                (click)="preview.set(template)"
                class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-themed text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <app-icon name="eye" [size]="14" />
                {{ t('templates.preview') }}
              </button>
            </div>
          }
        </div>
      }

      <app-modal
        [open]="preview() !== null"
        (closed)="preview.set(null)"
        [title]="preview()?.name"
        [subtitle]="preview()?.objective"
        size="xl"
        [hasFooter]="true"
      >
        @if (preview(); as template) {
          <div class="flex max-h-[60vh] flex-col gap-8 overflow-y-auto pr-1">
            @for (question of previewQuestions(); track question.id; let index = $index) {
              <div class="min-w-0 border-b border-themed pb-6 last:border-0 last:pb-0">
                <p class="mb-2 text-xs text-muted">
                  {{ t('results.questionNumber', { index: index + 1 }) }} ·
                  {{ t('questionTypes.' + question.type) }}
                </p>
                <app-question-renderer [question]="question" [color]="template.color" [preview]="true" />
              </div>
            }
          </div>
        }
        <ng-container modalFooter>
          <button
            type="button"
            (click)="preview.set(null)"
            class="h-10 rounded-lg border border-themed px-4 text-sm font-medium text-body"
          >
            {{ t('common.close') }}
          </button>
          <button
            type="button"
            (click)="usePreview()"
            class="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {{ t('templates.use') }}
          </button>
        </ng-container>
      </app-modal>
    </ng-container>
  `,
})
export class TemplatesLibraryPageComponent {
  private data = inject(SurveyService);
  private ui = inject(UiService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  readonly term = signal('');
  readonly preview = signal<TemplateModel | null>(null);

  constructor() {
    usePageTitle('templates.libraryTitle');
  }

  readonly filtered = computed(() => {
    const needle = this.term().trim().toLowerCase();
    return this.data.templates().filter((tpl) => `${tpl.name} ${tpl.objective}`.toLowerCase().includes(needle));
  });

  readonly previewQuestions = computed(() => {
    const template = this.preview();
    return template ? ordered(template.questions) : [];
  });

  use(template: TemplateModel) {
    const created = this.data.createFromTemplate(template.id);
    if (created) {
      this.ui.notifySuccess(this.transloco.translate('templates.created', { name: template.name }));
      this.router.navigateByUrl(`/app/formularios/${created.id}`);
    }
  }

  usePreview() {
    const template = this.preview();
    if (template) this.use(template);
    this.preview.set(null);
  }
}
