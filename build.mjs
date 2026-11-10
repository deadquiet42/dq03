import fs from 'node:fs';
import {minify} from 'terser';
import {Packer} from 'roadroller';
const markup='<canvas id=c style="position:fixed;width:100%;height:100%"></canvas><p id=d style="position:fixed;bottom:8%;width:100%;text-align:center;font:200 3vh monospace;letter-spacing:.6em;padding-left:.6em;margin:0">click and wait</p>';
const source='document.body.innerHTML='+JSON.stringify(markup)+';'+fs.readFileSync('dq03-source.js','utf8');
const shell=js=>`<body style=margin:0;overflow:hidden;cursor:none><script>${js}</script>`;
const min=(await minify(source,{toplevel:true,compress:{passes:5,unsafe:true,unsafe_math:true},mangle:{properties:{builtins:true,regex:/^(before|pivot|ax|angle|after|frames|at)$/}}})).code;
fs.writeFileSync('dev.html',shell(source));
const packer=new Packer([{data:min,type:'js',action:'eval'}],{});
await packer.optimize(3);
const {firstLine,secondLine}=packer.makeDecoder();
fs.writeFileSync('dq03.html',shell(firstLine+'\n'+secondLine));
const bytes=fs.statSync('dq03.html').size;
console.log(`Complete HTML: ${bytes} bytes. Budget: 4096 bytes.`);
if(bytes>4096)process.exitCode=1;


