import { URL } from "node:url";

// These are known malicious/internal ranges to block
const BLOCKED_IPS = [
  /^127\./,           // Loopback IPv4
  /^10\./,            // Private IPv4
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private IPv4
  /^192\.168\./,      // Private IPv4
  /^169\.254\./,      // Link-local IPv4 (AWS metadata, etc)
  /^0\./,             // Current network
  /^224\./,           // Multicast
  /^240\./,           // Reserved
  /^::1$/,            // Loopback IPv6
  /^fc00:/,           // Unique local IPv6
  /^fd/,              // Unique local IPv6
  /^fe80:/,           // Link-local IPv6
  /^::ffff:/          // IPv4-mapped IPv6 (prevent bypass via mapped private IPs)
];

const BLOCKED_HOSTS = [
  'localhost',
  'broadcasthost',
  'metadata.google.internal',
  '169.254.169.254'
];

/**
 * Validates a URL against SSRF and basic formatting issues.
 * @param {string} targetUrl The URL to validate
 * @returns {string} The parsed and validated URL as a string, or throws an Error.
 */
export function validateExternalMediaUrl(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error("Missing or invalid URL");
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    throw new Error("Malformed URL");
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error("Unsupported protocol. Only HTTP and HTTPS are allowed.");
  }

  let hostname = parsed.hostname.toLowerCase();
  
  // Remove brackets if IPv6
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // Basic host checking
  if (BLOCKED_HOSTS.includes(hostname)) {
    throw new Error("Blocked internal hostname");
  }

  // IP checking
  const isIp = /^[0-9a-fA-F:.]+$/.test(hostname);
  if (isIp) {
    for (const regex of BLOCKED_IPS) {
      if (regex.test(hostname)) {
        throw new Error("Blocked internal IP address");
      }
    }
  }

  // Add protection against IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (hostname.includes('::ffff:')) {
    const extractedIpv4 = hostname.split('::ffff:')[1];
    for (const regex of BLOCKED_IPS) {
      if (regex.test(extractedIpv4)) {
        throw new Error("Blocked internal IP address (IPv4-mapped IPv6)");
      }
    }
  }

  return parsed.toString();
}
