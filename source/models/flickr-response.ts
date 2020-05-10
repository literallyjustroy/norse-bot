export interface FlickrResponse {
    photos: {
        photo: FlickrPhoto[];
    };
}

interface FlickrPhoto {
    farm: string;
    server: string;
    id: string;
    secret: string;
}