/**
 * Storage abstraction layer.
 * Switch providers via STORAGE_PROVIDER env var (local | s3 | cloudinary).
 * Provider modules expose: save(buffer, opts), remove(filename, opts), getUrl(filename, opts).
 */
const providers = {
  local: require('./localProvider'),
  s3: require('./s3Provider'),
  cloudinary: require('./cloudinaryProvider'),
};

const getProvider = () => {
  const name = process.env.STORAGE_PROVIDER || 'local';
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown storage provider: ${name}`);
  }
  return provider;
};

module.exports = {
  save: (...args) => getProvider().save(...args),
  remove: (...args) => getProvider().remove(...args),
  getUrl: (...args) => getProvider().getUrl(...args),
  getActiveProvider: () => process.env.STORAGE_PROVIDER || 'local',
};
