/**
 * Created by Birkenstab (http://birkenstab.de) on 2017-01-27
 */

/**
 * This file is included in the generated code for the Web Browser to handle require(moduleName) function of the modules
 */
const gulpModuleManager = new (function () {
    // Modules that are available for 'require()' but are not used yet:
    const availableModules = new Map();
    // Modules that are cached because they were already loaded via 'require(moduleName)'
    const cachedModules = new Map();

    /**
     * Adds a module to the list of available modules so that it can be accessed by 'require(moduleName)'
     * Invoked for every module:
     *   gulpModuleManager.add("$MODULE_NAME", function(exports, require, module) {
     *      // Module code ...
     *   });
     * @param moduleName
     * @param func function that is called when the module is loaded via 'require(moduleName)'
     */
    this.add = function (moduleName, func) {
        availableModules.set(moduleName, func);
    };

    /**
     * Checks if a module with the given name exists
     * @param moduleName
     * @returns {boolean}
     */
    function moduleExists(moduleName) {
        return availableModules.has(moduleName) || cachedModules.has(moduleName);
    }

    /**
     * Loads the specified module or returns it from the cache if possible
     * This function should always be called by 'require(moduleName)' inside of a module
     * and NOT with 'gulpModuleManager.requireModule(moduleName)'
     *
     * moduleName can be specified with or without file extension:
     * the following is equivalent:
     *  requireModule("util.js");
     *  requireModule("util");
     *
     *  Throws ModuleLoadingError if the module cannot be loaded
     *
     * @param moduleName
     * @returns the value of module.exports the module has set
     */
    function requireModule(moduleName) {
        let name = moduleName;
        if (!moduleExists(name)) {
            name += ".js"; // Try to load module with file extension appended
            if (!moduleExists(name)) {
                throw new ModuleLoadingError(moduleName); // Module does not exist
            }
        }
        if (!cachedModules.has(name)) { // If module is not in cache
            executeModule(name);
        }
        return cachedModules.get(name);
    }

    this.requireModule = requireModule; // Make the function available in global scope

    /**
     * Calls the module's code and stores it in the module cache
     * @param moduleName
     */
    function executeModule(moduleName) {
        const func = availableModules.get(moduleName);
        const module = new Module(moduleName);

        func.call(undefined, module.exports, requireModule, module); // Execute module code
        cachedModules.set(moduleName, module.exports); // Store public interface of the module (module.exports) in cache
        availableModules.delete(moduleName); // Remove module from map of available modules because it is in the other map now
    }
})();

/**
 * Thrown if a should be loaded that doesn't exist
 */
class ModuleLoadingError extends Error {

    constructor(moduleName) {
        super(`Module '${moduleName}' cannot be found!`);
    }
}

/**
 * Contains some basic information about a module
 * Accessible through 'module'
 */
class Module {
    constructor(filename) {
        this.filename = filename;
        this.exports = {};
    }
}
