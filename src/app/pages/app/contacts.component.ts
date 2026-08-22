import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { UiService } from '../../core/services/ui.service';
import { PageHeaderComponent } from '../../components/app/page-header.component';
import { FilterBarComponent } from '../../components/ui/filter-bar.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';
import { ModalComponent } from '../../components/ui/modal.component';
import { AvatarComponent } from '../../components/ui/avatar.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { IconComponent } from '../../components/ui/icon-base.component';
import { PaginationComponent } from '../../components/ui/pagination.component';
import { SourceBadgeComponent } from '../../components/sv/status-pill.component';
import { formatDate } from '../../lib/format';
import { useLang, usePlural } from '../../lib/i18n';
import { allTags, ordered } from '../../core/data/query';
import type { Contact, ResponseSource } from '../../core/data/types';

const PAGE_SIZE = 10;

interface EnrichedContact {
  contact: Contact;
  responses: number;
  lastAt: string;
  source: ResponseSource;
  score: number | null;
}

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    FilterBarComponent,
    EmptyStateComponent,
    ModalComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    PaginationComponent,
    SourceBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-page-header
        [title]="t('contacts.title')"
        [subtitle]="t(pl('contacts.subtitle', data.contacts().length), { count: data.contacts().length })"
        [hasAction]="false"
      />

      <app-filter-bar
        [search]="term()"
        (searchChange)="term.set($event)"
        [searchPlaceholder]="t('contacts.searchPlaceholder')"
      >
        <label class="flex items-center gap-2 text-sm text-muted">
          <span class="whitespace-nowrap">{{ t('contacts.tag') }}</span>
          <select
            [ngModel]="tag()"
            (ngModelChange)="setTag($event)"
            class="focus-ring rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
          >
            <option value="all">{{ t('common.all') }}</option>
            @for (item of tags(); track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </label>
      </app-filter-bar>

      @if (filtered().length === 0) {
        <div class="surface-card rounded-2xl border">
          <app-empty-state icon="users" [title]="t('contacts.emptyTitle')" [description]="t('contacts.emptyDesc')">
            <button
              type="button"
              (click)="clearFilters()"
              class="inline-flex h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body"
            >
              {{ t('common.clearFilters') }}
            </button>
          </app-empty-state>
        </div>
      } @else {
        <div class="surface-card overflow-hidden rounded-2xl border">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr class="border-b border-themed">
                  <th class="px-5 py-3 font-medium text-muted">{{ t('contacts.person') }}</th>
                  <th class="px-5 py-3 font-medium text-muted">{{ t('contacts.tags') }}</th>
                  <th class="px-5 py-3 font-medium text-muted">{{ t('contacts.origin') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('contacts.responses') }}</th>
                  <th class="px-5 py-3 text-center font-medium text-muted">{{ t('contacts.score') }}</th>
                  <th class="px-5 py-3 font-medium text-muted">{{ t('contacts.lastAt') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of pageRows(); track row.contact.id) {
                  <tr class="border-b border-themed last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td class="max-w-[18rem] px-5 py-3">
                      <div class="flex min-w-0 items-center gap-3">
                        <app-avatar [src]="row.contact.avatar" [name]="row.contact.name" size="sm" />
                        <div class="min-w-0">
                          <p class="truncate font-medium text-heading">{{ row.contact.name }}</p>
                          <p class="truncate text-xs text-muted">{{ row.contact.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3">
                      <div class="flex flex-wrap gap-1.5">
                        @if (row.contact.tags.length === 0) {
                          <span class="text-xs text-muted">—</span>
                        }
                        @for (item of row.contact.tags; track item) {
                          <app-badge color="gray">{{ item }}</app-badge>
                        }
                      </div>
                    </td>
                    <td class="px-5 py-3"><app-source-badge [source]="row.source" /></td>
                    <td class="px-5 py-3 text-right tabular-nums text-body">{{ row.responses }}</td>
                    <td class="px-5 py-3 text-center">
                      <app-badge [color]="scoreTone(row.score)">{{ row.score === null ? '—' : row.score }}</app-badge>
                    </td>
                    <td class="px-5 py-3 text-muted">{{ row.lastAt ? date(row.lastAt) : '—' }}</td>
                    <td class="px-5 py-3">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          (click)="openEdit(row.contact)"
                          [title]="t('contacts.editTags')"
                          [attr.aria-label]="t('contacts.editTags')"
                          class="flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-heading"
                        >
                          <app-icon name="tag" [size]="15" />
                        </button>
                        <a
                          [href]="'mailto:' + row.contact.email"
                          [title]="t('contacts.sendEmail')"
                          [attr.aria-label]="t('contacts.sendEmail')"
                          class="flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-heading"
                        >
                          <app-icon name="mail" [size]="15" />
                        </a>
                        <button
                          type="button"
                          (click)="remove(row.contact.id)"
                          [title]="t('common.remove')"
                          [attr.aria-label]="t('common.remove')"
                          class="flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500"
                        >
                          <app-icon name="trash" [size]="15" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-5">
          <app-pagination [page]="page()" [totalPages]="totalPages()" (onChange)="page.set($event)" />
        </div>
      }

      <app-modal
        [open]="editing() !== null"
        (closed)="editing.set(null)"
        [title]="t('contacts.editTags')"
        [subtitle]="editing()?.name"
        [hasFooter]="true"
      >
        <label class="mb-1.5 block text-sm font-medium text-heading" for="tags">{{ t('contacts.tags') }}</label>
        <input
          id="tags"
          [ngModel]="tagDraft()"
          (ngModelChange)="tagDraft.set($event)"
          [placeholder]="t('contacts.tagsPlaceholder')"
          class="focus-ring w-full rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body"
        />
        <p class="mt-1.5 text-xs text-muted">{{ t('contacts.tagsHint') }}</p>
        <ng-container modalFooter>
          <button
            type="button"
            (click)="editing.set(null)"
            class="h-10 rounded-lg border border-themed px-4 text-sm font-medium text-body"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="saveTags()"
            class="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {{ t('common.save') }}
          </button>
        </ng-container>
      </app-modal>
    </ng-container>
  `,
})
export class ContactsPageComponent {
  data = inject(SurveyService);
  private ui = inject(UiService);
  private transloco = inject(TranslocoService);
  private lang = useLang();
  protected pl = usePlural();

  readonly term = signal('');
  readonly tag = signal('all');
  readonly page = signal(1);
  readonly editing = signal<Contact | null>(null);
  readonly tagDraft = signal('');

  constructor() {
    usePageTitle('contacts.title');
  }

  readonly tags = computed(() => allTags(this.data.contacts()));

  /** Origem e nota (NPS) vêm das respostas — nada disso é gravado no contato. */
  readonly enriched = computed<EnrichedContact[]>(() => {
    const responses = this.data.responses();
    const surveys = this.data.surveys();
    return this.data.contacts().map((contact) => {
      const rows = responses
        .filter((r) => r.contactId === contact.id)
        .sort((a, b) => b.at.localeCompare(a.at));
      let score: number | null = null;
      for (const response of rows) {
        const survey = surveys.find((s) => s.id === response.surveyId);
        if (!survey) continue;
        const question = ordered(survey.questions).find((q) => q.type === 'nps');
        if (!question) continue;
        const answer = response.answers.find((a) => a.questionId === question.id);
        if (typeof answer?.value === 'number') {
          score = answer.value;
          break;
        }
      }
      return {
        contact,
        responses: rows.length,
        lastAt: rows[0]?.at ?? contact.lastAt,
        source: (rows[0]?.source ?? 'link') as ResponseSource,
        score,
      };
    });
  });

  readonly filtered = computed(() => {
    const needle = this.term().trim().toLowerCase();
    const tag = this.tag();
    return this.enriched()
      .filter((row) => `${row.contact.name} ${row.contact.email}`.toLowerCase().includes(needle))
      .filter((row) => (tag === 'all' ? true : row.contact.tags.includes(tag)))
      .sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageRows = computed(() =>
    this.filtered().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE)
  );

  date(iso: string) {
    return formatDate(iso, this.lang());
  }

  scoreTone(score: number | null): 'success' | 'warning' | 'error' | 'gray' {
    if (score === null) return 'gray';
    if (score >= 9) return 'success';
    if (score >= 7) return 'warning';
    return 'error';
  }

  setTag(value: string) {
    this.tag.set(value);
    this.page.set(1);
  }

  clearFilters() {
    this.term.set('');
    this.tag.set('all');
  }

  openEdit(contact: Contact) {
    this.editing.set(contact);
    this.tagDraft.set(contact.tags.join(', '));
  }

  saveTags() {
    const editing = this.editing();
    if (!editing) return;
    const parsed = this.tagDraft()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.data.updateContact(editing.id, { tags: [...new Set(parsed)] });
    this.editing.set(null);
    this.ui.notifySuccess(this.transloco.translate('contacts.saved'));
  }

  remove(id: number) {
    this.data.removeContact(id);
    this.ui.notifySuccess(this.transloco.translate('contacts.removed'));
  }
}
