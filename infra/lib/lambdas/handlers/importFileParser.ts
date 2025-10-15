import { Handler, S3Event } from "aws-lambda";
import { S3, SQS } from "aws-sdk";
import csv from "csv-parser";

const s3 = new S3({ signatureVersion: "v4" });
const sqs = new SQS();
const SQS_URL = process.env.SQS_URL!;

export const main: Handler = async (event: S3Event) => {

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    try {
      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      const sendMessagePromises: Promise<any>[] = [];

      await new Promise<void>(async (resolve, reject) => {
        s3Stream
          .pipe(csv())
          .on("data", async (data) => {

            const params = {
              QueueUrl: SQS_URL,
              MessageBody: JSON.stringify(data),
            };

            const sendPromise = sqs.sendMessage(params).promise();
            sendMessagePromises.push(sendPromise);
          })
          .on("end", async  () => {
            await Promise.all(sendMessagePromises);
            resolve();
          })
          .on("error", (err) => {
            reject(err);
          });
      });
    } catch (err) {
      throw err;
    }
  }

  return { statusCode: 200 };
};
