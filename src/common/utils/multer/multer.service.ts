import type { Request } from "express";
import { fileTypeFromBuffer } from "file-type";
import { readFile, unlink } from "node:fs/promises";
import { exceptions, type tps } from "../../../common";

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
  file: tps.FileType;
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

  if (file.path) {
    await unlink(file.path);
  }

  return file;
};

export const processArrayFiles = async ({
  customPath = "general",
  validation = [],
  files = [],
}: {
  customPath?: string;
  validation?: readonly string[];
  files: tps.FileType[];
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
  fields: Record<string, tps.FileType[]>;
}) => {
  const assets = [];

  for (const field of Object.keys(fields)) {
    const uploadedFiles = await processArrayFiles({
      customPath,
      validation,
      files: fields[field] as tps.FileType[],
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
