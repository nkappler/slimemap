import bigInt, { BigInteger, BigNumber } from "../node_modules/big-integer";

/**
 * partial seededRandom as in Java
 */
export class SeededRandom {
    private multiplier = bigInt("5DEECE66D", 16);
    private seed: BigInteger = bigInt(0); //gets overwritten in constructor but need to satisfy tsc
    private addend = bigInt("B", 16);
    private mask = bigInt("ffffffffffff", 16);

    public constructor(initseed: number | BigInteger)
    public constructor(initseed: string, base?: BigNumber)
    public constructor(initseed?: string | number | BigInteger, base?: BigNumber) {
        if (initseed === undefined) {
            this.setSeed(bigInt(Date.now()));
        } else if (typeof initseed === "string") {
            this.setSeed(bigInt(initseed, base));
        } else if (typeof initseed === "number") {
            this.setSeed(bigInt(initseed));
        } else {
            this.setSeed(bigInt(initseed));
        }
    }

    private initialScramble(seed: BigInteger) {
        const temp = seed.xor(this.multiplier);
        return temp.and(this.mask);
    }

    private setSeed(newseed: BigInteger) {
        this.seed = this.initialScramble(newseed);
    }

    private next(bits: number) {
        const oldseed = this.seed;
        const nextseed = oldseed.multiply(this.multiplier).add(this.addend).and(this.mask);
        this.seed = nextseed;
        return Math.floor(nextseed.shiftRight(48 - bits).toJSNumber());
    }

    public nextInt(b: number) {
        const bound = Math.abs(b);
        let r = this.next(31);
        const m = bound - 1;
        // tslint:disable-next-line:no-bitwise
        if ((bound & m) === 0) { // i.e., bound is a power of 2
            // tslint:disable-next-line:no-bitwise
            r = Math.floor((bound * r) >> 31);

        }
        else {
            for (let u = r;
                // tslint:disable-next-line:no-conditional-assignment
                u - (r = u % bound) + m < 0;
                u = this.next(31)) {/**/ }
        }
        return r;
    }

    public getSeed() {
        return this.seed;
    }

}
