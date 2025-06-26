const https = require('https');
const http = require('http');

/**
 * Extract video title from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {Promise<string>} - Video title or fallback text
 */
async function getYouTubeTitle(url) {
    try {
        // Extract video ID from various YouTube URL formats
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (!videoIdMatch) return null;
        
        const videoId = videoIdMatch[1];
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=YOUR_API_KEY&part=snippet`;
        
        // For now, we'll extract title from the URL structure or use a simple fetch
        // In a production environment, you'd use YouTube API
        return await fetchPageTitle(url);
    } catch (error) {
        console.error('Error fetching YouTube title:', error);
        return null;
    }
}

/**
 * Fetch page title from any URL
 * @param {string} url - Any URL
 * @returns {Promise<string>} - Page title or null
 */
async function fetchPageTitle(url) {
    return new Promise((resolve) => {
        try {
            const protocol = url.startsWith('https://') ? https : http;
            const request = protocol.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                    // Stop collecting data once we find the title tag
                    if (data.includes('</title>')) {
                        response.destroy();
                    }
                });
                
                response.on('end', () => {
                    const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
                    if (titleMatch && titleMatch[1]) {
                        let title = titleMatch[1].trim();
                        // Clean up YouTube titles
                        title = title.replace(' - YouTube', '');
                        resolve(title);
                    } else {
                        resolve(null);
                    }
                });
                
                response.on('error', () => resolve(null));
            });
            
            request.on('error', () => resolve(null));
            request.setTimeout(5000, () => {
                request.destroy();
                resolve(null);
            });
        } catch (error) {
            resolve(null);
        }
    });
}

/**
 * Format link with title for display
 * @param {string} url - The URL
 * @returns {Promise<string>} - Formatted link text
 */
async function formatLinkWithTitle(url) {
    try {
        let title = null;
        
        // Check if it's a YouTube link
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            title = await getYouTubeTitle(url);
        } else {
            title = await fetchPageTitle(url);
        }
        
        if (title) {
            // Limit title length to 50 characters
            if (title.length > 50) {
                title = title.substring(0, 47) + '...';
            }
            return `[${title}](${url})`;
        } else {
            // Fallback to shortened URL
            const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
            return `[${displayUrl}](${url})`;
        }
    } catch (error) {
        console.error('Error formatting link:', error);
        return `[Link](${url})`;
    }
}

/**
 * Process multiple links and format them
 * @param {Array<string>} links - Array of URLs
 * @returns {Promise<Array<string>>} - Array of formatted link texts
 */
async function formatLinksWithTitles(links) {
    const promises = links.map(link => formatLinkWithTitle(link));
    return Promise.all(promises);
}

module.exports = {
    getYouTubeTitle,
    fetchPageTitle,
    formatLinkWithTitle,
    formatLinksWithTitles
};