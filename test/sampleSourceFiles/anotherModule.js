/**
 * Created by Birkenstab (http://birkenstab.de) on 2017-01-29
 */

if (typeof timesExecuted !== "undefined") {
    timesExecuted++;
}

exports.foo = function(a,b) {
    return a*b;
};
