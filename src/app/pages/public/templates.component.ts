import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import type { TemplateModel } from '../../core/data/types';
import { IconComponent } from '../../components/ui/icon-base.component';
import { ModalComponent } from '../../components/ui/modal.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';
import { TemplateCardComponent } from '../../components/sv/template-card.component';
import { QuestionRendererComponent } from '../../components/sv/question-renderer.component';
import { ordered } from '../../core/data/query';

@Component({
  selector: 'app-templates-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoModule,
    IconComponent,
    ModalComponent,
    EmptyStateComponent,
    TemplateCardComponent,
    QuestionRendererComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16" *transloco="let t">
      <header class="max-w-2xl">
        <p class="text-sm font-semibold tracking-wider text-brand-500 uppercase">{{ t('templates.eyebrow') }}</p>
        <h1 class="mt-2 text-title-sm font-bold text-heading sm:text-title-md">{{ t('templates.publicTitle') }}</h1>
        <p class="mt-3 text-muted">{{ t('templates.publicSubtitle') }}</p>
      </header>

      <div class="mt-8 max-w-md">
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
        <app-empty-state icon="layers" [title]="t('templates.emptyTitle')" [description]="t('templates.emptyDesc')">
          <button
            type="button"
            (click)="term.set('')"
            class="inline-flex h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body"
          >
            {{ t('common.clearFilters') }}
          </button>
        </app-empty-state>
      } @else {
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (template of filtered(); track template.id) {
            <div [id]="template.slug">
              <app-template-card
                [template]="template"
                [actionLabel]="t('templates.preview')"
                (action)="preview.set(template)"
              />
            </div>
          }
        </div>
      }

      <section
        class="mt-14 overflow-hidden rounded-3xl border border-themed bg-brand-500 px-6 py-10 text-center sm:px-10"
      >
        <h2 class="text-title-sm font-bold text-white">{{ t('templates.ctaTitle') }}</h2>
        <p class="mx-auto mt-3 max-w-xl text-sm text-white/80">{{ t('templates.ctaDesc') }}</p>
        <a
          routerLink="/registro"
          class="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-brand-600 transition hover:bg-brand-50"
        >
          <app-icon name="plus" [size]="18" />
          {{ t('templates.ctaButton') }}
        </a>
      </section>

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
          <a
            routerLink="/registro"
            class="flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {{ t('templates.useTemplate') }}
          </a>
        </ng-container>
      </app-modal>
    </div>
  `,
})
export class TemplatesPageComponent {
  private data = inject(SurveyService);
  private route = inject(ActivatedRoute);

  readonly term = signal('');
  readonly preview = signal<TemplateModel | null>(null);

  constructor() {
    usePageTitle('templates.publicTitle');
    // Vindo da home com #slug, o modelo já abre em prévia.
    this.route.fragment.subscribe((slug) => {
      if (!slug) return;
      const found = this.data.templates().find((tpl) => tpl.slug === slug);
      if (found) this.preview.set(found);
    });
  }

  readonly filtered = computed(() => {
    const needle = this.term().trim().toLowerCase();
    return this.data.templates().filter((tpl) => `${tpl.name} ${tpl.objective}`.toLowerCase().includes(needle));
  });

  readonly previewQuestions = computed(() => {
    const template = this.preview();
    return template ? ordered(template.questions) : [];
  });
}
