import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { IconComponent } from '../../components/ui/icon-base.component';
import { AvatarComponent } from '../../components/ui/avatar.component';
import { PLANS_LIST, TESTIMONIALS, svImage } from '../../core/data/mock';
import { QUESTION_COLOR, QUESTION_ICON, QUESTION_TYPES } from '../../lib/question-types';
import { formatCurrency, formatNumber } from '../../lib/format';
import { surveyStats } from '../../core/data/query';
import { useLang, usePlural } from '../../lib/i18n';
import type { QuestionType } from '../../core/data/types';

const STEPS = ['build', 'share', 'read'] as const;
const FAQ_ITEMS = ['logic', 'export', 'brand', 'limits', 'privacy'] as const;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <!-- Hero -->
      <section class="relative overflow-hidden border-b border-themed">
        <div class="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-brand-500/10 blur-3xl"></div>
        <div
          class="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24"
        >
          <div class="min-w-0">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-themed px-3 py-1 text-xs font-medium text-muted"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-success-500"></span>
              {{ t('home.hero.badge', { total: totalResponsesLabel() }) }}
            </span>
            <h1 class="mt-5 text-title-sm font-bold text-heading sm:text-title-md">{{ t('home.hero.title') }}</h1>
            <p class="mt-4 max-w-xl text-base text-muted sm:text-lg">{{ t('home.hero.subtitle') }}</p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a
                [routerLink]="tryLink()"
                class="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <app-icon name="play" [size]="18" />
                {{ t('home.hero.tryForm') }}
              </a>
              <a
                routerLink="/modelos"
                class="inline-flex h-12 items-center gap-2 rounded-xl border border-themed px-6 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <app-icon name="layers" [size]="18" />
                {{ t('home.hero.seeTemplates') }}
              </a>
            </div>

            <dl class="mt-10 grid max-w-md grid-cols-3 gap-4">
              <div class="min-w-0">
                <dt class="truncate text-xs text-muted">{{ t('home.hero.statForms') }}</dt>
                <dd class="text-title-sm font-bold text-heading">{{ data.surveys().length }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="truncate text-xs text-muted">{{ t('home.hero.statResponses') }}</dt>
                <dd class="text-title-sm font-bold text-heading">{{ data.responses().length }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="truncate text-xs text-muted">{{ t('home.hero.statTypes') }}</dt>
                <dd class="text-title-sm font-bold text-heading">{{ questionTypes.length }}</dd>
              </div>
            </dl>
          </div>

          <div class="relative min-w-0">
            <div class="surface-card overflow-hidden rounded-3xl border shadow-theme-xl">
              <img [src]="heroImage" alt="" class="h-52 w-full object-cover sm:h-64" loading="eager" />
              <div class="p-6">
                <p class="text-xs font-medium tracking-wide text-brand-500 uppercase">
                  {{ t('home.hero.previewEyebrow') }}
                </p>
                <p class="mt-2 text-base font-semibold text-heading">
                  {{ highlight() ? highlight()!.survey.title : t('home.hero.previewFallback') }}
                </p>
                <div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div class="h-full w-2/3 rounded-full bg-brand-500"></div>
                </div>
                <p class="mt-2 text-xs text-muted">{{ t('home.hero.previewProgress') }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tipos de pergunta -->
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold tracking-wider text-brand-500 uppercase">{{ t('home.types.eyebrow') }}</p>
          <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.types.title') }}</h2>
          <p class="mt-3 text-muted">{{ t('home.types.subtitle') }}</p>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          @for (type of questionTypes; track type) {
            <div class="surface-card min-w-0 rounded-2xl border p-5 transition hover:shadow-theme-md">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                [style.backgroundColor]="typeColor(type)"
              >
                <app-icon [name]="typeIcon(type)" [size]="19" />
              </span>
              <h3 class="mt-4 text-sm font-semibold text-heading">{{ t('questionTypes.' + type) }}</h3>
              <p class="mt-1 text-xs text-muted">{{ t('questionTypeHints.' + type) }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Como funciona -->
      <section class="border-y border-themed bg-gray-50 dark:bg-gray-900/40">
        <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold tracking-wider text-brand-500 uppercase">{{ t('home.steps.eyebrow') }}</p>
            <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.steps.title') }}</h2>
          </div>
          <ol class="mt-8 grid gap-6 lg:grid-cols-3">
            @for (step of steps; track step; let i = $index) {
              <li class="surface-card min-w-0 rounded-2xl border p-6">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white"
                >
                  {{ i + 1 }}
                </span>
                <h3 class="mt-4 text-base font-semibold text-heading">{{ t('home.steps.' + step + '.title') }}</h3>
                <p class="mt-2 text-sm text-muted">{{ t('home.steps.' + step + '.desc') }}</p>
              </li>
            }
          </ol>
        </div>
      </section>

      <!-- Modelos prontos -->
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold tracking-wider text-brand-500 uppercase">
              {{ t('home.templates.eyebrow') }}
            </p>
            <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.templates.title') }}</h2>
            <p class="mt-3 text-muted">{{ t('home.templates.subtitle') }}</p>
          </div>
          <a routerLink="/modelos" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
            {{ t('home.templates.all') }}
            <app-icon name="arrow-right" [size]="16" />
          </a>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (template of data.templates(); track template.id) {
            <a
              routerLink="/modelos"
              [fragment]="template.slug"
              class="surface-card min-w-0 rounded-2xl border p-5 text-left transition hover:shadow-theme-md"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                [style.backgroundColor]="template.color"
              >
                <app-icon [name]="template.icon" [size]="19" />
              </span>
              <h3 class="mt-4 text-base font-semibold text-heading">{{ template.name }}</h3>
              <p class="mt-1.5 text-sm text-muted">{{ template.objective }}</p>
              <p class="mt-4 text-xs text-muted">
                {{
                  t(pluralKey('templates.questionCount', template.questions.length), {
                    count: template.questions.length
                  })
                }}
              </p>
            </a>
          }
        </div>
      </section>

      <!-- Depoimentos -->
      <section class="border-y border-themed bg-gray-50 dark:bg-gray-900/40">
        <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 class="text-title-sm font-bold text-heading">{{ t('home.testimonials.title') }}</h2>
          <div class="mt-8 grid gap-5 lg:grid-cols-3">
            @for (item of testimonials; track item.id) {
              <figure class="surface-card min-w-0 rounded-2xl border p-6">
                <app-icon name="message-circle" [size]="22" class="text-brand-500" />
                <blockquote class="mt-4 text-sm text-body">
                  “{{ t('home.testimonials.' + item.quoteKey) }}”
                </blockquote>
                <figcaption class="mt-5 flex items-center gap-3">
                  <app-avatar [src]="item.avatar" [name]="item.name" size="sm" />
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-medium text-heading">{{ item.name }}</span>
                    <span class="block truncate text-xs text-muted">{{ item.role }}</span>
                  </span>
                </figcaption>
              </figure>
            }
          </div>
        </div>
      </section>

      <!-- Planos -->
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold tracking-wider text-brand-500 uppercase">{{ t('home.plans.eyebrow') }}</p>
          <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.plans.title') }}</h2>
          <p class="mt-3 text-muted">{{ t('home.plans.subtitle') }}</p>
        </div>
        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          @for (plan of plans; track plan.id) {
            <div
              [class]="
                'surface-card flex min-w-0 flex-col rounded-2xl border p-6 ' +
                (plan.featured ? 'border-brand-500 shadow-theme-lg' : '')
              "
            >
              @if (plan.featured) {
                <span
                  class="mb-3 inline-flex w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                >
                  {{ t('home.plans.featured') }}
                </span>
              }
              <h3 class="text-base font-semibold text-heading">{{ t('home.plans.names.' + plan.id) }}</h3>
              <p class="mt-3 text-title-sm font-bold text-heading">
                {{ plan.priceMonthly === 0 ? t('home.plans.free') : price(plan.priceMonthly) }}
                @if (plan.priceMonthly > 0) {
                  <span class="text-sm font-normal text-muted">{{ t('home.plans.perMonth') }}</span>
                }
              </p>
              <p class="mt-2 text-sm text-muted">{{ t('home.plans.descs.' + plan.id) }}</p>
              <ul class="mt-5 flex flex-1 flex-col gap-2">
                @for (key of plan.featureKeys; track key) {
                  <li class="flex items-start gap-2 text-sm text-body">
                    <app-icon name="check" [size]="16" class="mt-0.5 shrink-0 text-success-500" />
                    <span class="min-w-0">{{ t('home.plans.features.' + plan.id + '.' + key) }}</span>
                  </li>
                }
              </ul>
              <a
                routerLink="/registro"
                [class]="
                  'mt-6 flex h-11 items-center justify-center rounded-xl text-sm font-medium transition ' +
                  (plan.featured
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'border border-themed text-body hover:bg-gray-50 dark:hover:bg-gray-800')
                "
              >
                {{ t('home.plans.cta') }}
              </a>
            </div>
          }
        </div>
      </section>

      <!-- FAQ -->
      <section class="border-t border-themed">
        <div class="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 class="text-title-sm font-bold text-heading">{{ t('home.faq.title') }}</h2>
          <div class="mt-8 flex flex-col gap-3">
            @for (item of faqItems; track item) {
              <div class="surface-card rounded-2xl border">
                <button
                  type="button"
                  (click)="toggleFaq(item)"
                  [attr.aria-expanded]="openFaq() === item"
                  class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span class="min-w-0 text-sm font-medium text-heading">{{ t('home.faq.' + item + '.q') }}</span>
                  <app-icon
                    name="chevron-down"
                    [size]="18"
                    [class]="'shrink-0 text-muted transition ' + (openFaq() === item ? 'rotate-180' : '')"
                  />
                </button>
                @if (openFaq() === item) {
                  <p class="px-5 pb-5 text-sm text-muted">{{ t('home.faq.' + item + '.a') }}</p>
                }
              </div>
            }
          </div>
        </div>
      </section>
    </ng-container>
  `,
})
export class HomePageComponent {
  data = inject(SurveyService);
  private lang = useLang();
  protected pluralKey = usePlural();

  constructor() {
    usePageTitle();
  }

  protected steps = STEPS;
  protected faqItems = FAQ_ITEMS;
  protected questionTypes = QUESTION_TYPES;
  protected testimonials = TESTIMONIALS;
  protected plans = PLANS_LIST;
  protected heroImage = svImage('hero-sondagem', 960, 640);

  readonly openFaq = signal<string | null>('logic');

  readonly highlight = computed(() => {
    const published = this.data.surveys().filter((s) => s.status === 'publicado');
    return surveyStats(published, this.data.responses()).sort((a, b) => b.responses - a.responses)[0];
  });

  readonly tryLink = computed(() => {
    const highlight = this.highlight();
    return highlight ? `/f/${highlight.survey.slug}` : '/modelos';
  });

  totalResponsesLabel() {
    return formatNumber(this.data.responses().length, this.lang());
  }

  price(value: number) {
    return formatCurrency(value, this.lang());
  }

  typeColor(type: QuestionType) {
    return QUESTION_COLOR[type];
  }

  typeIcon(type: QuestionType) {
    return QUESTION_ICON[type];
  }

  toggleFaq(item: string) {
    this.openFaq.set(this.openFaq() === item ? null : item);
  }
}
