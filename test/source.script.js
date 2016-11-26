'use strict';
__dirname="/home/spirit/Projects/JSLibs/es_fork/test";
__filename="script.js";
process.argv.splice(1, 1, "./script.js");
            

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));

function talk() {
    console.log('This is sub.js talking.');
}

let myAsync = (() => {
    var _ref = _asyncToGenerator(function* () {

        let val = yield p();
        console.log('success? ', val);
    });

    return function myAsync() {
        return _ref.apply(this, arguments);
    };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

talk();
console.log('This is a child process.');
console.log('path.join result ', path.join('dir', 'filename'));
console.log('__filename ', __filename);
console.log('__dirname', __dirname);
console.log('process.cwd() ', process.cwd());
console.log('process.argv ', process.argv);
let [, command] = process.argv;
console.log('command ', command);

function p() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('yippy!');
        });
    });
}


myAsync();
