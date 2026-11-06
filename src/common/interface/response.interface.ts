import { TranslationKey } from "../translate";

export interface IResponse<T = any, Z = any> {
  status?: number;
  message?: TranslationKey;
  data?: T;
  extra?: Z;
}
