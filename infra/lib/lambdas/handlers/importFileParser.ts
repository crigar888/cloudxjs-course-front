import { Handler, S3Event } from "aws-lambda";
import { S3, SQS } from "aws-sdk";
import csv from "csv-parser";

const s3 = new S3({ signatureVersion: "v4" });
const sqs = new SQS();
const SQS_URL = process.env.SQS_URL!;

export const main: Handler = async (event: S3Event) => {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Processing file from S3: ${bucket}/${key}`);

    try {
      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      const sendMessagePromises: Promise<any>[] = [];

      await new Promise<void>(async (resolve, reject) => {
        s3Stream
          .pipe(csv())
          .on("data", async (data) => {
            console.log("Parsed record:", data);

            const params = {
              QueueUrl: SQS_URL,
              MessageBody: JSON.stringify(data),
            };

            const sendPromise = sqs.sendMessage(params).promise()
              .then((res) => console.log("✅ Sent to SQS:", res.MessageId))
              .catch((err) => console.error("❌ Failed to send message:", err));
            sendMessagePromises.push(sendPromise);
          })
          .on("end", async  () => {
            console.log("CSV parsing completed.");
            await Promise.all(sendMessagePromises);
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
