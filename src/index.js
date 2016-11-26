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
            argv = [processName].concat(argv);
            let child = spawn(
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
