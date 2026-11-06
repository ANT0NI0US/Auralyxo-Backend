import crypto from "node:crypto";
import configService from "../../config.service";

export const encrypt = async (plainText: string): Promise<string> => {
  const iv = crypto.randomBytes(configService.IV_LENGTH);
  const cipherIv = crypto.createCipheriv(
    "aes-256-cbc",
    configService.ENC_KEY,
    iv,
  );
  let cipherText = cipherIv.update(plainText, "utf-8", "hex");
  cipherText += cipherIv.final("hex");
  return `${iv.toString("hex")}:${cipherText}`;
};

export const decrypt = async (cipherText: string): Promise<string> => {
  const [iv, encryptedText] = cipherText.split(":") as [
    string | Buffer,
    string,
  ];

  const binaryLikeIv = Buffer.from(iv as string, "hex");
  const decipherIv = crypto.createDecipheriv(
    "aes-256-cbc",
    configService.ENC_KEY,
    binaryLikeIv,
  );

  let plainText = decipherIv.update(encryptedText, "hex", "utf8");
  plainText += decipherIv.final("utf-8");

  return plainText;
};
