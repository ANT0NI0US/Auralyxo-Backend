import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Progress, Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
// import { createReadStream } from "node:fs";
import {
  // enums,
  exceptions,
  tps,
} from "../../common";
import configService from "../../config.service";

export class CloudService {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: configService.AWS_REGION,
      credentials: {
        accessKeyId: configService.AWS_ACCESS_KEY_ID,
        secretAccessKey: configService.AWS_ACCESS_SECRET_KEY,
      },
    });
  }

  private generateKey({
    path = "General",
    file,
  }: {
    path: string;
    file: tps.FileType;
  }) {
    return `${configService.APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`;
  }

  async createUploadPreSignedAssetLink({
    path = "General",
    Bucket = configService.AWS_BUCKET_NAME,
    Originalname,
    ContentType,
    expiresIn = configService.AWS_EXPIRES_IN,
  }: {
    path?: string;
    Bucket?: string;
    Originalname: string;
    ContentType: string;
    expiresIn?: number;
  }): Promise<{ Key: string; url: string }> {
    const Key = `${configService.APPLICATION_NAME}/${path}/${randomUUID()}_${Originalname}`;

    const command = new PutObjectCommand({
      Bucket,
      Key,
      ContentType,
    });

    // to make sure that asset is uploaded ok.
    if (!command.input.Key) {
      throw new exceptions.BadRequestException("error.failToUpload");
    }

    await this.client.send(command);
    // how to use the url: dos 3la al url aly hyrg3 dh tmm b3dha 5ly al method put b3d kdh a5tar body -> binary w nzl al sora 2bl al expiresIn
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, Key: command.input.Key };
  }

  async createFetchPreSignedAssetLink({
    Bucket = configService.AWS_BUCKET_NAME,
    expiresIn = configService.AWS_EXPIRES_IN,
    Key,
    download = "false",
    filename,
  }: {
    Bucket?: string;
    expiresIn?: number;
    Key: string;
    download?: "true" | "false";
    filename?: string | undefined;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${filename || Key.split("/").pop()}"`
          : undefined,
    });

    // how to use the url: dos 3la al url aly hyrg3 dh tmm b3dha 5ly al method put b3d kdh a5tar body -> binary w nzl al sora 2bl al expiresIn
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return url;
  }

  // upload small files to 5G only.
  async uploadAsset({
    // storageApproach = enums.StorageApproachEnum.MEMORY,
    path = "General",
    file,
    Bucket = configService.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
  }: {
    // storageApproach?: enums.StorageApproachEnum;
    path?: string;
    file: tps.FileType;
    Bucket?: string;
    ACL?: ObjectCannedACL;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket,
      Key: this.generateKey({ path, file }),
      ACL,
      // * we didn't add storageApproach here cause we handle this in processFile in multer.service
      // Body:
      //   storageApproach === enums.StorageApproachEnum.MEMORY
      //     ? file.buffer
      //     : createReadStream(file.path),
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    // to make sure that asset is uploaded ok.
    if (!command.input.Key) {
      throw new exceptions.BadRequestException("error.failToUpload");
    }

    await this.client.send(command);

    return command.input.Key;
  }

  /*
 * upload huge files to 5T.
 - dh bydyk msa7a 5 tera byte w dh kbeer tb3n gdn w by2sm al t7myl dh 3la trials kdh kol ma trial y5ls byro7 lly b3do w lw fyh 7aga bazt fyh t2dr t3yd aly baz bs m4 al file kolo akeed hwa a2l 7aga fyh by default 5 megabyte min size bta3o 5 megabyte a2l mn kdh hydyna error
*/
  async uploadLargeAsset({
    // storageApproach = enums.StorageApproachEnum.DISK,
    path = "General",
    file,
    Bucket = configService.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
    partSize = 5,
  }: {
    // storageApproach?: enums.StorageApproachEnum;
    path?: string;
    file: tps.FileType;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: this.generateKey({ path, file }),
        ACL,
        // Body:
        //   storageApproach === enums.StorageApproachEnum.MEMORY
        //     ? file.buffer
        //     : createReadStream(file.path),
        Body: file.buffer,
        ContentType: file.mimetype,
      },
      partSize: partSize * 1024 * 1024,
    });

    uploadFile.on("httpUploadProgress", (progress: Progress) => {
      console.log(progress);
      console.log(
        `Upload file is ${((progress.loaded as number) / (progress.total as number)) * 100}  % `,
      );
    });

    return await uploadFile.done();
  }

  async uploadAssets({
    // storageApproach = enums.StorageApproachEnum.MEMORY,
    path = "General",
    files,
    Bucket = configService.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
  }: {
    // storageApproach?: enums.StorageApproachEnum;
    path?: string;
    files: tps.FileType[];
    Bucket?: string;
    ACL?: ObjectCannedACL;
  }): Promise<string[]> {
    let urls: string[] = [];

    // * first approach (dh ana m4 bst5dmo 34an hna kol file hy5ls aly b3do hy4t8l fa lw kol wa7d hya5od 1 sec fa total lw ana rf3t 3 fa hyb2a 3 seconds)
    // for (const file of files) {
    //   urls.push(
    //     await this.uploadAsset({ storageApproach, path, file, Bucket, ACL }),
    //   );
    // }

    // * second approach (dh asr3 34an lw ana raf3 3 files kol wa7d 1 second kolo hy3ml run m3 b3do fa hyb2a total 1 second l kolo)
    urls = await Promise.all(
      files.map((file) =>
        this.uploadAsset({
          // storageApproach,
          path,
          file,
          Bucket,
          ACL,
        }),
      ),
    );

    return urls;
  }

  async uploadLargeAssets({
    // storageApproach = enums.StorageApproachEnum.MEMORY,
    path = "General",
    files,
    Bucket = configService.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
    partSize = 5,
  }: {
    // storageApproach?: enums.StorageApproachEnum;
    path?: string;
    files: tps.FileType[];
    Bucket?: string;
    ACL?: ObjectCannedACL;
    partSize?: number;
  }): Promise<string[]> {
    let urls: string[] = [];

    let assets = await Promise.all(
      files.map((file) =>
        this.uploadLargeAsset({
          // storageApproach,
          path,
          file,
          Bucket,
          ACL,
          partSize,
        }),
      ),
    );

    urls = assets.map((asset) => asset.Key as string);

    return urls;
  }

  async getAsset({
    Key,
    Bucket = configService.AWS_BUCKET_NAME,
  }: {
    Key: string;
    Bucket?: string;
  }): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });

    return await this.client.send(command);
  }

  async deleteAsset({
    Key,
    Bucket = configService.AWS_BUCKET_NAME,
  }: {
    Key?: string;
    Bucket?: string;
  }): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });

    return await this.client.send(command);
  }

  async deleteAssets({
    Keys,
    Bucket = configService.AWS_BUCKET_NAME,
  }: {
    Keys: string[];
    Bucket?: string;
  }): Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys?.map((key) => {
          return {
            Key: key,
          };
        }),
      },
    });

    return await this.client.send(command);
  }

  async listFileDir({
    prefix,
    Bucket = configService.AWS_BUCKET_NAME,
  }: {
    prefix: string;
    Bucket?: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${configService.APPLICATION_NAME}/${prefix}`,
    });

    return await this.client.send(command);
  }

  async deleteFileDir({
    prefix,
    Bucket = configService.AWS_BUCKET_NAME,
  }: {
    prefix: string;
    Bucket?: string;
  }): Promise<DeleteObjectsCommandOutput | void> {
    const { Contents } = await this.listFileDir({ prefix, Bucket });

    // the user has no files → nothing to delete (S3 rejects an empty delete)
    if (!Contents?.length) {
      return;
    }
    const Keys = Contents.map((ele) => ele.Key) as string[];

    await this.deleteAssets({ Keys, Bucket });
  }
}

export const cloudService = new CloudService();
