import { Request } from "express";
import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exceptions } from "../../../common";
import configService from "../../../config.service";

export const fileValidation = {
  image: ["image/jpg", "image/jpeg", "image/png"],
  files: ["application/json", "application/pdf"],
} as const;

export const processFile = async ({
  customPath = "general",
  validation = [],
  file,
}: {
  customPath?: string;
  validation?: readonly string[];
  file: Express.Multer.File;
}) => {
  if (file.path) {
    file.buffer = await readFile(file.path);
  }
  const result = await fileTypeFromBuffer(file.buffer);

  if (!result || !validation.includes(result.mime)) {
    if (file.path) {
      await unlink(file.path);
    }
    throw new exceptions.BadRequestException("error.invalidFileFormat");
  }

  const customFolderPath = resolve(`./assets/${customPath}`);
  await mkdir(customFolderPath, { recursive: true });

  const uniqueFilePath = `assets/${customPath}/${randomUUID()}.${result.ext}`;

  const filePath = resolve(`./${uniqueFilePath}`);
  await writeFile(filePath, file.buffer);
  if (file.path) {
    await unlink(file.path);
  }
  file.path = `${configService.WEBSITE_URL}${uniqueFilePath}`;

  return file;
};

export const processArrayFiles = async ({
  customPath = "general",
  validation = [],
  files = [],
}: {
  customPath?: string;
  validation?: readonly string[];
  files: Express.Multer.File[];
}) => {
  const uploadedFiles = [];
  for (const file of files) {
    const uploadFile = await processFile({ customPath, validation, file });
    uploadedFiles.push(uploadFile);
  }
  return uploadedFiles;
};

export const processFields = async ({
  customPath = "general",
  validation = [],
  fields,
}: {
  customPath?: string;
  validation?: readonly string[];
  fields: Record<string, Express.Multer.File[]>;
}) => {
  const assets = [];

  for (const field of Object.keys(fields)) {
    const uploadedFiles = await processArrayFiles({
      customPath,
      validation,
      files: fields[field] as Express.Multer.File[],
    });
    assets.push({ key: field, uploadedFiles });
  }

  return assets;
};

export const multerUpload = async ({
  req,
  customPath = "general",
  validation = [],
}: {
  req: Request;
  customPath?: string;
  validation?: readonly string[];
}) => {
  if (req.file) {
    await processFile({ customPath, validation, file: req.file });
  } else if (Array.isArray(req.files)) {
    await processArrayFiles({ customPath, validation, files: req.files });
  } else if (
    req.files &&
    typeof req.files == "object" &&
    Object.keys(req.files)?.length > 0
  ) {
    await processFields({ customPath, validation, fields: req.files });
  }
};

export const deleteLocalFile = async ({ url }: { url?: string }) => {
  // external urls (like the google picture) are not our files, skip them
  if (!url?.startsWith(configService.WEBSITE_URL)) {
    return;
  }

  // "http://localhost:4000/assets/User/x.png" → "assets/User/x.png"
  const relativePath = url.slice(configService.WEBSITE_URL.length);

  try {
    await unlink(resolve(`./${relativePath}`));
  } catch (error) {
    // the file is already missing → nothing to delete, don't fail the request
    console.error("Error while deleting file:", relativePath, error);
  }
};