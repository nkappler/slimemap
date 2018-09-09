"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var long_1 = __importStar(require("long"));
var nmultiplier = new long_1.default(0xDEECE66D, 0x5);
var naddend = new long_1.default(0xB);
var nmask = new long_1.default(0xFFFFFFFF, 0xFFFF);
var NSeededRandom = /** @class */ (function () {
    function NSeededRandom(initseed) {
        this.seed = this.initialScramble(initseed);
    }
    NSeededRandom.prototype.initialScramble = function (seed) {
        return seed.xor(nmultiplier).and(nmask);
    };
    NSeededRandom.prototype.next = function (bits) {
        this.seed = this.seed.multiply(nmultiplier).add(naddend).and(nmask);
        return this.seed.shiftRight(48 - bits);
    };
    NSeededRandom.prototype.nextInt = function (b) {
        var bound = new long_1.default(Math.abs(b));
        if (bound.and(bound.negate()).isZero()) { // i.e., bound is a power of 2
            return (bound.multiply(this.next(31)).shiftRight(31)).toInt();
        }
        // tslint:disable-next-line:one-variable-per-declaration
        var bits, val;
        do {
            bits = this.next(31);
            val = bits.modulo(bound);
        } while (bits.sub(val).add(bound.sub(long_1.ONE)).lessThan(long_1.ZERO));
        return val.toInt();
    };
    return NSeededRandom;
}());
exports.NSeededRandom = NSeededRandom;
