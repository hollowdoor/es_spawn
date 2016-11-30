es-spawn
=======

Install
-------

`npm install --save es-spawn`

Usage
-----

`script.js`

```javascript
import path from 'path';

function p(){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve(path.join(__dirname, __filename))
        })
    });
}

async function myAsync(){

    let val = await p();
    console.log('The current path is ', val);
}

myAsync();
```

`run.js`

```javascript
import spawn from 'es-spawn';
//const fork = require('es-spawn'); //Using commonjs

spawn('./script.js').then(child=>{
    //Nothing needs to be done here
    //unless you want you want to use ipc messaging.
}).catch(err=>{
    console.log('test ERROR ',err);
});
```

API
---

The interface for `es-spawn` is identical to node's [child_process spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). The only exception is that only javascript files can be used. In other words `es-spawn` works like a fork of a node process.

### spawn(command, argv, options) -> child_process

You can run the fork as if you were using `require('child_process').spawn`.


About
-----

`es-spawn` uses rollup, and babel.

rollup is used to compile es2015 modules in your script to commonjs require type modules.

babel is used to compile async functions down to generators.

These are the basic steps that `es-spawn` goes through when running a script.

1. A temporary file is created, and the source script is read.
2. The source script is compiled with rollup, and babel.
3. Globals are altered to make the script string look like it's source.
  * __filename
  * __dirname
  * process.arg[1] = __filename
4. The new script string is written to the temporary file.
5. The path of the temporary file is passed to child_process.fork()

The most recent version of nodejs uses almost all of es2015. For this reason only es2015 modules, and [stage-3 presets](http://babeljs.io/docs/plugins/preset-stage-3/) are compiled by `es-spawn`.

You can still use a [.babelrc](https://babeljs.io/docs/usage/babelrc/) file to get more out of babel. Place a .babelrc file in the directory that contains the file you want to run with es-spawn.

If you want polyfills you should use *ponyfills* instead. Though most es2015 build-ins are supported by the latest node version. You can use the babel polyfills as well.

Happy coding!
