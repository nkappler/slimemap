import Long from "long";
import { NSeededRandom } from "./seededRandom";
import { Vector2 } from "./slimeMap";

const base = new Long(4987142);
const addend1 = new Long(5947611);
const addend2 = new Long(4392871);
const addend3 = new Long(389711);
const mask = new Long(987234911);

export function isSlimeChunk(chunk: Vector2, seed: Long) {
    const xPos = chunk.x;
    const zPos = chunk.y;
    const tempseed = base.multiply(xPos).multiply(xPos)
        .add(addend1.multiply(xPos))
        .add(addend2.multiply(zPos).multiply(zPos))
        .add(addend3.multiply(zPos))
        .add(seed).xor(mask);

    const rnd = new NSeededRandom(tempseed);
    return (rnd.nextInt(10) === 0);
}
