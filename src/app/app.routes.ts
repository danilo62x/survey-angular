import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Autenticação (layout em branco) — casada antes dos shells de layout
  {
    path: 'login',
    loadComponent: () => import('./pages/public/login.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/public/register.component').then((m) => m.RegisterPageComponent),
  },

  // Área logada (guardada, layout com sidebar)
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/app/dashboard.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'formularios',
        loadComponent: () => import('./pages/app/forms.component').then((m) => m.FormsPageComponent),
      },
      {
        path: 'formularios/:id',
        loadComponent: () => import('./pages/app/builder.component').then((m) => m.BuilderPageComponent),
      },
      {
        path: 'formularios/:id/respostas',
        loadComponent: () => import('./pages/app/results.component').then((m) => m.ResultsPageComponent),
      },
      {
        path: 'modelos',
        loadComponent: () =>
          import('./pages/app/templates-library.component').then((m) => m.TemplatesLibraryPageComponent),
      },
      {
        path: 'contatos',
        loadComponent: () => import('./pages/app/contacts.component').then((m) => m.ContactsPageComponent),
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./pages/app/settings.component').then((m) => m.SettingsPageComponent),
      },
    ],
  },

  // Site público (navbar + footer)
  {
    path: '',
    loadComponent: () =>
      import('./components/layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/public/home.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'modelos',
        loadComponent: () => import('./pages/public/templates.component').then((m) => m.TemplatesPageComponent),
      },
      {
        path: 'f/:slug/obrigado',
        loadComponent: () => import('./pages/public/thank-you.component').then((m) => m.ThankYouPageComponent),
      },
      {
        path: 'f/:slug',
        loadComponent: () => import('./pages/public/fill.component').then((m) => m.FillPageComponent),
      },
      {
        path: 'contato',
        loadComponent: () => import('./pages/public/contact.component').then((m) => m.ContactPageComponent),
      },
    ],
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./pages/app/not-found.component').then((m) => m.NotFoundPageComponent),
  },
];
