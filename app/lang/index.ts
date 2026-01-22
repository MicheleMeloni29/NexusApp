import en from "./en.json";
import it from "./it.json";

export const messages = { en, it };
export type Language = keyof typeof messages;
export type Messages = typeof it;

export const defaultLanguage: Language = "en";
