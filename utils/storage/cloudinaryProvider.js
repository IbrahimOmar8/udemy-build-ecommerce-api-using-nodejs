const { v2: cloudinary } = require('cloudinary');

let configured = false;
const configure = () => {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
};

const resourceTypeFor = (folder = '') => {
  if (folder.includes('video')) return 'video';
  if (folder.includes('attachment') || folder.includes('submission')) return 'raw';
  return 'image';
};

exports.save = async (buffer, { folder, filename }) => {
  configure();
  const publicId = filename.replace(/\.[^/.]+$/, '');
  const resourceType = resourceTypeFor(folder);

  const result = await new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    upload.end(buffer);
  });

  return {
    filename,
    key: result.public_id,
    url: result.secure_url,
  };
};

exports.remove = async (filename, { folder }) => {
  configure();
  const publicId = `${folder}/${filename.replace(/\.[^/.]+$/, '')}`;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceTypeFor(folder),
  });
  return true;
};

exports.getUrl = (filename, { folder }) => {
  configure();
  const publicId = `${folder}/${filename.replace(/\.[^/.]+$/, '')}`;
  return cloudinary.url(publicId, {
    resource_type: resourceTypeFor(folder),
    secure: true,
  });
};
