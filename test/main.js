/**
 * Created by Birkenstab (http://birkenstab.de) on 2017-01-28
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const chai = require("chai");
const chaiFiles = require('chai-files');
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const SourceMapConsumer = require("source-map").SourceMapConsumer;

chai.use(chaiFiles);
const expect = chai.expect;
const file = chaiFiles.file;

const gulpCombine = require("../");

describe("gulp-combine", function() {

    after(() => {
        deleteFolderRecursive("test/testOutput/");
    });

    it("should throw, when mainModule argument is missing", () => {
        expect(gulpCombine).to.throw("Gulp-Combine: Missing mainModule option!");
    });

    it("standard output filename should be output.js", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(gulpCombine({
                mainModule: "mainModule.js"
            }))
            .pipe(gulp.dest("test/testOutput/test2/"))
            .on("end", () => {
                expect(file("test/testOutput/test2/output.js")).to.exist;
                done();
            });
    });

    it("output filename should be as specified", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(gulpCombine({
                mainModule: "mainModule.js",
                outputFile: "foobar234.js"
            }))
            .pipe(gulp.dest("test/testOutput/test3/"))
            .on("end", () => {
                expect(file("test/testOutput/test3/foobar234.js")).to.exist;
                done();
            });
    });

    it("output file should contain input files", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(gulpCombine({
                mainModule: "mainModule.js"
            }))
            .pipe(gulp.dest("test/testOutput/test4/"))
            .on("end", () => {
                const directory = "test/sampleSourceFiles";
                let files = fs.readdirSync(directory);
                files = files.filter((file) => {
                    return file.endsWith(".js");
                });
                files = files.map((file) => {
                    return fs.readFileSync(path.join(directory, file));
                });
                for (const currntFile of files) {
                    expect(file("test/testOutput/test4/output.js")).to.contain(currntFile);
                }
                done();
            });
    });

    it("output code should be valid JavaScript code", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(gulpCombine({
                mainModule: "mainModule.js"
            }))
            .pipe(gulp.dest("test/testOutput/test5/"))
            .on("end", () => {
                const code = fs.readFileSync("test/testOutput/test5/output.js");
                vm.runInNewContext(code);
                done();
            });
    });

    it("code of the mainModule should be executed", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(gulpCombine({
                mainModule: "mainModule.js"
            }))
            .pipe(gulp.dest("test/testOutput/test6/"))
            .on("end", () => {
                const code = fs.readFileSync("test/testOutput/test6/output.js");
                const sandbox = vm.createContext();
                vm.runInContext("let testValue = 'a string';", sandbox);
                vm.runInContext(code, sandbox);
                expect(vm.runInContext("testValue", sandbox)).to.equal("change the string");

                done();
            });
    });

    it("module loading should be cached", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(gulpCombine({
                mainModule: "mainModule.js"
            }))
            .pipe(gulp.dest("test/testOutput/test7/"))
            .on("end", () => {
                const code = fs.readFileSync("test/testOutput/test7/output.js");
                const sandbox = vm.createContext();
                vm.runInContext("let timesExecuted = 0;", sandbox);
                vm.runInContext(code, sandbox);
                vm.runInContext("gulpModuleManager.requireModule('util').loadAnotherModule100Times();", sandbox); // This function requires anotherModule 100 times
                expect(vm.runInContext("timesExecuted", sandbox)).to.equal(1); // But the code should be executed only once

                done();
            });
    });

    it("sourcemap should be correct", (done) => {
        gulp.src("test/sampleSourceFiles/*.js")
            .pipe(sourcemaps.init())
            .pipe(gulpCombine({
                mainModule: "mainModule.js"
            }))
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest("test/testOutput/test8/"))
            .on("end", () => {
                // This chunk of code is from util.js
                const codePart = `        for (let i = 0; i < 100; i++) {
            require("anotherModule"); // Require module 100 times
        }`;
                // Load output code
                const code = fs.readFileSync("test/testOutput/test8/output.js").toString("utf-8");
                // Load Sourcemap
                const sourcemap = fs.readFileSync("test/testOutput/test8/output.js.map");
                const consumer = new SourceMapConsumer(sourcemap.toString("utf-8"));
                // Load source file the codePart is from
                const sourceFile = fs.readFileSync("test/sampleSourceFiles/util.js").toString("utf-8");

                // The line of util.js the codePart is contained in
                const sourceLineNumber = getLineNumber(sourceFile, codePart);
                // The line of the output the codePart is contained in
                const outputLineNumber = getLineNumber(code, codePart);

                const result = consumer.originalPositionFor({
                    line: outputLineNumber,
                    column: 0
                });

                expect(result.source).to.equal("util.js"); // source filename
                expect(result.line).to.equal(sourceLineNumber); // source line number

                done();
            });
    });

});

/**
 * Returns the line number a chunk of code is located
 * @param code
 * @param codePart chunk of code
 * @returns {number} line number
 */
function getLineNumber(code, codePart) {
    const position = code.indexOf(codePart);
    code = code.substring(0, position );
    return (code.match(/\n/g) || []).length + 1;
}

function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file){
            let curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

// TODO running combine multiple times should produce same results (state should be reset)
