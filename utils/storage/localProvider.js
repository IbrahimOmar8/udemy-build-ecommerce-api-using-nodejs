const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ensureDir = async (dir) => {
  await mkdir(dir, { recursive: true });
};

/**
 * Save a file buffer to local disk.
 * @param {Buffer} buffer
 * @param {{ folder: string, filename: string }} opts
 * @returns {Promise<{ filename: string, url: string, path: string }>}
 */
exports.save = async (buffer, { folder, filename }) => {
  const dir = path.join(UPLOADS_DIR, folder);
  await ensureDir(dir);
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);
  return {
    filename,
    path: filePath,
    url: `${process.env.BASE_URL || ''}/${folder}/${filename}`,
  };
};

exports.remove = async (filename, { folder }) => {
  const filePath = path.join(UPLOADS_DIR, folder, filename);
  try {
    await unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

exports.getUrl = (filename, { folder }) =>
  `${process.env.BASE_URL || ''}/${folder}/${filename}`;
