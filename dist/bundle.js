'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var child_process = require('child_process');
var fs = require('fs');
var tmp = _interopDefault(require('tmp'));
var rollup = _interopDefault(require('rollup'));
var nodeResolve = _interopDefault(require('rollup-plugin-node-resolve'));
var babel = _interopDefault(require('rollup-plugin-babel'));
var path = _interopDefault(require('path'));

function _writeFile(name, contents){
    return new Promise((resolve, reject)=>{
        fs.writeFile(name, contents, (err)=>{
            if(err){ return reject(err); }
            resolve(name);
        });
    });
}

function createTmp(){
    return new Promise((resolve, reject)=>{
        tmp.file(function _tempFileCreated(err, path$$1, fd, cleanupCallback) {
            if(err){ return reject(err); }

            resolve({path: path$$1, fd});
        });
    });
}

const cwd = process.cwd();


function esSpawn(name, args=[], options={}){
    let source = path.join(cwd, name);
    let filename = name.replace(/[.]\//, '');
    let argv = [].concat(args);

    let init = Promise.all([
        rollup.rollup({
            entry: source,
            plugins: [
                nodeResolve({jsnext: true, module: true}),
                babel({plugins: ['transform-async-to-generator']})
            ],
            acorn: {
                allowHashBang: true
            },
            onwarn: (warning)=>{
                //No need for warnings.
                //Try to act like a normal child process.
                if(esSpawn.showWarning){
                    console.log(warning);
                }
            }
        }).then(bundle=>{
            let code = bundle.generate({
                format: 'cjs'
            }).code;

            let strictReg = /^(['"])use strict\1;/;
            let bangReg = /\n#[!][^\n]+?\n/;
            let head = `'use strict';
__dirname="${cwd}";
__filename="${filename}";
process.argv.splice(1, 1, "${name}");
            `;

            //Get rid of that pesky hash bang.
            if(bangReg.test(code)){
                code = code.replace(bangReg, '');
            }

            //Replace some globals to make things look normal.
            //The globals changed because the new script is in a tmp diractory.
            code = code.replace(strictReg, head);

            if(esSpawn.saveSource){
                _writeFile(path.join(cwd, 'source.'+filename), code)
                .catch((err)=>console.log(err));
            }

            return code;

        }),
        createTmp()
    ]);

    return new Promise((resolve, reject)=>{

        init.then(([fileContents, tmp$$1])=>{
            return _writeFile(tmp$$1.path, fileContents);
        }).then(processName=>{
            argv = [processName].concat(argv);
            let child = child_process.spawn(
                'node',
                argv,
                createOptions(options, name)
            );

            resolve(child);
        }).catch(reject);
    });
}

function createOptions(options, argv0){
    if(!options.cwd){
        options.cwd = cwd;
    }

    if(!options.env){
        options.env = process.env;
    }

    if(options['argv0'] === undefined){
        options.argv0 = argv0;
    }

    if(options['stdio'] === undefined){
        options.stdio = 'inherit';
    }

    return options;
}

module.exports = esSpawn;
