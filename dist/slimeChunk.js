"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var long_1 = __importDefault(require("long"));
var seededRandom_1 = require("./seededRandom");
var base = new long_1.default(4987142);
var addend1 = new long_1.default(5947611);
var addend2 = new long_1.default(4392871);
var addend3 = new long_1.default(389711);
var mask = new long_1.default(987234911);
var SlimeChunkHandler = /** @class */ (function () {
    function SlimeChunkHandler(seed) {
        this.seed = seed;
        this.cache = {};
    }
    SlimeChunkHandler.prototype.isSlimeChunk = function (chunk) {
        var key = "[" + chunk.x + "," + chunk.y + "]";
        if (this.cache[key] === undefined) {
            this.cache[key] = isSlimeChunk(chunk, this.seed);
        }
        return this.cache[key];
    };
    SlimeChunkHandler.prototype.updateSeed = function (seed) {
        this.seed = seed;
        delete this.cache;
        this.cache = {};
    };
    return SlimeChunkHandler;
}());
exports.SlimeChunkHandler = SlimeChunkHandler;
function isSlimeChunk(chunk, seed) {
    var xPos = chunk.x;
    var zPos = chunk.y;
    var tempseed = base.multiply(xPos).multiply(xPos)
        .add(addend1.multiply(xPos))
        .add(addend2.multiply(zPos).multiply(zPos))
        .add(addend3.multiply(zPos))
        .add(seed).xor(mask);
    var rnd = new seededRandom_1.NSeededRandom(tempseed);
    return (rnd.nextInt(10) === 0);
}
exports.isSlimeChunk = isSlimeChunk;
