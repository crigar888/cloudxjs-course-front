import { Handler, S3Event } from "aws-lambda";
import { S3 } from "aws-sdk";
import csv from "csv-parser";
import { Readable } from "stream";

const s3 = new S3({ signatureVersion: "v4" });

export const main: Handler = async (event: S3Event) => {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Processing file from S3: ${bucket}/${key}`);

    try {
      // Get object as a stream
      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      // Wrap in a Promise so Lambda waits until the stream finishes
      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csv())
          .on("data", (data) => {
            console.log("Parsed record:", data);
          })
          .on("end", () => {
            console.log("CSV parsing completed.");
            resolve();
          })
          .on("error", (err) => {
            console.error("Error while parsing CSV:", err);
            reject(err);
          });
      });
    } catch (err) {
      console.error("Error processing file:", err);
      throw err;
    }
  }

  return { statusCode: 200 };
};
