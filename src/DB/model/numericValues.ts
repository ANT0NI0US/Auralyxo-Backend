export const numericValues = (e: object): number[] =>
  Object.values(e).filter((v): v is number => typeof v === "number");
