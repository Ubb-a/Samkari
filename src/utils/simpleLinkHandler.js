/**
 * Simple link formatter that doesn't use async operations
 * @param {string} url - The URL to format
 * @returns {string} - Formatted link text
 */
function formatLinkDisplay(url) {
    try {
        // Check if it's a YouTube link
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // Extract video ID and create a simple title
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
            if (videoIdMatch) {
                return `[YouTube Video](${url})`;
            }
        }
        
        // For other links, try to extract domain name
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            return `[${domain}](${url})`;
        } catch {
            return `[Link](${url})`;
        }
    } catch (error) {
        console.error('Error formatting link:', error);
        return url; // Return original URL if formatting fails
    }
}

/**
 * Format multiple links
 * @param {Array<string>} links - Array of URLs
 * @returns {Array<string>} - Array of formatted link texts
 */
function formatLinksDisplay(links) {
    return links.map(link => formatLinkDisplay(link));
}

module.exports = {
    formatLinkDisplay,
    formatLinksDisplay
};