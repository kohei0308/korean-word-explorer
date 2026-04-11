export interface BasicInfo {
  word: string;
  meaning: string;
  pronunciation: string;
  romanization: string;
  partOfSpeech: string;
  level: string;
}

export interface Conjugation {
  haeyoForm: string;
  habnidaForm: string;
  panmalForm: string;
  negativeHaeyo: string;
  negativeHabnida: string;
  pastHaeyo: string;
  pastHabnida: string;
}

export interface GrammarPattern {
  pattern: string;
  explanation: string;
  example: string;
  translation: string;
}

export interface Phrase {
  phrase: string;
  translation: string;
  scene: string;
}

export interface CultureNote {
  note: string;
}

export interface RelatedWord {
  word: string;
  meaning: string;
  relation: string;
}

export interface WordResult {
  basic: BasicInfo;
  conjugation: Conjugation;
  grammar: GrammarPattern[];
  phrases: Phrase[];
  culture: CultureNote;
  related: RelatedWord[];
}

export type UserTier = 'guest' | 'free' | 'premium';

export interface LookupResponse {
  data?: WordResult;
  error?: string;
  cached?: boolean;
  isPremium?: boolean;
  tier?: UserTier;
  usage?: { count: number; limit: number };
}
