import argon2 from "argon2";

export const hash = async ({
  plainText,
}: {
  plainText: string;
}): Promise<string> => {
  if (typeof plainText !== "string") {
    plainText = String(plainText);
  }
  const cipherText = await argon2.hash(plainText);

  return cipherText;
};

export const compare = async ({
  plainText,
  cipherText,
}: {
  plainText: string;
  cipherText: string;
}): Promise<boolean> => {
  return await argon2.verify(cipherText, plainText);
};
