/**
 * minified seededRandom as in Java
 */
var seededRandom = function(initseed) {
	if (initseed === undefined) initseed = Date.now();
	var seed = bigInt(initseed);
	var multiplier = bigInt("5DEECE66D", 16);
    var addend = bigInt("B", 16);
    var mask = bigInt("281474976710655");

    var initialScramble = function(seed) {
    	var temp = seed.TwosCompXor(multiplier, 64);
    	return temp.TwosCompAnd(mask, 64);
    };
    
    seed = initialScramble(seed);
    
    var setSeed = function(newseed) {
    	seed = initialScramble(newseed);
    };
    
    var next = function(bits) {
        var oldseed = seed;
        var nextseed = oldseed.multiply(multiplier).add(addend).TwosCompAnd(mask);
        seed = nextseed; 
        return Math.floor(nextseed.shiftRight(48 - bits));
    };
    
    this.nextInt = function(bound) {
        if (bound <= 0)
            bound *= -1;

        var r = next(31);
        var m = bound - 1;
        if ((bound & m) === 0)  // i.e., bound is a power of 2
            r = Math.floor((bound * r) >> 31);
        else {
            for (var u = r;
                 u - (r = u % bound) + m < 0;
                 u = next(31))
                ;
        }
        return r;
    };
    
    this.getSeed = function() {
    	return seed;
    };
    
};