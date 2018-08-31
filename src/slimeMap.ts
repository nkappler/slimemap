import * as bigInteger from "./BigInteger";
import { SeededRandom } from "./seededRandom";
import * as slimeMap from "./slimeMap.js";

export class SlimeM {
    private seed: SeededRandom;


    constructor() {
        this.seed = new SeededRandom();
    }

};

export const e = {
    slimeMap,
    bigInteger
};
