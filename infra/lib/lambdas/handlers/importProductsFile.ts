import { Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3 = new S3({ signatureVersion: 'v4' });

export const main: Handler = async (event) => {
  try {
    console.log('Event:', event);

    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Bucket name not set in environment variables');
    }

    const fileName = event?.name;
    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing query parameter: name' }),
      };
    }

    const key = `uploaded/${fileName}`;

    const signedUrl = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 600,
      ContentType: 'text/csv',
    });

    return {
        uploadUrl: signedUrl,
        key,
      };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
