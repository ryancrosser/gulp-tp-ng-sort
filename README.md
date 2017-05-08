# TpNgSort Gulp Plugin

## Install
```
$ npm install gulp-tp-ng-sort --save-dev
```

## Usage
```js
var gulp = require('gulp');
var tpNgSort = require('gulp-tp-ng-sort')

// ...

gulp.task('build-scripts', function () {
    return gulp.src('src/**/*.js')
        .pipe(tpNgSort())
        // need to concatenate files
        .pipe(gulp.dest('build/app.js'));
});

gulp.task('build-scripts-with-options', function () {
    return gulp.src('src/**/*.js')
        .pipe(tpNgSort({
            order: ['my-custom-extension', 'module', 'config', 'route', 'constant', 'filter', 'provider', 'service', 'component', 'directive', 'controller'],
            excludePatterns: [/\.spec.js$/]
        }))
        // need to concatenate files
        .pipe(gulp.dest('link-to-destination'));
});
```

## Default Sorting Order
- Any files not matching the 
- Main App Module (app.module.js) (this should be the main app module)
- Angular Modules (*.module.js)
- Angular Config files (*.module.js)
- Angular Routes files (*.route.js)
- Angular Constants files (*.constant.js)
- Angular Filters files (*.filter.js)
- Angular Provider files (*.provider.js)
- Angular Services files (*.service.js)
- Angular Component files (*.component.js)
- Angular Directive files (*.directive.js)
- Angular Controllers files (*.controller.js)

## API
### tpNgSort([options])

#### options
##### order

Type: `array`<br>
Default: `['module', 'config', 'route', 'constant', 'filter', 'provider', 'service', 'component', 'directive', 'controller']`

Override the default sorting order.

##### excludePatterns
Type: `array of Regular Expressions`<br>
Default: `null`

Skips files based on pattern match.

## License
MIT