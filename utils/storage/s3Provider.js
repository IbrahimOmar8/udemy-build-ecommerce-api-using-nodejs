const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

let client;
const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
};

const bucket = () => process.env.AWS_S3_BUCKET;

const publicUrl = (key) => {
  if (process.env.AWS_S3_PUBLIC_URL) {
    return `${process.env.AWS_S3_PUBLIC_URL}/${key}`;
  }
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket()}.s3.${region}.amazonaws.com/${key}`;
};

exports.save = async (buffer, { folder, filename, contentType }) => {
  const key = `${folder}/${filename}`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return {
    filename,
    key,
    url: publicUrl(key),
  };
};

exports.remove = async (filename, { folder }) => {
  const key = `${folder}/${filename}`;
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    })
  );
  return true;
};

exports.getUrl = (filename, { folder }) => publicUrl(`${folder}/${filename}`);
