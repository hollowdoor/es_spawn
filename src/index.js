import { spawn } from 'child_process';
import {
    _readFile as readFile,
    _writeFile as writeFile,
    createTmp
} from './lib/myfs';
import rollup from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import path from 'path';
import tmp from 'tmp';
const cwd = process.cwd();


export default function esSpawn(name, args=[], options={}){
    let source = path.join(cwd, name);
    let filename = name.replace(/[.]\//, '');
    let argv = [].concat(args);
    let argv0 = typeof options.argv0 === 'string'
        ? options.argv0 : process.execPath;

    options.execArgv = options.execArgv || process.execArgv;

    function createHead(){
        return `'use strict';
__dirname="${cwd}";
__filename="${filename}";
process.argv[0] = "${argv0}";
process.argv.splice(1, 1, "${name}");
        `
    }

    let babelSettings = {plugins: ['transform-async-to-generator']};

    try{
        let babelrc = require(path.join(cwd, '.babelrc'));
        babelSettings = {};
    }catch(e){}

    let init = Promise.all([
        rollup.rollup({
            entry: source,
            plugins: [
                nodeResolve({jsnext: true, module: true, main: true}),
                //babel({plugins: ['transform-async-to-generator']})
                babel(babelSettings)
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

            //Get rid of that pesky hash bang.
            if(bangReg.test(code)){
                code = code.replace(bangReg, '');
            }

            //Replace some globals to make things look normal.
            //The globals changed because the new script is in a tmp diractory.
            code = code.replace(strictReg, createHead());

            if(esSpawn.saveSource){
                writeFile(path.join(cwd, 'source.'+filename), code)
                .catch((err)=>console.log(err));
            }

            return code;

        }),
        createTmp()
    ]);

    return new Promise((resolve, reject)=>{

        init.then(([fileContents, tmp])=>{
            return writeFile(tmp.path, fileContents);
        }).then(processName=>{

            let child = spawn(
                createExecPath(options),
                createArgv(options, processName, argv),
                createOptions(options)
            );

            resolve(child);
        }).catch(reject);
    });
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
