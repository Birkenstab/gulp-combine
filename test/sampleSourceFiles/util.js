/**
 * Created by Birkenstab (http://birkenstab.de) on 2017-01-28
 */

module.exports = {
    utilFunction() {
        return "Cool content";
    },

    loadAnotherModule100Times() {
        for (let i = 0; i < 100; i++) {
            require("anotherModule"); // Require module 100 times
        }
    }
};
