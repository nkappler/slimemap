import bigInt, { BigInteger, BigNumber } from "../node_modules/big-integer";

/**
 * partial seededRandom as in Java
 */
export class SeededRandom {
    private multiplier: BigInteger;
    private seed: BigInteger;
    private addend: any;
    private mask: any;

    public constructor(initseed: number | string = Date.now()) {
        this.seed = bigInt(initseed as number);
        this.multiplier = bigInt("5DEECE66D", 16);
        this.addend = bigInt("B", 16);
        this.mask = bigInt("281474976710655");
        this.seed = this.initialScramble(this.seed);
        this.seed = this.initialScramble(this.seed);
    }

    private initialScramble(seed: BigInteger) {
        const temp = seed.xor(this.multiplier);
        return temp.and(this.mask);
    }

    private setSeed(newseed: BigInteger) {
        this.seed = this.initialScramble(newseed);
    }

    private next(bits: BigNumber) {
        const oldseed = this.seed;
        const nextseed = oldseed.multiply(this.multiplier).add(this.addend).and(this.mask);
        this.seed = nextseed;
        return Math.floor((nextseed.shiftRight((48 - (bits as any)) as any) as any));
    }

    public nextInt(b: any) {
        let bound = b;
        if (bound <= 0) {
            bound *= -1;
        }

        let r = this.next(31);
        const m = bound - 1;
        // tslint:disable-next-line:no-bitwise
        if ((bound & m) === 0) { // i.e., bound is a power of 2 { {
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
