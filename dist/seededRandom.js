"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const bigInt = require("bigInt");
/**
 * minified seededRandom as in Java
 */
var SeededRandom = /** @class */ (function () {
    function SeededRandom(initseed) {
        if (initseed === undefined)
            initseed = Date.now();
        this.seed = bigInt(initseed);
        this.seed = this.initialScramble(this.seed);
        this.multiplier = bigInt("5DEECE66D", 16);
        this.addend = bigInt("B", 16);
        this.mask = bigInt("281474976710655");
        this.seed = this.initialScramble(this.seed);
    }
    SeededRandom.prototype.initialScramble = function (seed) {
        var temp = seed.TwosCompXor(this.multiplier, 64);
        return temp.TwosCompAnd(this.mask, 64);
    };
    ;
    SeededRandom.prototype.setSeed = function (newseed) {
        this.seed = this.initialScramble(newseed);
    };
    ;
    SeededRandom.prototype.next = function (bits) {
        var oldseed = this.seed;
        var nextseed = oldseed.multiply(this.multiplier).add(this.addend).TwosCompAnd(this.mask);
        this.seed = nextseed;
        return Math.floor(nextseed.shiftRight(48 - bits));
    };
    ;
    SeededRandom.prototype.nextInt = function (bound) {
        if (bound <= 0)
            bound *= -1;
        var r = this.next(31);
        var m = bound - 1;
        if ((bound & m) === 0) // i.e., bound is a power of 2
            r = Math.floor((bound * r) >> 31);
        else {
            for (var u = r; u - (r = u % bound) + m < 0; u = this.next(31))
                ;
        }
        return r;
    };
    ;
    SeededRandom.prototype.getSeed = function () {
        return this.seed;
    };
    ;
    return SeededRandom;
}());
exports.SeededRandom = SeededRandom;
;
