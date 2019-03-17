import Long from "long";
import { NSeededRandom } from "./seededRandom";
import { Vector2D } from "./slimeMap";

const base = new Long(4987142);
const addend1 = new Long(5947611);
const addend2 = new Long(4392871);
const addend3 = new Long(389711);
const mask = new Long(987234911);

export class SlimeChunkHandler {
    private cache: { [key: string]: boolean | undefined } = {};

    public constructor(private seed: Long) { }

    public isSlimeChunk(chunk: Vector2D) {
        const key = `[${chunk.x},${chunk.z}]`;
        if (this.cache[key] === undefined) {
            this.cache[key] = isSlimeChunk(chunk, this.seed);
        }
        return this.cache[key];
    }

    public updateSeed(seed: Long) {
        this.seed = seed;
        delete this.cache;
        this.cache = {};
    }
}

export function isSlimeChunk(chunk: Vector2D, seed: Long) {
    const { x, z } = chunk;
    const tempseed = base.multiply(x).multiply(x)
        .add(addend1.multiply(x))
        .add(addend2.multiply(z).multiply(z))
        .add(addend3.multiply(z))
        .add(seed).xor(mask);

    const rnd = new NSeededRandom(tempseed);
    return (rnd.nextInt(10) === 0);
}
