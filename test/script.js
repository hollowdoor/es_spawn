import path from 'path';
import sub from './sub';
sub();
console.log('This is a child process.');
console.log('path.join result ',path.join('dir', 'filename'));
console.log('__filename ',__filename)
console.log('__dirname', __dirname)
console.log('process.cwd() ',process.cwd())
console.log('process.argv ',process.argv)
let [, command] = process.argv;
console.log('command ',command)

function p(){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve('yippy!')
        })
    });
}
async function myAsync(){

    let val = await p();
    console.log('success? ', val);
}

myAsync();
