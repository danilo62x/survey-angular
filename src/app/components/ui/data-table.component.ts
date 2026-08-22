import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import {
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from '@tanstack/angular-table';
import { IconComponent } from './icon-base.component';

/**
 * Column config for the generic DataTable.
 * - `format` returns plain text.
 * - `cell` provides an ng-template rendered with `{ $implicit: row }` for rich,
 *   interactive cells (avatars, selects, badges, action buttons).
 */
export interface DataColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  accessor?: (row: T) => unknown;
  format?: (value: any, row: T) => string;
  cell?: TemplateRef<{ $implicit: T }>;
}

/**
 * Generic data table powered by @tanstack/angular-table (sorting, global
 * filter, client pagination), styled with the template's theme tokens.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [FormsModule, TranslocoModule, NgTemplateOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="surface-card overflow-hidden rounded-xl border">
      @if (searchable()) {
        <div class="flex items-center gap-2 border-b border-themed p-4">
          <div class="relative w-full max-w-xs">
            <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
              <app-icon name="search" [size]="16" />
            </span>
            <input
              [ngModel]="globalFilter()"
              (ngModelChange)="globalFilter.set($event)"
              [placeholder]="'common.search' | transloco"
              class="focus-ring w-full rounded-lg border border-themed bg-transparent py-2 pr-3 pl-9 text-sm text-body"
            />
          </div>
        </div>
      }

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            @for (hg of table.getHeaderGroups(); track hg.id) {
              <tr class="border-b border-themed">
                @for (header of hg.headers; track header.id) {
                  <th class="px-5 py-3 font-medium text-muted">
                    <button
                      type="button"
                      class="flex items-center gap-1"
                      [class.cursor-pointer]="header.column.getCanSort()"
                      (click)="header.column.getToggleSortingHandler()?.($event)"
                    >
                      {{ columnById(header.column.id)?.header }}
                      @if (header.column.getIsSorted() === 'asc') {
                        <app-icon name="arrow-up" [size]="14" />
                      } @else if (header.column.getIsSorted() === 'desc') {
                        <app-icon name="arrow-down" [size]="14" />
                      }
                    </button>
                  </th>
                }
              </tr>
            }
          </thead>
          <tbody>
            @if (table.getRowModel().rows.length === 0) {
              <tr>
                <td [attr.colspan]="columns().length" class="px-5 py-10 text-center text-muted">
                  {{ 'common.noResults' | transloco }}
                </td>
              </tr>
            }
            @for (row of table.getRowModel().rows; track row.id) {
              <tr class="border-b border-themed last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                @for (cell of row.getVisibleCells(); track cell.id) {
                  @let col = columnById(cell.column.id);
                  <td
                    class="px-5 py-3 text-body"
                    [class.text-right]="col?.align === 'right'"
                    [class.text-center]="col?.align === 'center'"
                  >
                    @if (col?.cell) {
                      <ng-container
                        [ngTemplateOutlet]="col!.cell!"
                        [ngTemplateOutletContext]="{ $implicit: row.original }"
                      />
                    } @else if (col?.format) {
                      {{ col!.format!(cell.getValue(), row.original) }}
                    } @else {
                      {{ cell.getValue() }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-themed p-4 text-sm text-muted">
        <span>
          {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }}–{{
            min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )
          }}
          / {{ table.getFilteredRowModel().rows.length }}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="focus-ring rounded-lg border border-themed px-3 py-1.5 disabled:opacity-40"
            [disabled]="!table.getCanPreviousPage()"
            (click)="table.previousPage()"
          >
            {{ 'common.previous' | transloco }}
          </button>
          <button
            type="button"
            class="focus-ring rounded-lg border border-themed px-3 py-1.5 disabled:opacity-40"
            [disabled]="!table.getCanNextPage()"
            (click)="table.nextPage()"
          >
            {{ 'common.next' | transloco }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DataTableComponent<T> {
  // Sem `input.required`: o `createAngularTable` abaixo é inicializado junto com
  // o componente e leria o sinal antes de o Angular gravar as entradas (NG0950).
  readonly columns = input<DataColumn<T>[]>([]);
  readonly data = input<T[]>([]);
  readonly pageSize = input(10);
  readonly searchable = input(true);

  protected globalFilter = signal('');
  private sorting = signal<SortingState>([]);

  protected min = Math.min;
  protected columnById = (id: string) => this.columns().find((c) => c.key === id);

  private columnDefs = computed<ColumnDef<T, any>[]>(() =>
    this.columns().map((c) => ({
      id: c.key,
      accessorFn: c.accessor ?? ((row: T) => (row as any)[c.key]),
      header: c.header,
      enableSorting: c.sortable !== false,
    }))
  );

  // `initialState` só valeria na criação da tabela, quando `pageSize` ainda é o
  // padrão: a paginação fica em estado controlado e reage à entrada.
  private pagination = linkedSignal<PaginationState>(() => ({ pageIndex: 0, pageSize: this.pageSize() }));

  protected table = createAngularTable(() => ({
    data: this.data(),
    columns: this.columnDefs(),
    state: { sorting: this.sorting(), globalFilter: this.globalFilter(), pagination: this.pagination() },
    onSortingChange: (updater) =>
      this.sorting.set(typeof updater === 'function' ? updater(this.sorting()) : updater),
    onGlobalFilterChange: (updater) =>
      this.globalFilter.set(typeof updater === 'function' ? updater(this.globalFilter()) : updater),
    onPaginationChange: (updater) =>
      this.pagination.set(typeof updater === 'function' ? updater(this.pagination()) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  }));
}
