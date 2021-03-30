'use strict';

/**
 * Randomise the contents of an array using the Fisher-Yates shuffle.
 * @param array
 * @returns {*}
 */
function shuffleArray(array) {
    var counter = array.length;
    while (counter > 0) {
        var index = randInt(0, counter);
        counter--;
        var temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

/**
 * Generate a random integer in the range [min, max)
 *
 * @param min
 * @param max
 * @returns {*}
 */
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Clamp a number n to the range [min, max]
 *
 * @param n
 * @param min
 * @param max
 * @returns {number}
 */
function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}

