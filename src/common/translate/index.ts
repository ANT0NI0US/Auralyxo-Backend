import { LanguageEnum } from "../enum";
import ar from "./ar.json";
import en from "./en.json";

export type Dictionary = typeof en;

// kol al paths aly bt-end b string, zy "validation.email.invalid"
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafPaths<Dictionary>;

// al type hna by2kd en ar.json leh nafs al keys aly fy en.json
const dictionaries: Record<LanguageEnum, Dictionary> = {
  [LanguageEnum.AR]: ar,
  [LanguageEnum.EN]: en,
};

export const translate = (lang: LanguageEnum, key: TranslationKey): string => {
  const dictionary = dictionaries[lang] ?? dictionaries[LanguageEnum.EN];
  const message = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dictionary,
    );
  return typeof message === "string" ? message : key;
};
