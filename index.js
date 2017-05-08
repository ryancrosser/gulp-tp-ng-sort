/**
 * This sorter is specifically for Team Pheonix's mixture of AnularJS and legacy file.
 * This will place files in the following order:
 *  - Any files not matching the 
 *  - app.module.js (this should be the main app module)
 *  - Angular Modules
 *  - Angular Config files
 *  - Angular Routes files
 *  - Angular Constants files
 *  - Angular Filters files
 *  - Angular Provider files
 *  - Angular Services files
 *  - Angular Component files
 *  - Angular Directive files
 *  - Angular Controllers files
 */

var through = require('through2');
var gutil = require('gulp-util');
var toposort = require('toposort');
var ngDeps = require('ng-dependencies');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'tp-ng-sort';
var ANGULAR_MODULE = 'ng';

var ORDER = ['module', 'config', 'route', 'constant', 'filter', 'provider', 'service', 'component', 'directive', 'controller'];

module.exports = function tpNgSort(options) {
    options = options || {};
    if ( options.order && !Array.isArray( options.order ) ) {
        this.emit( 'error', new PluginError( PLUGIN_NAME, 'The file order must be an array' ) );
        return;
    }
    if ( options.excludePatterns && !Array.isArray( options.excludePatterns ) ) {
        this.emit( 'error', new PluginError( PLUGIN_NAME, 'The exclude match must be an array' ) );
        return;
    }
    options.order = options.order || ORDER;
    options.excludePatterns = options.excludePatterns || [];
    var sortedFiles = [];
    var files = [];
    var ngModules = {};
    var toSort = [];
    function transformationFunction ( file, encoding, callback ) {
        if ( file.isNull() ) {
            this.emit( 'error', new PluginError( PLUGIN_NAME, 'File: "' + file.relative + '" without content. You have to read it with gulp.src(...)' ) );
            return;
        }
        
        if ( file.isStream() ) {
            this.emit( 'error', new PluginError( PLUGIN_NAME, 'Streaming not supported.' ) );
            callback();
            return;
        }
        
        var deps = false;
        try {
            deps = ngDeps( file.contents );
        } catch (err) {
            this.emit( 'error', new PluginError( PLUGIN_NAME, 'Error in parsing: "' + file.relative + '" , ' + err.message ) );
        }

        if ( deps && deps.modules ) {
            Object.keys( deps.modules ).forEach( function ( name ) {
                ngModules[name] = file;
            });
        }

        if ( deps && deps.dependencies ) {
            deps.dependencies.forEach( function ( dep ) {
                if ( isDependencyUsedInAnyDeclaration( dep, deps ) ) {
                    return;
                }
                if ( dep === ANGULAR_MODULE ) {
                    return;
                }
                toSort.push([file, dep]);
            });
        }

        files.push(file);
        callback();
    }

    function flushFunction( callback ) {
        for ( var i = 0; i < toSort.length; i++ ) {
            var moduleName = toSort[i][1];
            var declarationFile = ngModules[moduleName];
            if ( declarationFile ) {
                toSort[i][1] = declarationFile;
            } else {
                // third party dependency, we do not need to account for this
                // since it will be in the vendor script
                toSort.splice( i--, 1 );
            }
        }

        // Sort files to prevent random ordering
        // reverse sort because we are recieving the ordering later on
        files.sort( function ( a, b ) {
            if ( a.path.toLowerCase().replace(a.extname, '') < b.path.toLowerCase().replace(b.extname, '') ) {
                return 1;
            } else if ( a.path.toLowerCase().replace(a.extname, '') > b.path.toLowerCase().replace(b.extname, '') ) {
                return -1;
            } else {
                return 0;
            }
        });

        // sort files with toSort as a dependency tree and reverse the order to get a "legal execution order"
        var toposortedFiles = toposort.array( files, toSort ).reverse();

        options.order.forEach( function (type) {
            var re = new RegExp( type + '.js', '' );
            for ( var i = toposortedFiles.length - 1; i >= 0; i-- ) {
                if ( re.test( toposortedFiles[i].path ) && !toposortedFiles[i].path.endsWith( 'app.module.js' ) ) {
                    sortedFiles = sortedFiles.concat( toposortedFiles[i] );
                    toposortedFiles.splice( i, 1 );
                }
            }
        });

        // add the app.module.js file
        for ( var i = toposortedFiles.length - 1; i >= 0; i-- ) {
            if ( toposortedFiles[i].path.endsWith( 'app.module.js' ) ) {
                sortedFiles.unshift( toposortedFiles[i] );
                toposortedFiles.splice( i, 1 );
            }
        }

        // now get any other files and add them to the beginning (typically legacy files)
        toposortedFiles.forEach( function ( file ) {
            sortedFiles.unshift( file );
        });

        // remove the files that match the exclude patterns option
        var toRemove = new Set();
        sortedFiles.forEach( ( file ) => {
            options.excludePatterns.forEach( ( pattern ) => {
                if ( options.excludePatterns && pattern.test( file.relative ) ) {
                    toRemove.add( file.relative );
                }
            });
        });

        // push these back to the gulp stream
        sortedFiles.forEach( ( file ) => {
            if ( !Array.from( toRemove ).includes( file.relative ) ) {
                this.push( file );
            }
        });

        callback();
    }

    return through.obj( transformationFunction, flushFunction );
};

function isDependencyUsedInAnyDeclaration ( dependency, ngDeps ) {
    if ( !ngDeps.modules ) {
        return false;
    }
    if ( dependency in ngDeps.modules ) {
        return true;
    }
    return Object.keys( ngDeps.modules ).some( function ( module ) {
        return ngDeps.modules[module].includes( dependency );
    });
};
