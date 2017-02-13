/**
 * Created by Birkenstab (http://birkenstab.de) on 2017-01-27
 */

const path = require("path");
const fs = require("fs");
const through = require("through2");
const Vinyl = require("vinyl");
const PluginError = require("gulp-util").PluginError;

const SourceMapGenerator = require("source-map").SourceMapGenerator;
const applySourceMap = require("vinyl-sourcemaps-apply");


/* This line of code is added to the start of every module to isolate it from the other modules
    to provide module functions 'exports', 'require' and 'module':
*/
const moduleHeader = "gulpModuleManager.add(\"$MODULE_NAME\", function(exports, require, module) {\n";
// This line of code is added to the end of every module:
const moduleFooter = "\n});";
// This line of code is added to the end of the whole output file to call the main-module
const fileFooter = "\ngulpModuleManager.requireModule(\"$MAIN_MODULE\");";

const PLUGIN_NAME = "gulp-combine";

// array that contains all Buffers that are combine at the end
let fileBuffers;
// last file that is processed, stored for meta information
let latestFile;

// module that is called when the output script is executed
let mainModule;
let outputFile;

// SourceMapGenerator for Sourcemap generation
let sourceMap;
// Current line count of the output file. Important for Sourcemap generation
let lineCount;

/**
 * Add a file to the list
 * Called by Gulp
 * @param file
 * @param encoding
 * @param callback
 */
function addFile(file, encoding, callback) {
    if (file.isNull()) {
        // nothing to do
        return callback(null, file);
    }

    if (file.isStream()) {
        // file.contents is a Stream - https://nodejs.org/api/stream.html
        this.emit("error", new PluginError(PLUGIN_NAME, "Streams not supported yet!"));
    } else if (file.isBuffer()) {
        latestFile = file;

        // Replace the Module-Name-Placeholder
        const localModuleHeader = moduleHeader.replace("$MODULE_NAME", file.relative);
        // Add moduleHeader
        fileBuffers.push(Buffer.from(localModuleHeader, "utf-8"));
        // Add the module code
        fileBuffers.push(file.contents);
        // Add the module footer
        fileBuffers.push(Buffer.from(moduleFooter, "utf-8"));

        // Increment lineCount by numbers of lines the module header has
        lineCount += getLineCount(localModuleHeader);

        // get line count of the module
        const currentFileLines = getLineCount(file.contents.toString("utf-8"));

        for (let i = 1; i <= currentFileLines + 1; i++) {
            // Add Sourcemap entry for every line in source file
            sourceMap.addMapping({
                generated: {
                    line: lineCount + i,
                    column: 0
                },
                source: file.relative,
                original: {
                    line: i,
                    column: 0
                }
            });
        }
        // Increment lineCount by numbers of lines the sourcecode has
        lineCount += currentFileLines;
        // Increment lineCount by numbers of lines the module footer has
        lineCount += getLineCount(moduleFooter);

        // call the callback so the Gulp job continues
        callback();
    }
}

/**
 * All files have been added; create output file
 * Called by Gulp
 * @param callback
 */
function endStream(callback) {
    if (!latestFile) {
        // No file added
        return callback();
    }
    // Add fileFooter at the end:
    fileBuffers.push(Buffer.from(fileFooter.replace("$MAIN_MODULE", mainModule), "utf-8"));
    // Concat all file pieces to one Buffer:
    const buffer = Buffer.concat(fileBuffers);
    // Create the output file
    const file = new Vinyl({
        cwd: latestFile.cwd,
        base: latestFile.base,
        path: path.join(latestFile.base, outputFile),
        contents: buffer
    });

    // Call vinyl-sourcemap-apply's method for applying the Sourcemap
    applySourceMap(file, sourceMap.toString());

    // Return the output file
    callback(null, file);
    // Clean up for next time
    resetState();
}

/**
 * Returns the number of lines a part of code has
 * @param string code
 * @returns {Number} line count
 */
function getLineCount(string) {
    return (string.match(/\n/g) || []).length;
}

/**
 * Resets the state to be able to combine new files
 */
function resetState() {
    fileBuffers = [];
    outputFile = "output.js";
    latestFile = undefined;
    // Load the controller code that will be at the beginning of the output file
    const controller = fs.readFileSync(path.join(__dirname, "moduleManager.js"));
    fileBuffers.push(controller);
    lineCount = getLineCount(controller.toString("utf-8"));
}

module.exports = function (options) {
    // Initialize state only when the method is actually called
    resetState();

    options = options || {};
    if (options.mainModule === undefined) {
        throw new Error("Gulp-Combine: Missing mainModule option!");
    }
    mainModule = options.mainModule;
    if (options.outputFile)
        outputFile = options.outputFile;

    // Create SourceMapGenerator
    sourceMap = new SourceMapGenerator({
        file: outputFile
    });

    return through.obj(addFile, endStream);
};
