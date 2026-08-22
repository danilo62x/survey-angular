import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiService, ToastType } from '@app/core/services/ui.service';
import { IconComponent } from './icon-base.component';

const BORDER: Record<ToastType, string> = {
  success: 'border-success-200 dark:border-success-500/30',
  error: 'border-error-200 dark:border-error-500/30',
  warning: 'border-warning-200 dark:border-warning-500/30',
  info: 'border-blue-light-200 dark:border-blue-light-500/30',
};

const ICON_NAME: Record<ToastType, string> = {
  success: 'check',
  error: 'x',
  warning: 'bell',
  info: 'bell',
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-success-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-blue-light-500',
};

@Component({
  selector: 'app-toast-stack',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2">
      @for (toast of ui.toasts(); track toast.id) {
        <div
          [class]="
            'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-white p-4 shadow-theme-md dark:bg-gray-dark ' +
            border(toast.type)
          "
        >
          <app-icon [name]="iconName(toast.type)" [size]="20" [class]="iconColor(toast.type)" />
          <div class="flex-1">
            <p class="text-sm font-medium text-heading">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            (click)="ui.dismissToast(toast.id)"
          >
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastStackComponent {
  ui = inject(UiService);
  border(t: ToastType) {
    return BORDER[t];
  }
  iconName(t: ToastType) {
    return ICON_NAME[t];
  }
  iconColor(t: ToastType) {
    return ICON_COLOR[t];
  }
}
