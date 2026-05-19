const crypto = require('crypto');

/**
 * Generates a unique certificate serial number.
 * Format: CERT-YYYYMMDD-XXXXXXXX
 */
exports.generateSerial = () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${datePart}-${random}`;
};

/**
 * Generates a minimal SVG certificate that can be served or converted to PDF later.
 */
exports.generateSvg = ({ studentName, courseTitle, instructorName, serial, issuedAt }) => {
  const dateStr = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#f8fafc"/>
  <rect x="40" y="40" width="920" height="620" fill="none" stroke="#1e40af" stroke-width="6"/>
  <rect x="60" y="60" width="880" height="580" fill="none" stroke="#1e40af" stroke-width="2"/>
  <text x="500" y="150" text-anchor="middle" font-family="serif" font-size="42" fill="#1e3a8a" font-weight="bold">CERTIFICATE OF COMPLETION</text>
  <text x="500" y="220" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#475569">This certifies that</text>
  <text x="500" y="290" text-anchor="middle" font-family="serif" font-size="40" fill="#0f172a" font-weight="bold">${escapeXml(studentName)}</text>
  <text x="500" y="350" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#475569">has successfully completed the course</text>
  <text x="500" y="410" text-anchor="middle" font-family="serif" font-size="28" fill="#1e3a8a" font-weight="bold">${escapeXml(courseTitle)}</text>
  <text x="500" y="500" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#475569">Instructor: ${escapeXml(instructorName)}</text>
  <text x="500" y="540" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">Issued: ${dateStr}</text>
  <text x="500" y="610" text-anchor="middle" font-family="monospace" font-size="14" fill="#64748b">Serial: ${escapeXml(serial)}</text>
</svg>`;
};

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
