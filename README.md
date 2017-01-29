# gulp-combine

gulp-combine is a plugin for gulp that enables you to write modules in the nodejs style and then combines them with minimal api footprint to a single file for you that runs in your browser without any additional dependency.

### Example
Just write your code like in node (except require without ./ at the beginning)
##### main.js:
```javascript
const mathUtil = require("mathUtil");

const result = mathUtil.add(3, 9);

console.log("3 + 9 = " + result);
```

##### mathUtil.js:
```javascript
module.exports = {
    add(a, b) {
        return a + b;
    }
};
```

### Features:
  - require("module-name");
  - module.exports = ...
  - module caching
  - Just 1 kB of minified API

### Installation

Install the npm module and save as dev-dependency:

```sh
$ npm install --save-dev gulp-combine
```

### Sample gulpfile.js
```javascript
const gulp = require("gulp");
const gulpCombine = require("../");

gulp.task("default", () => {
    gulp.src("src/**/*.js")
        .pipe(gulpCombine({
            mainModule: "main"
        }))
        .pipe(gulp.dest("build"));
});
```

### Tests
```sh
$ npm test
```

### Todos

 - Gulp-Sourcemaps compatibility

License
----

MIT
