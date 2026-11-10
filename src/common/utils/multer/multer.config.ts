import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { enums } from "../..";

export const createUploader = ({
  maxFileSize = 5,
  storageApproach = enums.StorageApproachEnum.MEMORY,
}: {
  maxFileSize?: number;
  storageApproach?: enums.StorageApproachEnum;
} = {}) => {
  const storage =
    storageApproach == enums.StorageApproachEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: async function (req, file, cb) {
            cb(null, tmpdir());
          },

          filename: function (req, file, cb) {
            cb(null, randomUUID() + "__" + file.originalname);
          },
        });

  return multer({
    storage,
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });
};
