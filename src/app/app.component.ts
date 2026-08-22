import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from './core/services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {
  // UiService applies the persisted theme on construction.
  private ui = inject(UiService);

  constructor() {
    document.title = 'Sondagem — Pesquisas & Formulários';
  }
}
