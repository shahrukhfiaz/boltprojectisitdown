/**
 * Formats a URL by adding protocol and TLD if missing
 * @param url The URL to format
 * @returns Properly formatted URL
 */
export const formatUrl = (url: string): string => {
  let formattedUrl = url.trim();
  
  // Remove any leading/trailing whitespace
  formattedUrl = formattedUrl.trim();
  
  // Add https:// if no protocol is specified
  if (!formattedUrl.match(/^[a-zA-Z]+:\/\//)) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Add .com if no TLD is specified
  const urlObj = new URL(formattedUrl);
  if (!urlObj.hostname.includes('.')) {
    formattedUrl = formattedUrl.replace(urlObj.hostname, `${urlObj.hostname}.com`);
  }
  
  return formattedUrl;
};

/**
 * Validates if a string is a valid URL
 * @param url The URL to validate
 * @returns Boolean indicating if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(formatUrl(url));
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Extracts the domain name from a URL
 * @param url The URL to extract domain from
 * @returns Domain name
 */
export const getDomainName = (url: string): string => {
  try {
    const urlObj = new URL(formatUrl(url));
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};