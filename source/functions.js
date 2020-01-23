const logger = require('winston');
const request = require('request-promise-native');
// Configure logger settings

module.exports = {
    add(args) {
        let response = 'Must add 2 numbers (Ex: "!add 1 2)"';
            if (args.length === 2) {
            const num1 = Number(args[0]);
            const num2 = Number(args[1]);
            logger.debug(`1: [${num1}], 2: [${num2}]`);

            if (isNaN(num1) || isNaN(num2)) { // if either is not NotANumber
                response = 'Arguments must be numbers'; // Should really throw an error which is caught in bots.js
            } else {
                response = num1 + num2;
            }
        }
        return response;
    },

    async randomImage(args) {
        let response = `Must provide at least 1 search term (Ex: !get nku esports)`;
        if (args.length > 0) {
            response = `Error getting requested image`;
            const keyword = encodeURI(args.join(' ')); // combines arguments for multi-worded search
            let numPhotos = 100;  
            let options = {
                uri: `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=0c748ca30b04100a36deb13f12b3c1d3&tags=${keyword}&sort=relevance&per_page=100&format=json&nojsoncallback=1`,
                json: true
            }
            logger.debug(options);
            await request(options).then(json => {
                if (json.photos.photo.length === 0)
                    response = 'Search returned no results';
                else {
                    numPhotos = json.photos.photo.length; // reset incase less photos are available

                    const photoIndex = Math.floor(Math.random() * Math.floor(numPhotos)); // Random int less than num photos
                    
                    const photo = json.photos.photo[photoIndex];
                    response = `http://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`;
                    logger.debug(response);
                }
            }).catch( err => {
                logger.debug(err);
            });
        }
        return response;
    }

//   isNKUStudent(firstName, lastName) {
//     // Check directory.nku.edu/student and check if the last/name combo returns any students
//   },
};
