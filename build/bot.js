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
var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var botFunctions = require('./source/functions');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
    colorize: true,
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', function () {
    logger.info('Bot Connected');
});
bot.on('message', function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var args, cmd, _a, _b, _c, result;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!(message.content.substring(0, 1) === '!' && !message.author.bot)) return [3 /*break*/, 11];
                args = message.content.substring(1).split(' ');
                cmd = args[0];
                args = args.splice(1);
                logger.debug("cmd: '" + cmd + "'");
                logger.debug("args: [" + args + "]");
                _a = cmd;
                switch (_a) {
                    case 'ping': return [3 /*break*/, 1];
                    case 'smile': return [3 /*break*/, 4];
                    case 'get': return [3 /*break*/, 6];
                    case 'add': return [3 /*break*/, 9];
                }
                return [3 /*break*/, 11];
            case 1:
                _c = (_b = message.channel).send;
                return [4 /*yield*/, botFunctions.ping()];
            case 2: return [4 /*yield*/, _c.apply(_b, [_d.sent()])];
            case 3:
                _d.sent();
                return [3 /*break*/, 11];
            case 4: return [4 /*yield*/, message.react('😄')];
            case 5:
                _d.sent();
                return [3 /*break*/, 11];
            case 6: return [4 /*yield*/, botFunctions.randomImage(args)];
            case 7:
                result = _d.sent();
                return [4 /*yield*/, message.channel.send(result)];
            case 8:
                _d.sent();
                return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, message.channel.send(botFunctions.add(args))];
            case 10:
                _d.sent();
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
bot.login(auth.token);
