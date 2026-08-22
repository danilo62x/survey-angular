import { Injectable, effect, signal } from '@angular/core';
import { CONTACTS, RESPONSES, SURVEYS, TEMPLATES, blankQuestion } from '../data/mock';
import { ordered, slugify } from '../data/query';
import type {
  Answer,
  Contact,
  LogicRule,
  Question,
  QuestionType,
  Response,
  ResponseSource,
  Survey,
  TemplateModel,
} from '../data/types';

const STORAGE_KEY = 'sv-data';

const nextId = (rows: { id: number }[]) => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1);

const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

/** Reescreve os ids das perguntas/opções ao copiar um formulário ou modelo. */
function cloneQuestions(questions: Question[], logic: LogicRule[]) {
  const idMap = new Map<string, string>();
  const cloned = ordered(questions).map((q, index) => {
    const id = uid('q');
    idMap.set(q.id, id);
    return {
      ...q,
      id,
      order: index,
      choices: q.choices.map((c, i) => ({ id: `${id}-o${i + 1}`, label: c.label })),
      rows: [...q.rows],
      columns: [...q.columns],
    };
  });
  const rules = logic
    .filter((r) => idMap.has(r.questionId) && idMap.has(r.targetId))
    .map((r) => ({
      ...r,
      id: uid('r'),
      questionId: idMap.get(r.questionId)!,
      targetId: idMap.get(r.targetId)!,
    }));
  return { questions: cloned, logic: rules };
}

function uniqueSlug(surveys: Survey[], base: string): string {
  let slug = base || 'formulario';
  let n = 2;
  while (surveys.some((s) => s.slug === slug)) slug = `${base}-${n++}`;
  return slug;
}

export interface NewResponseInput {
  surveyId: number;
  answers: Answer[];
  durationSec: number;
  completed: boolean;
  source: ResponseSource;
}

interface Persisted {
  surveys: Survey[];
  responses: Response[];
  contacts: Contact[];
  templates: TemplateModel[];
}

function seed(): Persisted {
  return {
    surveys: SURVEYS.map((s) => ({
      ...s,
      questions: s.questions.map((q) => ({ ...q, choices: q.choices.map((c) => ({ ...c })) })),
      logic: s.logic.map((r) => ({ ...r })),
    })),
    responses: RESPONSES.map((r) => ({ ...r, answers: r.answers.map((a) => ({ ...a })) })),
    contacts: CONTACTS.map((c) => ({ ...c, tags: [...c.tags] })),
    templates: TEMPLATES.map((t) => ({ ...t })),
  };
}

function load(): Persisted {
  const base = seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<Persisted> } & Partial<Persisted>;
      const s = parsed.state ?? parsed;
      return {
        surveys: s.surveys ?? base.surveys,
        responses: s.responses ?? base.responses,
        contacts: s.contacts ?? base.contacts,
        templates: s.templates ?? base.templates,
      };
    }
  } catch {}
  return base;
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private initial = load();

  readonly surveys = signal<Survey[]>(this.initial.surveys);
  readonly responses = signal<Response[]>(this.initial.responses);
  readonly contacts = signal<Contact[]>(this.initial.contacts);
  readonly templates = signal<TemplateModel[]>(this.initial.templates);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            surveys: this.surveys(),
            responses: this.responses(),
            contacts: this.contacts(),
            templates: this.templates(),
          })
        );
      } catch {}
    });
  }

  // ---- Formulários -------------------------------------------------
  addSurvey(title: string, description = ''): Survey {
    const now = new Date().toISOString();
    const survey: Survey = {
      id: nextId(this.surveys()),
      slug: uniqueSlug(this.surveys(), slugify(title)),
      title,
      description,
      status: 'rascunho',
      coverSeed: slugify(title) || 'novo',
      color: '#465fff',
      questions: [blankQuestion('texto-curto', uid('q'), 0)],
      logic: [],
      thankYou: 'Obrigado por responder!',
      createdAt: now,
      publishedAt: '',
      closesAt: null,
      views: 0,
    };
    this.surveys.update((list) => [...list, survey]);
    return survey;
  }

  createFromTemplate(templateId: number, title?: string): Survey | undefined {
    const template = this.templates().find((t) => t.id === templateId);
    if (!template) return undefined;
    const now = new Date().toISOString();
    const name = title?.trim() || template.name;
    const { questions, logic } = cloneQuestions(template.questions, []);
    const survey: Survey = {
      id: nextId(this.surveys()),
      slug: uniqueSlug(this.surveys(), slugify(name)),
      title: name,
      description: template.objective,
      status: 'rascunho',
      coverSeed: template.slug,
      color: template.color,
      questions,
      logic,
      thankYou: 'Obrigado por responder!',
      createdAt: now,
      publishedAt: '',
      closesAt: null,
      views: 0,
    };
    this.surveys.update((list) => [...list, survey]);
    return survey;
  }

  updateSurvey(id: number, patch: Partial<Survey>) {
    this.surveys.update((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  removeSurvey(id: number) {
    this.surveys.update((list) => list.filter((s) => s.id !== id));
    this.responses.update((list) => list.filter((r) => r.surveyId !== id));
  }

  duplicateSurvey(id: number): Survey | undefined {
    const source = this.surveys().find((s) => s.id === id);
    if (!source) return undefined;
    const { questions, logic } = cloneQuestions(source.questions, source.logic);
    const copy: Survey = {
      ...source,
      id: nextId(this.surveys()),
      slug: uniqueSlug(this.surveys(), `${source.slug}-copia`),
      title: `${source.title} (cópia)`,
      status: 'rascunho',
      questions,
      logic,
      createdAt: new Date().toISOString(),
      publishedAt: '',
      closesAt: null,
      views: 0,
    };
    this.surveys.update((list) => [...list, copy]);
    return copy;
  }

  publishSurvey(id: number) {
    this.surveys.update((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'publicado' as const,
              publishedAt: s.publishedAt || new Date().toISOString(),
              closesAt: null,
            }
          : s
      )
    );
  }

  closeSurvey(id: number) {
    this.surveys.update((list) =>
      list.map((s) =>
        s.id === id ? { ...s, status: 'encerrado' as const, closesAt: new Date().toISOString() } : s
      )
    );
  }

  reopenSurvey(id: number) {
    this.surveys.update((list) =>
      list.map((s) => (s.id === id ? { ...s, status: 'publicado' as const, closesAt: null } : s))
    );
  }

  registerView(id: number) {
    this.surveys.update((list) => list.map((s) => (s.id === id ? { ...s, views: s.views + 1 } : s)));
  }

  // ---- Perguntas ---------------------------------------------------
  addQuestion(surveyId: number, type: QuestionType): Question | undefined {
    const survey = this.surveys().find((s) => s.id === surveyId);
    if (!survey) return undefined;
    const question = blankQuestion(type, uid('q'), survey.questions.length);
    this.surveys.update((list) =>
      list.map((s) => (s.id === surveyId ? { ...s, questions: [...s.questions, question] } : s))
    );
    return question;
  }

  updateQuestion(surveyId: number, questionId: string, patch: Partial<Question>) {
    this.surveys.update((list) =>
      list.map((s) =>
        s.id === surveyId
          ? { ...s, questions: s.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)) }
          : s
      )
    );
  }

  removeQuestion(surveyId: number, questionId: string) {
    this.surveys.update((list) =>
      list.map((s) => {
        if (s.id !== surveyId) return s;
        const questions = ordered(s.questions)
          .filter((q) => q.id !== questionId)
          .map((q, i) => ({ ...q, order: i }));
        return {
          ...s,
          questions,
          // Regras que citam a pergunta removida deixam de existir.
          logic: s.logic.filter((r) => r.questionId !== questionId && r.targetId !== questionId),
        };
      })
    );
  }

  moveQuestion(surveyId: number, from: number, to: number) {
    this.surveys.update((list) =>
      list.map((s) => {
        if (s.id !== surveyId) return s;
        const arr = ordered(s.questions);
        if (from < 0 || from >= arr.length) return s;
        const target = Math.max(0, Math.min(to, arr.length - 1));
        const [moved] = arr.splice(from, 1);
        arr.splice(target, 0, moved);
        return { ...s, questions: arr.map((q, i) => ({ ...q, order: i })) };
      })
    );
  }

  duplicateQuestion(surveyId: number, questionId: string) {
    this.surveys.update((list) =>
      list.map((s) => {
        if (s.id !== surveyId) return s;
        const arr = ordered(s.questions);
        const index = arr.findIndex((q) => q.id === questionId);
        if (index === -1) return s;
        const id = uid('q');
        const copy: Question = {
          ...arr[index],
          id,
          title: `${arr[index].title} (cópia)`,
          choices: arr[index].choices.map((c, i) => ({ id: `${id}-o${i + 1}`, label: c.label })),
          rows: [...arr[index].rows],
          columns: [...arr[index].columns],
        };
        arr.splice(index + 1, 0, copy);
        return { ...s, questions: arr.map((q, i) => ({ ...q, order: i })) };
      })
    );
  }

  // ---- Lógica ------------------------------------------------------
  addRule(surveyId: number) {
    const survey = this.surveys().find((s) => s.id === surveyId);
    if (!survey || survey.questions.length < 2) return;
    const list = ordered(survey.questions);
    const rule: LogicRule = {
      id: uid('r'),
      questionId: list[0].id,
      operator: 'igual',
      value: list[0].choices[0]?.label ?? '',
      action: 'pular-para',
      targetId: list[list.length - 1].id,
    };
    this.surveys.update((rows) =>
      rows.map((s) => (s.id === surveyId ? { ...s, logic: [...s.logic, rule] } : s))
    );
  }

  updateRule(surveyId: number, ruleId: string, patch: Partial<LogicRule>) {
    this.surveys.update((rows) =>
      rows.map((s) =>
        s.id === surveyId
          ? { ...s, logic: s.logic.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)) }
          : s
      )
    );
  }

  removeRule(surveyId: number, ruleId: string) {
    this.surveys.update((rows) =>
      rows.map((s) => (s.id === surveyId ? { ...s, logic: s.logic.filter((r) => r.id !== ruleId) } : s))
    );
  }

  // ---- Respostas e contatos ---------------------------------------
  registerResponse(input: NewResponseInput): Response {
    const survey = this.surveys().find((s) => s.id === input.surveyId);
    const now = new Date().toISOString();

    // Se a pessoa deixou um e-mail, ela vira (ou reencontra) um contato.
    let contacts = this.contacts();
    let contactId: number | null = null;
    const emailQuestion = survey?.questions.find((q) => q.type === 'email');
    const emailAnswer = emailQuestion
      ? input.answers.find((a) => a.questionId === emailQuestion.id)
      : undefined;
    const email = typeof emailAnswer?.value === 'string' ? emailAnswer.value.trim().toLowerCase() : '';

    if (email) {
      const found = contacts.find((c) => c.email.toLowerCase() === email);
      if (found) {
        contactId = found.id;
        contacts = contacts.map((c) =>
          c.id === found.id ? { ...c, responseCount: c.responseCount + 1, lastAt: now } : c
        );
      } else {
        const created: Contact = {
          id: nextId(contacts),
          name: email.split('@')[0].replace(/[._-]/g, ' '),
          email,
          avatar: '',
          tags: ['novo'],
          responseCount: 1,
          lastAt: now,
        };
        contactId = created.id;
        contacts = [...contacts, created];
      }
    }

    const response: Response = {
      id: nextId(this.responses()),
      surveyId: input.surveyId,
      at: now,
      durationSec: input.durationSec,
      completed: input.completed,
      source: input.source,
      contactId,
      answers: input.answers.map((a) => ({ ...a })),
    };

    this.responses.update((list) => [...list, response]);
    this.contacts.set(contacts);
    return response;
  }

  removeResponse(id: number) {
    this.responses.update((list) => list.filter((r) => r.id !== id));
  }

  updateContact(id: number, patch: Partial<Contact>) {
    this.contacts.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  removeContact(id: number) {
    this.contacts.update((list) => list.filter((c) => c.id !== id));
    this.responses.update((list) => list.map((r) => (r.contactId === id ? { ...r, contactId: null } : r)));
  }

  reset() {
    const fresh = seed();
    this.surveys.set(fresh.surveys);
    this.responses.set(fresh.responses);
    this.contacts.set(fresh.contacts);
    this.templates.set(fresh.templates);
  }
}
