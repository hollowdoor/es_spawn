import {readFile, writeFile} from 'fs';
import tmp from 'tmp';

export function _readFile(name){
    return new Promise((resolve, reject)=>{
        readFile(name, 'utf8', (err, string)=>{
            if(err){ return reject(err); }
            resolve(string);
        })
    });
}

export function _writeFile(name, contents){
    return new Promise((resolve, reject)=>{
        writeFile(name, contents, (err)=>{
            if(err){ return reject(err); }
            resolve(name);
        })
    });
}

export function createTmp(){
    return new Promise((resolve, reject)=>{
        tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
            if(err){ return reject(err); }

            resolve({path, fd});
        });
    });
}
