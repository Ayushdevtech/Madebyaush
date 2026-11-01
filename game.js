import * as THREE from 'three';

const root = document.getElementById('game-root');
const loading = document.getElementById('loading');
const intro = document.getElementById('intro');
const hud = document.getElementById('hud');
const toastEl = document.getElementById('toast');
const interactionEl = document.getElementById('interaction');
const missionEl = document.getElementById('mission-text');
const locationEl = document.getElementById('location-name');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91cbed);
scene.fog = new THREE.Fog(0x91cbed, 85, 260);

const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdff4ff, 0x65734e, 2.0));
const sun = new THREE.DirectionalLight(0xfff1d5, 2.1);
sun.position.set(-45, 75, 35); sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-90; sun.shadow.camera.right=90; sun.shadow.camera.top=90; sun.shadow.camera.bottom=-90;
scene.add(sun);

const mat = (color, roughness=.86) => new THREE.MeshStandardMaterial({color, roughness});
const materials = {
  grass:mat(0x67a95b), road:mat(0x303943), sidewalk:mat(0xb9b7a8), line:mat(0xe9dfb5),
  trunk:mat(0x76503a), leaf1:mat(0x2e8a50), leaf2:mat(0x59a94e), leaf3:mat(0x8abf4c),
  glass: new THREE.MeshStandardMaterial({color:0x8bc9dc,metalness:.25,roughness:.22}),
  dark:mat(0x26313c), white:mat(0xf2f0e7), skin:mat(0xd69a70), hair:mat(0x38251d)
};
const boxGeo = new THREE.BoxGeometry(1,1,1);
const sphereGeo = new THREE.SphereGeometry(1,12,10);
function box(parent, x,y,z, sx,sy,sz, material, cast=true){
  const m=new THREE.Mesh(boxGeo,material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m;
}
function sphere(parent,x,y,z,sx,sy,sz,material){
  const m=new THREE.Mesh(sphereGeo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;
}
function cylinder(parent,x,y,z,r1,r2,h,material,segments=8){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
}

// Ground and city grid
const ground = new THREE.Mesh(new THREE.PlaneGeometry(360,360), materials.grass);
ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
const roadLines=[];
function road(x,z,w,d){
  box(scene,x,.015,z,w,.06,d,materials.road,false);
  if(w>d){
    for(let p=-w/2+5;p<w/2-3;p+=10) box(scene,x+p,.052,z,.0+3,.025,.13,materials.line,false);
  }else{
    for(let p=-d/2+5;p<d/2-3;p+=10) box(scene,x,.052,z+p,.13,.025,3,materials.line,false);
  }
}
road(0,0,360,13);road(0,0,13,360);
road(0,65,360,11);road(0,-65,360,11);road(65,0,11,360);road(-65,0,11,360);
function sidewalkStrip(x,z,w,d){box(scene,x,.08,z,w,.16,d,materials.sidewalk,false)}
sidewalkStrip(0,8.1,360,.9);sidewalkStrip(0,-8.1,360,.9);
sidewalkStrip(8.1,0,.9,360);sidewalkStrip(-8.1,0,.9,360);
sidewalkStrip(0,70.8,360,.8);sidewalkStrip(0,59.2,360,.8);
sidewalkStrip(70.8,0,.8,360);sidewalkStrip(59.2,0,.8,360);

// Buildings with colorful façades, roofs and windows
const buildingColors=[0xe7c7a2,0xd5dfdc,0xe7aaa0,0xc5d5e8,0xe6d88f,0xc5dfc4,0xd4c2e8];
const roofColors=[0x9a5142,0x566b79,0x7c6554,0x657b61];
function building(x,z,w,d,h,idx){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const body=box(g,0,h/2,0,w,h,d,mat(buildingColors[idx%buildingColors.length]),true);
  box(g,0,h+.12,0,w+.5,.25,d+.5,mat(roofColors[idx%roofColors.length]),true);
  const floors=Math.max(2,Math.floor(h/3.2));
  for(let f=0;f<floors;f++){
    for(let side=-1;side<=1;side+=2){
      const count=Math.max(2,Math.floor(w/2.6));
      for(let i=0;i<count;i++){
        const wx=-w/2+(i+0.5)*w/count;
        box(g,wx,1.45+f*3.1,side*(d/2+.012),.72,1.05,.035,materials.glass,false);
      }
    }
  }
  // Door
  box(g,0,1.05,d/2+.025,1.05,2.1,.08,mat(0x604332),false);
  return g;
}
const blocks=[-105,-35,35,105];
let bidx=0;
for(const x of blocks) for(const z of blocks){
  if(Math.abs(x)<40 && Math.abs(z)<40) continue;
  building(x,z,17+(bidx%3)*2,15+((bidx+1)%3)*2,10+(bidx%4)*3,bidx++);
}
// Smaller houses near outer streets
const houseColors=[0xf2d7ae,0xb9d9d2,0xf0bcb2,0xd7d5ed,0xe5d99d];
function house(x,z,i){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  box(g,0,2.2,0,8,4.4,7,mat(houseColors[i%houseColors.length]));
  const roof=new THREE.Mesh(new THREE.ConeGeometry(6.2,3,4),mat(roofColors[i%roofColors.length]));
  roof.position.set(0,5.8,0);roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);
  box(g,0,1.2,3.55,1.3,2.4,.12,mat(0x684b3d));
  for(const wx of [-2.5,2.5])box(g,wx,2.7,3.58,1.3,1.2,.1,materials.glass,false);
}
for(let i=0;i<18;i++){
  const side=i%4, t=-115+(i*17)%230;
  const x=side===0?-83:side===1?83:t, z=side===2?-83:side===3?83:t;
  house(x,z,i);
}

// Trees: trunk + layered foliage
function tree(x,z,scale=1,variant=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
  cylinder(g,0,1.5,0,.28,.42,3,materials.trunk,7);
  const leafMat=[materials.leaf1,materials.leaf2,materials.leaf3][variant%3];
  sphere(g,0,3.5,0,1.35,1.45,1.3,leafMat);
  sphere(g,-.65,3.15,.15,.85,.9,.85,leafMat);
  sphere(g,.65,3.2,-.12,.8,.9,.85,leafMat);
}
for(let i=0;i<95;i++){
  const x=-145+(i*37)%290,z=-145+(i*61)%290;
  if(Math.abs(x)<16||Math.abs(z)<16||Math.abs(Math.abs(x)-65)<12||Math.abs(Math.abs(z)-65)<12)continue;
  tree(x,z,.72+(i%4)*.12,i%3);
}
for(let i=-15;i<=15;i++){
  if(i%2===0){tree(i*7,11,.8,i%3);tree(i*7,-11,.8,(i+1)%3);tree(11,i*7,.8,(i+2)%3);tree(-11,i*7,.8,i%3);}
}

// Decorative street lamps
const lampMat=mat(0x303b45), bulbMat=new THREE.MeshBasicMaterial({color:0xffe6a6});
function lamp(x,z){
  cylinder(scene,x,2.1,z,.08,.11,4.2,lampMat,7);
  box(scene,x+.55,4.15,z,1.1,.09,.12,lampMat,false);
  sphere(scene,x+1.03,4.08,z,.18,.12,.18,bulbMat);
}
for(let i=-8;i<=8;i+=2){lamp(i*8,9.5);lamp(i*8,-9.5);}

// Character builder: detailed low-poly person with animated limbs
function makePerson(shirt=0x397fba,pants=0x263b52){
  const g=new THREE.Group();
  const shirtMat=mat(shirt),pantsMat=mat(pants),skinMat=mat(0xc98d68),shoeMat=mat(0x22272d);
  const torso=box(g,0,1.55,0,.72,.9,.38,shirtMat);
  sphere(g,0,2.23,0,.29,.33,.29,skinMat);
  // Hair cap and fringe
  sphere(g,0,2.43,-.015,.30,.17,.31,materials.hair);
  box(g,0,2.31,.25,.34,.11,.08,materials.hair,false);
  // eyes and nose
  sphere(g,-.105,2.25,.263,.035,.04,.025,mat(0x211b19));
  sphere(g,.105,2.25,.263,.035,.04,.025,mat(0x211b19));
  sphere(g,0,2.17,.30,.045,.055,.045,skinMat);
  const arms=[],legs=[];
  for(const s of [-1,1]){
    const arm=new THREE.Group();arm.position.set(s*.48,1.88,0);g.add(arm);
    box(arm,0,-.36,0,.19,.68,.2,shirtMat);
    sphere(arm,0,-.73,0,.105,.12,.11,skinMat);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(s*.21,1.12,0);g.add(leg);
    box(leg,0,-.39,0,.25,.75,.28,pantsMat);
    box(leg,0,-.79,.09,.27,.16,.43,shoeMat);legs.push(leg);
  }
  g.userData={arms,legs};
  return g;
}
const player=makePerson(0x1d7890,0x24364d);player.position.set(0,0,2);scene.add(player);

// Pedestrians wander in designated sidewalk areas
const pedestrians=[];
for(let i=0;i<14;i++){
  const p=makePerson([0xe18c45,0x8c72b7,0x4e9c70,0xc45c60,0x4c91b8][i%5],[0x37465a,0x51453d,0x354a3c][i%3]);
  p.position.set(-50+(i*19)%100,0,(i%2?10.5:-10.5));scene.add(p);
  pedestrians.push({mesh:p,phase:i*.7,origin:p.position.clone(),speed:.55+(i%4)*.12});
}

// Security bots are harmless mission targets to scan/tag
const bots=[];
function makeBot(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  box(g,0,1.15,0,.85,1.3,.62,mat(0xd84b4b));
  sphere(g,0,2.02,0,.42,.4,.4,mat(0xb9c6ce));
  box(g,0,2.04,.36,.38,.09,.04,mat(0x283640));
  for(const s of [-1,1]){
    cylinder(g,s*.53,1.2,0,.11,.11,.8,mat(0x8a9ba7),8);
    cylinder(g,s*.22,.35,0,.12,.12,.7,mat(0x45515b),8);
  }
  bots.push({mesh:g,tagged:false,base:new THREE.Vector3(x,0,z),phase:x*.1});
}
makeBot(32,25);makeBot(-42,40);makeBot(85,-28);makeBot(-90,-55);

// Vehicles
const vehicles=[];
function makeCar(x,z,color=0x2f8bc3,angle=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
  const bodyMat=mat(color,.48);
  box(g,0,.62,0,2.2,.72,4.1,bodyMat);
  box(g,0,1.12,-.15,1.72,.72,2.1,materials.glass);
  box(g,0,1.05,1.45,1.9,.13,.45,bodyMat);
  const tireMat=mat(0x171c22);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const wheel=cylinder(g,sx*1.05,.38,sz*1.25,.37,.37,.22,tireMat,12);
    wheel.rotation.z=Math.PI/2;
  }
  const headMat=new THREE.MeshBasicMaterial({color:0xfff2c5});
  box(g,-.72,.72,2.08,.35,.22,.06,headMat,false);box(g,.72,.72,2.08,.35,.22,.06,headMat,false);
  vehicles.push({mesh:g,speed:0,angle,occupied:false,color});
  return vehicles[vehicles.length-1];
}
makeCar(4,4,0x287db5,Math.PI);makeCar(25,-5,0xd4a13d,Math.PI/2);makeCar(-27,5,0x55a66c,-Math.PI/2);
makeCar(48,65,0xc85a4e,Math.PI);makeCar(-48,-65,0x8d82c4,0);

// A few non-player cars cruise on roads
const traffic=[];
for(let i=0;i<7;i++){
  const v=makeCar(-150+i*43,65,i%2?0xe2e7e8:0x398a9b,Math.PI/2);
  v.traffic=true;v.speed=4+(i%3);traffic.push(v);
}

const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let started=false,inCar=null,playerSpeed=0,verticalVelocity=0,onGround=true,walkClock=0,missionCount=0;
let cameraYaw=0,cameraPitch=.22,dragging=false,lastPointer={x:0,y:0};
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastPointer={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging||!started)return;cameraYaw-=(e.clientX-lastPointer.x)*.004;cameraPitch=THREE.MathUtils.clamp(cameraPitch+(e.clientY-lastPointer.y)*.002,-.05,.7);lastPointer={x:e.clientX,y:e.clientY};});
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&started)toggleCar();if(e.code==='Space'&&started&&!inCar&&onGround){verticalVelocity=6.4;onGround=false;}});
function showToast(msg){
  toastEl.textContent=msg;toastEl.classList.add('show');
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toastEl.classList.remove('show'),2200);
}
function toggleCar(){
  if(inCar){
    const pos=inCar.mesh.position.clone();
    player.position.set(pos.x+2.1,0,pos.z);player.rotation.y=inCar.mesh.rotation.y;
    inCar.occupied=false;inCar.speed=0;inCar=null;player.visible=true;
    showToast('You are back on foot.');
    return;
  }
  let nearest=null,dist=4.5;
  for(const v of vehicles){if(v.traffic)continue;const d=v.mesh.position.distanceTo(player.position);if(d<dist){dist=d;nearest=v;}}
  if(nearest){inCar=nearest;nearest.occupied=true;player.visible=false;showToast('Vehicle ready. Use W A S D to drive.');}
}
function updatePlayer(dt,t){
  if(inCar){
    const v=inCar;
    const accel=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
    v.speed=THREE.MathUtils.damp(v.speed,accel*(keys.shift?23:15),2.2,dt);
    const steer=(keys.a||keys.arrowleft?1:0)-(keys.d||keys.arrowright?1:0);
    v.mesh.rotation.y+=steer*dt*(1.25+Math.abs(v.speed)*.035)*Math.sign(v.speed||1);
    const forward=new THREE.Vector3(Math.sin(v.mesh.rotation.y),0,Math.cos(v.mesh.rotation.y));
    v.mesh.position.addScaledVector(forward,v.speed*dt);
    v.mesh.position.x=THREE.MathUtils.clamp(v.mesh.position.x,-165,165);
    v.mesh.position.z=THREE.MathUtils.clamp(v.mesh.position.z,-165,165);
    return;
  }
  let forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  let side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  const moving=forward!==0||side!==0;
  const speed=keys.shift?9.3:5.4;
  const dir=new THREE.Vector3(side,0,forward);
  if(moving){
    dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),cameraYaw);
    player.position.addScaledVector(dir,speed*dt);
    player.rotation.y=Math.atan2(dir.x,dir.z);
  }
  player.position.x=THREE.MathUtils.clamp(player.position.x,-165,165);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-165,165);
  if(!onGround){verticalVelocity-=17*dt;player.position.y+=verticalVelocity*dt;if(player.position.y<=0){player.position.y=0;verticalVelocity=0;onGround=true;}}
  walkClock+=dt*(moving?speed*.95:1.5);
  const swing=moving?Math.sin(walkClock)*.62:0;
  player.userData.legs.forEach((l,i)=>l.rotation.x=swing*(i===0?1:-1));
  player.userData.arms.forEach((a,i)=>a.rotation.x=-swing*(i===0?1:-1)*.8);
}
function updateWorld(dt,t){
  pedestrians.forEach((p,i)=>{
    p.mesh.position.x=p.origin.x+Math.sin(t*p.speed*.35+p.phase)*7;
    p.mesh.position.z=p.origin.z+Math.cos(t*p.speed*.35+p.phase)*1.2;
    const swing=Math.sin(t*3+p.phase)*.35;
    p.mesh.userData.legs.forEach((l,j)=>l.rotation.x=swing*(j? -1:1));
    p.mesh.userData.arms.forEach((a,j)=>a.rotation.x=-swing*(j? -1:1));
    p.mesh.rotation.y=Math.cos(t*p.speed*.35+p.phase)>0?Math.PI/2:-Math.PI/2;
  });
  bots.forEach((b,i)=>{if(!b.tagged){b.mesh.position.x=b.base.x+Math.sin(t*.4+b.phase)*1.5;b.mesh.rotation.y=Math.sin(t*.5+b.phase)*.3;}});
  traffic.forEach((v,i)=>{
    if(v.occupied)return;
    v.mesh.position.z+=v.speed*dt;
    if(v.mesh.position.z>170)v.mesh.position.z=-170;
  });
  // City district label
  const d=Math.hypot(player.position.x,player.position.z);
  locationEl.textContent=d<28?'CENTRAL DISTRICT':d<85?'RESIDENTIAL DISTRICT':'OUTER CITY';
  const nearestBot=bots.find(b=>!b.tagged&&b.mesh.position.distanceTo(player.position)<4.2);
  if(nearestBot){
    interactionEl.classList.remove('hidden');interactionEl.innerHTML='PRESS <b>F</b> TO SCAN SECURITY BOT';
  }else if(!inCar){
    const nearCar=vehicles.some(v=>!v.traffic&&v.mesh.position.distanceTo(player.position)<4.5);
    if(nearCar){interactionEl.classList.remove('hidden');interactionEl.innerHTML='PRESS <b>E</b> TO ENTER VEHICLE';}
    else interactionEl.classList.add('hidden');
  }else interactionEl.classList.add('hidden');
}
addEventListener('keydown',e=>{
  if(e.key.toLowerCase()==='f'&&started&&!inCar){
    const b=bots.find(x=>!x.tagged&&x.mesh.position.distanceTo(player.position)<4.2);
    if(b){b.tagged=true;b.mesh.traverse(o=>{if(o.material&&o.material.color)o.material.color.set(0x4c9f83);});missionCount++;missionEl.textContent=`Scan security bots (${missionCount}/4)`;showToast(`Bot scanned. ${4-missionCount} remaining.`);if(missionCount===4){missionEl.textContent='City patrol complete';showToast('MISSION COMPLETE — CITY PATROL');}}
  }
});
function updateCamera(dt){
  const target=inCar?inCar.mesh.position:player.position;
  const yaw=cameraYaw+(inCar?inCar.mesh.rotation.y:0);
  const distance=inCar?10:8.5;
  const desired=new THREE.Vector3(
    target.x-Math.sin(yaw)*distance,
    target.y+3.2+cameraPitch*5,
    target.z-Math.cos(yaw)*distance
  );
  camera.position.lerp(desired,1-Math.exp(-5*dt));
  camera.lookAt(target.x,target.y+1.25,target.z);
}
function drawMap(){
  const c=document.getElementById('minimap'),ctx=c.getContext('2d');
  ctx.clearRect(0,0,150,150);ctx.fillStyle='#283a3d';ctx.fillRect(0,0,150,150);
  const scale=.36,px=75-player.position.x*scale,pz=75-player.position.z*scale;
  ctx.strokeStyle='#aab2a9';ctx.lineWidth=5;
  for(const r of [-65,0,65]){ctx.beginPath();ctx.moveTo(75+r*scale,0);ctx.lineTo(75+r*scale,150);ctx.stroke();ctx.beginPath();ctx.moveTo(0,75+r*scale);ctx.lineTo(150,75+r*scale);ctx.stroke();}
  bots.filter(b=>!b.tagged).forEach(b=>{ctx.fillStyle='#ed5d5d';ctx.beginPath();ctx.arc(75+b.mesh.position.x*scale,75+b.mesh.position.z*scale,3,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#7ce3c1';ctx.beginPath();ctx.arc(75,75,4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#7ce3c1';ctx.lineWidth=1.5;ctx.stroke();
}
let last=performance.now(),elapsed=0;
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.035);last=now;elapsed+=dt;
  if(started){
    updatePlayer(dt,elapsed);updateWorld(dt,elapsed);updateCamera(dt);
    drawMap();
    const mins=Math.floor((elapsed*2)%60).toString().padStart(2,'0');
    document.getElementById('clock').textContent=`12:${mins}`;
  }else{
    camera.position.set(30,25,40);camera.lookAt(0,0,0);
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

function startGame(){
  started=true;intro.classList.add('hidden');hud.classList.remove('hidden');
  showToast('Welcome to Ayush City. Explore freely.');
}
document.getElementById('start-btn').addEventListener('click',startGame);
document.getElementById('close-intro').addEventListener('click',startGame);
setTimeout(()=>{loading.style.opacity='0';setTimeout(()=>loading.remove(),550);},650);
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
});
