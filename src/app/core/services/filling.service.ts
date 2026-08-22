import { Injectable, effect, signal } from '@angular/core';
import type { AnswerValue, Survey } from '../data/types';
import {
  type AnswerMap,
  firstQuestionIndex,
  mapToAnswers,
  nextQuestionIndex,
  previousQuestionIndex,
  reachableQuestions,
  ordered,
} from '../data/query';

const STORAGE_KEY = 'sv-filling';

interface Persisted {
  slug: string | null;
  index: number;
  answers: AnswerMap;
  startedAt: string | null;
  submitted: boolean;
  submittedAnswers: AnswerMap;
}

function load(): Persisted {
  const fallback: Persisted = {
    slug: null,
    index: 0,
    answers: {},
    startedAt: null,
    submitted: false,
    submittedAnswers: {},
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<Persisted> } & Partial<Persisted>;
      const s = parsed.state ?? parsed;
      return { ...fallback, ...s };
    }
  } catch {}
  return fallback;
}

/** Preenchimento em andamento do formulário público — persistido em `sv-filling`. */
@Injectable({ providedIn: 'root' })
export class FillingService {
  private initial = load();

  /** Formulário que está sendo preenchido — troca de slug zera o rascunho. */
  readonly slug = signal<string | null>(this.initial.slug);
  /** Índice da pergunta atual dentro de `survey.questions` ordenado. */
  readonly index = signal<number>(this.initial.index);
  readonly answers = signal<AnswerMap>(this.initial.answers);
  readonly startedAt = signal<string | null>(this.initial.startedAt);
  /** Marcado ao enviar; a tela de agradecimento lê daqui. */
  readonly submitted = signal<boolean>(this.initial.submitted);
  readonly submittedAnswers = signal<AnswerMap>(this.initial.submittedAnswers);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            slug: this.slug(),
            index: this.index(),
            answers: this.answers(),
            startedAt: this.startedAt(),
            submitted: this.submitted(),
            submittedAnswers: this.submittedAnswers(),
          })
        );
      } catch {}
    });
  }

  start(survey: Survey) {
    if (this.slug() === survey.slug && !this.submitted()) {
      // Retoma o rascunho persistido do mesmo formulário.
      if (this.startedAt() === null) this.startedAt.set(new Date().toISOString());
      return;
    }
    this.slug.set(survey.slug);
    this.index.set(firstQuestionIndex(survey, {}));
    this.answers.set({});
    this.startedAt.set(new Date().toISOString());
    this.submitted.set(false);
    this.submittedAnswers.set({});
  }

  setAnswer(questionId: string, value: AnswerValue) {
    this.answers.update((map) => ({ ...map, [questionId]: value }));
  }

  goNext(survey: Survey) {
    const next = nextQuestionIndex(survey, this.index(), this.answers());
    this.index.set(Math.min(next, ordered(survey.questions).length));
  }

  goBack(survey: Survey) {
    this.index.set(previousQuestionIndex(survey, this.index(), this.answers()));
  }

  submit(survey: Survey) {
    const started = this.startedAt() ? new Date(this.startedAt() as string).getTime() : Date.now();
    const durationSec = Math.max(20, Math.round((Date.now() - started) / 1000));
    const answers = mapToAnswers(this.answers());
    this.submitted.set(true);
    this.submittedAnswers.set({ ...this.answers() });
    this.index.set(ordered(survey.questions).length);
    return { answers, durationSec };
  }

  restart() {
    this.slug.set(null);
    this.index.set(0);
    this.answers.set({});
    this.startedAt.set(null);
    this.submitted.set(false);
    this.submittedAnswers.set({});
  }

  isLast(survey: Survey): boolean {
    const next = nextQuestionIndex(survey, this.index(), this.answers());
    return next >= ordered(survey.questions).length;
  }

  /** Só as perguntas alcançáveis contam na barra de progresso. */
  progress(survey: Survey): { current: number; total: number; percent: number } {
    const path = reachableQuestions(survey, this.answers());
    const qs = ordered(survey.questions);
    const currentId = qs[this.index()]?.id;
    const at = path.findIndex((q) => q.id === currentId);
    const total = Math.max(1, path.length);
    const current = at === -1 ? total : at + 1;
    return { current, total, percent: Math.round(((current - 1) / total) * 100) };
  }
}
