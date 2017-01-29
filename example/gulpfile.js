const gulp = require("gulp");
const gulpCombine = require("../");

gulp.task("default", () => {
    gulp.src("src/**/*.js")
        .pipe(gulpCombine({
            mainModule: "main"
        }))
        .pipe(gulp.dest("build"));
});
