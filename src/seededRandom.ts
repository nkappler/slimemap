import Long, { ONE, ZERO } from "long";

interface ISeededRandom {
    nextInt: (b: number) => number;
}

const nmultiplier = new Long(0xDEECE66D, 0x5);
const naddend = new Long(0xB);
const nmask = new Long(0xFFFFFFFF, 0xFFFF);

export class NSeededRandom implements ISeededRandom {
    private seed: Long;

    public constructor(initseed: Long) {
        this.seed = this.initialScramble(initseed);
    }

    private initialScramble(seed: Long) {
        return seed.xor(nmultiplier).and(nmask);
    }

    private next(bits: number) {
        this.seed = this.seed.multiply(nmultiplier).add(naddend).and(nmask);
        return this.seed.shiftRight(48 - bits);
    }

    public nextInt(b: number) {
        const bound = new Long(Math.abs(b));
        if (bound.and(bound.negate()).isZero()) { // i.e., bound is a power of 2
            return (bound.multiply(this.next(31)).shiftRight(31)).toInt();
        }
        // tslint:disable-next-line:one-variable-per-declaration
        let bits: Long, val: Long;
        do {
            bits = this.next(31);
            val = bits.modulo(bound);
        } while (bits.sub(val).add(bound.sub(ONE)).lessThan(ZERO));
        return val.toInt();
    }
}
