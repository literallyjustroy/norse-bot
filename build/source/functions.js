"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var logger = require('winston');
var request = require('request-promise-native');
// Configure logger settings
module.exports = {
    ping: function () {
    },
    /**
     * Adds two numbers together
     * @param args
     * @returns {string}
     */
    add: function (args) {
        var response = 'Must add 2 numbers (Ex: "!add 1 2)"';
        if (args.length === 2) {
            var num1 = Number(args[0]);
            var num2 = Number(args[1]);
            logger.debug("1: [" + num1 + "], 2: [" + num2 + "]");
            if (isNaN(num1) || isNaN(num2)) { // if either is not NotANumber
                response = 'Arguments must be numbers'; // Should really throw an error which is caught in bots.js
            }
            else {
                response = num1 + num2;
            }
        }
        return response;
    },
    /**
     *
     * @param args
     * @returns {Promise<string>}
     */
    randomImage: function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var response, keyword, numPhotos_1, options;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        response = "Must provide at least 1 search term (Ex: !get nku esports)";
                        if (!(args.length > 0)) return [3 /*break*/, 2];
                        response = "Error getting requested image";
                        keyword = encodeURI(args.join(' '));
                        numPhotos_1 = 100;
                        options = {
                            uri: "https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=0c748ca30b04100a36deb13f12b3c1d3&tags=" + keyword + "&sort=relevance&per_page=100&format=json&nojsoncallback=1",
                            json: true
                        };
                        logger.debug(options);
                        return [4 /*yield*/, request(options).then(function (json) {
                                if (json.photos.photo.length === 0)
                                    response = 'Search returned no results';
                                else {
                                    numPhotos_1 = json.photos.photo.length; // reset incase less photos are available
                                    var photoIndex = Math.floor(Math.random() * Math.floor(numPhotos_1)); // Random int less than num photos
                                    var photo = json.photos.photo[photoIndex];
                                    response = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
                                    logger.debug(response);
                                }
                            }).catch(function (err) {
                                logger.debug(err);
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, response];
                }
            });
        });
    }
    //   isNKUStudent(firstName, lastName) {
    //     // Check directory.nku.edu/student and check if the last/name combo returns any students
    //   },
};
