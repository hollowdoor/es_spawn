let spawn = require('../');
spawn.saveSource = true;
let command = process.argv[2];
console.log('--- In run.js ---');
console.log('process.execArgv ',process.execArgv)
console.log('process.argv ',process.argv)

console.log('process.execPath ',process.execPath)
console.log('process.argv0 ',process.argv0)


spawn(command, ['-v'], {
    argv0: './run.js'//, execPath: process.execPath
}).then(child=>{
    //process.stdin.pipe(child.stdin);
    //child.stdout.pipe(process.stdout);
    //console.log('success');
}).catch(err=>{
    console.log('test ERROR ',err);
});
