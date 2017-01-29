/**
 * Created by Birkenstab (http://birkenstab.de) on 2017-01-28
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const chai = require("chai");
const chaiFiles = require('chai-files');
const gulp = require("gulp");

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

});

function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
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
