import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs';
import tmp from 'tmp';
import rollup from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import path from 'path';

function _readFile(name){
    return new Promise((resolve, reject)=>{
        readFile(name, 'utf8', (err, string)=>{
            if(err){ return reject(err); }
            resolve(string);
        });
    });
}

function _writeFile(name, contents){
    return new Promise((resolve, reject)=>{
        writeFile(name, contents, (err)=>{
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

function rollit(source, options){

    const createHead = options.createHead;

    return getBabelSettings().then(babelSettings=>{

        return rollup.rollup({
            entry: source,
            plugins: [
                nodeResolve({jsnext: true, module: true, main: true}),
                babel(babelSettings)
            ],
            acorn: {
                allowHashBang: true
            },
            onwarn: (warning)=>{
                //No need for warnings.
                //Try to act like a normal child process.
                if(options.showWarning){
                    console.log(warning);
                }
            }
        }).then(bundle=>{
            let code = bundle.generate({
                format: 'cjs'
            }).code;

            let strictReg = /^(['"])use strict\1;/;
            let bangReg = /\n#[!][^\n]+?\n/;

            //Get rid of that pesky hash bang.
            if(bangReg.test(code)){
                code = code.replace(bangReg, '');
            }

            //Replace some globals to make things look normal.
            //The globals changed because the new script is in a tmp diractory.
            code = code.replace(strictReg, createHead());

            return code;

        });
    });

}

function getBabelSettings(){
    return _readFile(path.join(process.cwd(), '.babelrc'))
    .then(
        contents=>{},
        error=>{
            //return {plugins: ['transform-async-to-generator']}
            return {presets: ["stage-3"]};
        }
    );
}

const cwd = process.cwd();

function esSpawn(name, args=[], options={}){

    let source = path.join(cwd, name);
    let filename = name.replace(/[.]\//, '');
    let argv = [].concat(args);
    let argv0 = typeof options.argv0 === 'string'
        ? options.argv0 : process.execPath;

    options.execArgv = options.execArgv || process.execArgv;

    let init = Promise.all([
        rollit(source, {
            showWarning: esSpawn.showWarning,
            createHead: createHead
        }).then(code=>{
            if(options['sourceOutput']){
                _writeFile(path.join(cwd, options.sourceOutput), code)
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

            let child = spawn(
                createExecPath(options),
                createArgv(options, processName, argv),
                createOptions(options)
            );

            resolve(child);
        }).catch(reject);
    });

    function createHead(){
        return `'use strict';
__dirname="${cwd}";
__filename="${filename}";
process.argv[0] = "${argv0}";
process.argv.splice(1, 1, "${name}");
        `
    }

}


function createExecPath(options){
    if(typeof options.execPath === 'string'){
        return options.execPath;
    }
    return process.execPath;
}

function createArgv(options, processName, argv){
    let _argv = argv = [processName].concat(argv);
    _argv = options.execArgv.concat(argv);
    //console.log('_argv ',_argv);
    return _argv;
}

function createOptions(options, argv0){

    if(options.cwd === undefined){
        options.cwd = cwd;
    }

    if(options.env === undefined){
        options.env = process.env;
    }

    if(options['stdio'] === undefined){
        options.stdio = [0, 1, 2, 'ipc'];
    }

    return options;
}

export default esSpawn;
