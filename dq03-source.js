let g=c.getContext('2d'),M=Math,U,start;
let add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),sub=(a,b)=>add(a,mul(b,-1)),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/M.hypot(...a)),clamp=x=>M.max(0,M.min(1,x)),smooth=x=>(x=clamp(x))*x*(3-2*x);
let mix=(a,b,t)=>add(a,mul(sub(b,a),t)),normal=f=>unit(cross(sub(f[1],f[0]),sub(f[2],f[0]))),center=f=>mul(f.reduce(add,[0,0,0]),1/f.length),vertices=b=>b.flat(),transform=(b,fn)=>b.map(f=>f.map(fn));
function rotate(p,o,axis,a){let q=sub(p,o),cs=M.cos(a),sn=M.sin(a);return add(o,add(add(mul(q,cs),mul(cross(axis,q),sn)),mul(axis,dot(axis,q)*(1-cs))));}
function cut(body,n,h){
 let cap=[],result=[];
 for(let face of body){let f=[];
  for(let i=0;i<face.length;i++){
   let a=face[i],b=face[(i+1)%face.length],d=dot(a,n)-h,e=dot(b,n)-h;
   if(d<1e-6)f.push(a);
   if(d*e<0){let q=add(a,mul(sub(b,a),d/(d-e)));f.push(q);if(!cap.some(v=>M.hypot(...sub(v,q))<1e-5))cap.push(q);}
  }
  if(f.length>2)result.push(f);
 }
 if(cap.length>2){let o=center(cap),u=unit(sub(cap[0],o)),v=cross(n,u);cap.sort((a,b)=>M.atan2(dot(sub(a,o),v),dot(sub(a,o),u))-M.atan2(dot(sub(b,o),v),dot(sub(b,o),u)));result.push(cap);}
 return result;
}
let points=[[0,1.8,.12],[0,0,0],[-.95,.73,-.6],[.78,.64,-.55],[.88,.9,.63],[-.68,.82,.8]],body=[];
for(let j=0;j<4;j++)for(let k=0;k<2;k++){
 let f=[points[k],points[2+j],points[2+(j+1)%4]];
 if(dot(normal(f),sub(center(f),[0,.8,0]))<0)f.reverse();body.push(f);
}
let n=normal(body[1]),axis=unit(cross(n,[0,-1,0])),a=M.acos(-n[1]);body=transform(body,p=>rotate(p,[0,0,0],axis,a));
let ground=b=>{let y=M.min(...vertices(b).map(p=>p[1]));return transform(b,p=>add(p,[0,-y,0]));};body=ground(body);
let events=[],debris=[],clock=4;
for(let i=0;i<13;i++){
 let face=body.reduce((a,b)=>center(a)[1]<center(b)[1]?a:b),direction=unit([1,0,.32*M.sin(i*1.7)]),edge,best=-1e9;
 for(let j=0;j<face.length;j++){let p=face[j],q=face[(j+1)%face.length],score=dot(mul(add(p,q),.5),direction);if(score>best){best=score;edge=[p,q];}}
 let [pivot,end]=edge,ax=unit(sub(end,pivot)),adj=body.find(f=>f!==face&&edge.every(p=>f.some(q=>M.hypot(...sub(p,q))<1e-5)));
 let nn=normal(adj),down=[0,-1,0],angle=M.atan2(dot(ax,cross(nn,down)),dot(nn,down)),before=body;
 let landed=ground(transform(body,p=>rotate(p,pivot,ax,angle))),length=2.6+i*.17;
 let dir=unit([-1,.18,.18*M.sin(i*1.3)]),values=vertices(landed).map(p=>dot(p,dir)),hi=M.max(...values),lo=M.min(...values),level=hi-(hi-lo)*(.13+.015*(i%3));
 let chip=cut(landed,mul(dir,-1),-level),after=cut(landed,dir,level),at=clock+length,frames=[chip],v=[-1.2,.3,.18*M.sin(i*2)],spin=[.5,0,2.5],b=chip,cp=center(vertices(chip)),inertia=M.max(.003,M.max(...vertices(chip).map(p=>dot(sub(p,cp),sub(p,cp))))*.4);
 for(let j=0;j<180;j++){
  cp=center(vertices(b));let speed=M.hypot(...spin);v[1]-=5/60;
  b=transform(b,p=>add(speed>1e-5?rotate(p,cp,mul(spin,1/speed),speed/60):p,mul(v,1/60)));

  let low=M.min(...vertices(b).map(p=>p[1]));
  if(low<0){j>12&&(frames.h??=j);
   b=transform(b,p=>add(p,[0,-low,0]));let verts=vertices(b),contact=center(verts.filter(p=>p[1]<.008)),r=sub(contact,center(verts)),vy=add(v,cross(spin,r))[1];
   if(vy<0){let impulse=-1.18*vy/(1+(r[0]*r[0]+r[2]*r[2])/inertia);v[1]+=impulse;spin=add(spin,mul(cross(r,[0,impulse,0]),1/inertia));}
   v[0]*=.83;v[2]*=.83;spin=mul(spin,.91);
  }
  let gap=level-M.min(...vertices(b).map(p=>dot(p,dir)));if(gap>0){b=transform(b,p=>add(p,[(gap+.00001)/dir[0],0,0]));v[0]=M.min(v[0],-.2);}
  frames.push(b);
 }
 debris.push({at,frames});events.push({at:clock,length,before,pivot,ax,angle,after});body=after;clock=at+1.8+i*.25;
}
let last=events[12],duration=last.at+last.length*.62;
function picture(t){
 let w=innerWidth,h=innerHeight,dpr=M.min(devicePixelRatio,2);if(c.width!==(w*dpr|0)||c.height!==(h*dpr|0)){c.width=w*dpr;c.height=h*dpr;}
 g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#fff';g.fillRect(0,0,w,h);
 let current=events[0].before,pos=center(vertices(current)),shake=0;
 for(let e of events){if(t<e.at)break;let u=(t-e.at)/e.length,s=smooth((t-e.at)/(e.length+.8));pos=mix(center(vertices(e.before)),center(vertices(e.after)),s);if(u>=1){current=e.after;let age=t-e.at-e.length;shake=M.sin(age*40)*M.exp(-age*18)*1.6;continue;}let f=u<.64?.4*smooth(u/.64):.4+.6*M.pow((u-.64)/.36,1.9);current=transform(e.before,p=>rotate(p,e.pivot,e.ax,e.angle*f));break;}
 let reveal=smooth((t-duration*.52)/(duration*.44)),first=center(vertices(events[0].before)),camera=mix(pos,first,reveal*.5);
 let scale=M.min(w,h)*(.23-.15*reveal),project=p=>{let q=sub(p,camera);return[w*.5+(q[0]*.9-q[2]*.43)*scale,h*.58+shake*(1-.15/.23*reveal)+(q[0]*.18+q[2]*.38-p[1]*.92)*scale];};
 let objects=[current];
 for(let d of debris){if(t<d.at)break;objects.push(d.frames[M.min(180,(t-d.at)*60|0)]);}
 g.save();
 g.fillStyle='#ddd';
 for(let b of objects)for(let f of b){g.beginPath();f.forEach((p,i)=>{let q=project([p[0]+p[1]*.65,0,p[2]-p[1]*.3]);i?g.lineTo(...q):g.moveTo(...q)});g.closePath();g.fill();}

 let faces=objects.flat().filter(f=>dot(normal(f),[.43,.45,.9])>0);faces.sort((a,b)=>dot(center(a),[.43,.45,.9])-dot(center(b),[.43,.45,.9]));
 for(let f of faces){let n=normal(f),shade=9+M.max(0,dot(n,unit([-.5,1,.3])))*43;g.fillStyle=`rgb(${shade},${shade},${shade})`;g.strokeStyle=g.fillStyle;g.lineWidth=.55;g.beginPath();f.forEach((p,i)=>i?g.lineTo(...project(p)):g.moveTo(...project(p)));g.closePath();g.fill();g.stroke();}g.globalAlpha=1-smooth(t/4)*(1-smooth((t-duration+3)/3));g.fillStyle='#fff';g.fillRect(0,0,w,h);g.restore();
}
function frame(){let t=M.max(0,U.currentTime-start);picture(M.min(t,duration));if(t<duration)requestAnimationFrame(frame);}
onclick=async()=>{
 if(U)return;U=new AudioContext;document.body.requestFullscreen?.().catch(()=>{});await U.resume();d.remove();
 let master=U.createGain(),delay=U.createDelay(2),feedback=U.createGain(),low=U.createBiquadFilter();start=U.currentTime+.12;
 master.gain.setValueAtTime(0,start);master.gain.linearRampToValueAtTime(2.6,start+6);master.gain.setValueAtTime(2.6,start+duration-7);master.gain.linearRampToValueAtTime(0,start+duration);let q=U.createDynamicsCompressor();q.threshold.value=-24;q.knee.value=q.attack.value=0;master.connect(q).connect(U.destination);
 delay.delayTime.value=.75;feedback.gain.value=.55;low.frequency.value=1400;delay.connect(low).connect(feedback).connect(delay);low.connect(master);
 function tone(freq,at,len,amp,pan){let env=U.createGain(),st=U.createStereoPanner();st.pan.value=pan;env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(amp,at+M.min(4,len*.25));env.gain.exponentialRampToValueAtTime(1e-4,at+len);env.connect(st).connect(master);st.connect(delay);for(let j=0;j<2;j++){let osc=U.createOscillator();osc.frequency.value=freq*(j?1.0018:1);osc.connect(env);osc.start(at);osc.stop(at+len);}}
 for(let i=0;i<6;i++)for(let j=0;j<4-(i/3|0);j++)tone(55*2**(("5<CJ5>EL3:AH".charCodeAt(i%4%3*4+j)-48)/12),start+i*14,20,.043*(j?.65**j:.9),(j-1.5)*.4);
 let noise=U.createBuffer(1,U.sampleRate*.4,U.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(M.random()*2-1)*M.exp(-i/U.sampleRate*18);
 events.filter(e=>e.at+e.length<duration).forEach((e,i)=>{let at=start+e.at+e.length,osc=U.createOscillator(),env=U.createGain();osc.frequency.setValueAtTime(76-i*2,at);osc.frequency.exponentialRampToValueAtTime(27,at+.18);env.gain.setValueAtTime(.25-i*.012,at);env.gain.exponentialRampToValueAtTime(1e-4,at+.45);osc.connect(env).connect(master);osc.start(at);osc.stop(at+.5);let source=U.createBufferSource();source.buffer=noise;source.connect(env);source.start(at);});debris.forEach((d,i)=>{let at=start+d.at+d.frames.h/60,o=U.createOscillator(),e=U.createGain(),n=U.createBufferSource();o.frequency.value=150+i*4;e.gain.setValueAtTime(.09-i*.005,at);e.gain.exponentialRampToValueAtTime(1e-4,at+.15);o.connect(e).connect(master);n.buffer=noise;n.connect(e);o.start(at);o.stop(at+.2);n.start(at)});frame();
};
picture(0);





