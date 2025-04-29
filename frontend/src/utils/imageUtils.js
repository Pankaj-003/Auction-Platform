/**
 * Utility function to generate placeholder image data URIs
 */

/**
 * Generates a placeholder image data URI
 * @param {number} width - Width of the placeholder
 * @param {number} height - Height of the placeholder
 * @param {string} text - Text to display on the placeholder
 * @returns {string} Data URI for the placeholder image
 */
export const getPlaceholderImage = (width = 300, height = 200, text = "No Image") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="18" text-anchor="middle" fill="#999999">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Generates a placeholder image for premium items
 * @returns {string} Data URI for the premium items placeholder
 */
export const getPremiumItemsPlaceholder = () => {
  return getPlaceholderImage(500, 400, "Premium Items");
};

/**
 * Generates a standard item placeholder
 * @returns {string} Data URI for the standard item placeholder
 */
export const getItemPlaceholder = () => {
  return getPlaceholderImage(300, 220, "Item");
};

/**
 * Generates a auction item placeholder
 * @returns {string} Data URI for the auction item placeholder
 */
export const getAuctionItemPlaceholder = () => {
  return getPlaceholderImage(300, 200, "No Image");
}; 