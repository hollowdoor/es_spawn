import { spawn } from 'child_process';
import {
    _readFile as readFile,
    _writeFile as writeFile,
    createTmp
} from './lib/myfs';
import rollit from './lib/rollit';
import path from 'path';
import tmp from 'tmp';
const cwd = process.cwd();

export default function esSpawn(name, args=[], options={}){

    //let source = path.join(cwd, name);
    let source = name;
    if(!/^\//.test(source)){
        source = path.join(cwd, name);
    }
    
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
                writeFile(path.join(cwd, options.sourceOutput), code)
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

    function createHead(){
        return `'use strict';
__dirname="${cwd}"; __filename="${source}";
${createArgvString()}
`
    }

    function createArgvString(){

        if(argv0 === process.execPath){
            return `process.argv.splice(1, 1, "${name}");`;
        }

        return `
        process.argv[0] = '${argv0}';
        process.argv.splice(1, 1, "${name}");`;
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
        options.stdio = [0, 1, 2];
    }

    return options;
}
