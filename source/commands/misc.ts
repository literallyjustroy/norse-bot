import { FlickrResponse } from '../models/flickr-response';
import { logger }  from '../util/log';
import fetch from 'node-fetch';

/**
 * Calculates how long it took for a user's message to reach the bot (starting from when the user sent the message)
 * User PC -> Discord's Servers -> NorseBot
 * @param sentTime
 */
export function getPing(sentTime: number): string {
    return String(Math.abs(Date.now().valueOf() - sentTime)) + ' ms';
}

/**
 * Returns a random image given a list of strings as keywords
 * Hits the FlickrAPI and selects a random photo from the top 100 relevant results
 * @param keywords A list of strings to be searched against
 * @returns {Promise<string>} Returns a URL of a photo as a string, or an error message
 */
export async function randomImage(keywords: string[]): Promise<string> {
    let response: string;
    const keyword = encodeURI(keywords.join(' '));
    let numPhotos = 100;
    const url = `https://www.flickr.com/services/rest/?method=flickr.photos.search&sort=relevance&per_page=100&format=json&nojsoncallback=1&api_key=0c748ca30b04100a36deb13f12b3c1d3&tags=${keyword}`;

    try {
        const apiResponse = await fetch(url);
        const flickrResponse = await apiResponse.json() as FlickrResponse;

        if (flickrResponse.photos.photo.length === 0)
            response = 'Search returned no results';
        else {
            numPhotos = flickrResponse.photos.photo.length; // reset incase less photos are available

            const photoIndex = Math.floor(Math.random() * Math.floor(numPhotos)); // Random int less than num photos

            const photo = flickrResponse.photos.photo[photoIndex];
            response = `http://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`;
        }
    } catch(error) {
        response = 'Error getting requested image';
    }
    return response;
}