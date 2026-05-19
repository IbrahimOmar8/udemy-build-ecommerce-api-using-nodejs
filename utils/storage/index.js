/**
 * Storage abstraction layer.
 * Switch providers via STORAGE_PROVIDER env var (local | s3 | cloudinary).
 * Provider modules expose: save(buffer, opts), remove(filename, opts), getUrl(filename, opts).
 */
const localProvider = require('./localProvider');

const providers = {
  local: localProvider,
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
};
