import { _readFile as readFile } from './myfs';
import rollup from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import path from 'path';

export default function rollit(source, options){

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
    return readFile(path.join(process.cwd(), '.babelrc'))
    .then(
        contents=>{},
        error=>{
            return {presets: ["stage-3"]};
        }
    );
}
