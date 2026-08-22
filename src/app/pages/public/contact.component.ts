import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from '../../components/ui/icon-base.component';
import { FormFieldComponent } from '../../components/ui/form-field.component';

const CHANNELS = [
  { icon: 'mail', labelKey: 'contact.channels.email', value: 'contato@sondagem.com' },
  { icon: 'message-circle', labelKey: 'contact.channels.chat', value: 'Seg a sex, 9h às 18h' },
  { icon: 'clock', labelKey: 'contact.channels.sla', value: 'Resposta em até 1 dia útil' },
  { icon: 'globe', labelKey: 'contact.channels.status', value: 'status.sondagem.com' },
];

const SUBJECTS = ['demo', 'plan', 'support', 'other'] as const;

type FieldName = 'name' | 'email' | 'subject' | 'message';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, IconComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16" *transloco="let t">
      <header class="max-w-2xl">
        <p class="text-sm font-semibold tracking-wider text-brand-500 uppercase">{{ t('contact.eyebrow') }}</p>
        <h1 class="mt-2 text-title-sm font-bold text-heading sm:text-title-md">{{ t('contact.title') }}</h1>
        <p class="mt-3 text-muted">{{ t('contact.subtitle') }}</p>
      </header>

      <div class="mt-10 grid gap-8 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <div class="surface-card rounded-2xl border p-6 shadow-theme-sm md:p-8">
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
              <div class="grid gap-5 sm:grid-cols-2">
                <app-form-field
                  name="name"
                  [control]="form.controls.name"
                  [label]="t('contact.form.name')"
                  placeholder="Ana Martins"
                  [errorText]="errorText('name')"
                />
                <app-form-field
                  name="email"
                  [control]="form.controls.email"
                  [label]="t('contact.form.email')"
                  type="email"
                  placeholder="ana@empresa.com"
                  [errorText]="errorText('email')"
                />
              </div>
              <app-form-field
                name="subject"
                control-type="select"
                [control]="form.controls.subject"
                [label]="t('contact.form.subject')"
                [hint]="t('contact.form.subjectHint')"
                [errorText]="errorText('subject')"
              >
                <option value="">{{ t('contact.form.subjectPlaceholder') }}</option>
                @for (subject of subjects; track subject) {
                  <option [value]="subject">{{ t('contact.subjects.' + subject) }}</option>
                }
              </app-form-field>
              <app-form-field
                name="message"
                control-type="textarea"
                [control]="form.controls.message"
                [label]="t('contact.form.message')"
                [rows]="5"
                [placeholder]="t('contact.form.messagePlaceholder')"
                [hint]="t('contact.form.messageHint')"
                [errorText]="errorText('message')"
              />
              <button
                type="submit"
                [disabled]="submitting()"
                class="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {{ t('contact.form.submit') }}
                <app-icon name="arrow-right" [size]="18" />
              </button>
            </form>
          </div>
        </div>

        <aside class="space-y-4 lg:col-span-2">
          @for (c of channels; track c.labelKey) {
            <div class="surface-card flex gap-4 rounded-2xl border p-5">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15"
              >
                <app-icon [name]="c.icon" [size]="20" />
              </span>
              <div class="min-w-0">
                <p class="text-xs tracking-wider text-muted uppercase">{{ t(c.labelKey) }}</p>
                <p class="mt-1 text-sm font-medium break-words text-heading">{{ c.value }}</p>
              </div>
            </div>
          }

          <div class="rounded-2xl border border-dashed border-themed p-5">
            <p class="text-sm font-semibold text-heading">{{ t('contact.tipTitle') }}</p>
            <p class="mt-2 text-sm text-muted">{{ t('contact.tipDesc') }}</p>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class ContactPageComponent {
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private transloco = inject(TranslocoService);
  private lang = signal(this.transloco.getActiveLang());

  constructor() {
    usePageTitle('contact.title');
    this.transloco.langChanges$.subscribe((l) => this.lang.set(l));
  }

  protected channels = CHANNELS;
  protected subjects = SUBJECTS;
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected errorText(field: FieldName): string {
    this.lang();
    const errors = this.form.controls[field].errors;
    if (!errors) return '';
    if (errors['required']) return this.transloco.translate('validation.required');
    if (errors['email']) return this.transloco.translate('validation.email');
    if (errors['minlength']) return this.transloco.translate('validation.minChars', { count: 10 });
    return '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.ui.notifySuccess(this.transloco.translate('contact.success'));
    this.form.reset();
    this.submitting.set(false);
  }
}
