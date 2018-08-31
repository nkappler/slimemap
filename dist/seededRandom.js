"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var big_integer_1 = __importDefault(require("../node_modules/big-integer"));
/**
 * partial seededRandom as in Java
 */
var SeededRandom = /** @class */ (function () {
    function SeededRandom(initseed, base) {
        this.multiplier = big_integer_1.default("5DEECE66D", 16);
        this.seed = big_integer_1.default(0); //gets overwritten in constructor but need to satisfy tsc
        this.addend = big_integer_1.default("B", 16);
        this.mask = big_integer_1.default("ffffffffffff", 16);
        if (initseed === undefined) {
            this.setSeed(big_integer_1.default(Date.now()));
        }
        else if (typeof initseed === "string") {
            this.setSeed(big_integer_1.default(initseed, base));
        }
        else if (typeof initseed === "number") {
            this.setSeed(big_integer_1.default(initseed));
        }
        else {
            this.setSeed(big_integer_1.default(initseed));
        }
    }
    SeededRandom.prototype.initialScramble = function (seed) {
        var temp = seed.xor(this.multiplier);
        return temp.and(this.mask);
    };
    SeededRandom.prototype.setSeed = function (newseed) {
        this.seed = this.initialScramble(newseed);
    };
    SeededRandom.prototype.next = function (bits) {
        var oldseed = this.seed;
        var nextseed = oldseed.multiply(this.multiplier).add(this.addend).and(this.mask);
        this.seed = nextseed;
        return Math.floor(nextseed.shiftRight(48 - bits).toJSNumber());
    };
    SeededRandom.prototype.nextInt = function (b) {
        var bound = Math.abs(b);
        var r = this.next(31);
        var m = bound - 1;
        // tslint:disable-next-line:no-bitwise
        if ((bound & m) === 0) { // i.e., bound is a power of 2
            // tslint:disable-next-line:no-bitwise
            r = Math.floor((bound * r) >> 31);
        }
        else {
            for (var u = r; 
            // tslint:disable-next-line:no-conditional-assignment
            u - (r = u % bound) + m < 0; u = this.next(31)) { /**/ }
        }
        return r;
    };
    SeededRandom.prototype.getSeed = function () {
        return this.seed;
    };
    return SeededRandom;
}());
exports.SeededRandom = SeededRandom;
