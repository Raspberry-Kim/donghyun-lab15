/* 동현닥 화면: 왼쪽 정보 · 가운데 약병 · 오른쪽 닥터 포동이와 다음 알약, 바이러스 수. 알약은 캡슐·태블릿·주사기 세 모양으로 그린다(색은 같은 규칙). */
(function(){
const E=window.Engine, SP=window.Sprites;
const C={paper:'#fbf7ef',panel:'#f3eee4',line:'#dcd2c1',ink:'#3a3042',sub:'#6d6178',glass:'#ebe5f3',glassLine:'#8d84a0',dot:'rgba(74,66,88,.10)',accent:'#f2b705',white:'#ffffff'};
const {GW,GH,CELL,BX,BY}=E;
const FONT='Pretendard, "Apple SD Gothic Neo", sans-serif';
function rr(g,x,y,w,h,r){ const R=Array.isArray(r)?r:[r,r,r,r]; g.beginPath(); g.moveTo(x+R[0],y); g.lineTo(x+w-R[1],y); g.quadraticCurveTo(x+w,y,x+w,y+R[1]); g.lineTo(x+w,y+h-R[2]); g.quadraticCurveTo(x+w,y+h,x+w-R[2],y+h); g.lineTo(x+R[3],y+h); g.quadraticCurveTo(x,y+h,x,y+h-R[3]); g.lineTo(x,y+R[0]); g.quadraticCurveTo(x,y,x+R[0],y); g.closePath(); }
const col=c=>SP.COL[c];


/* ---------- 동현크 포동이: 원본 24×20 도트를 정수 3배로 ----------
 * 흰 귀덮개·동그란 눈코·빨간 목줄·네발·말린 꼬리를 그대로 둔다.
 * 원본 도트의 관절과 알약 접점을 같은 변환으로 움직인다. 규칙의 14틱은 그대로다. */
const PX=368, PY=78, DS=3, PS=0.5;
const GIMMICKS=[
  {name:'tail',label:'꼬리치기',hit:0.36,flip:false,pivot:[4,8],tip:[1,3],angle:-0.65,part:(x,y)=>x<6&&y<9},
  {name:'head',label:'머리 들이받기',hit:0.4,flip:true,pivot:[12,18],tip:[23,8],angle:0.26,part:()=>true},
  {name:'paw',label:'앞발 차기',hit:0.4,flip:true,pivot:[13,15],tip:[16,18],angle:-0.9,part:(x,y)=>x>=10&&x<18&&y>=15},
  {name:'kick',label:'뒷발 차기',hit:0.42,flip:false,pivot:[6,15],tip:[2,18],angle:0.9,part:(x,y)=>x<10&&y>=15}];
function gimIndex(S){ return (S.pieces*3+S.stage*5+S.stagesDone)%GIMMICKS.length; }
function turnPoint(p,pivot,a){const x=p[0]-pivot[0],y=p[1]-pivot[1];return [pivot[0]+x*Math.cos(a)-y*Math.sin(a),pivot[1]+x*Math.sin(a)+y*Math.cos(a)];}
function gimmick(S){
  const G=GIMMICKS[gimIndex(S)];
  const amp=pt=>{const u=pt/E.THROW;return u<G.hit?Math.sin(u/G.hit*Math.PI/2):Math.max(0,1-(u-G.hit)/(1-G.hit)*1.6);};
  const origin=pt=>{const p=turnPoint(G.tip,G.pivot,G.angle*amp(pt));return {x:PX+(G.flip?24-p[0]:p[0])*DS-2*CELL*PS,y:PY+p[1]*DS-CELL*PS/2};};
  return {...G,amp,origin};
}
function drawDoctor(g,S,T){
  const throwing=S.status==='play'&&S.phase==='throw', G=throwing?gimmick(S):null;
  g.save();g.fillStyle='rgba(58,48,66,.12)';g.beginPath();g.ellipse(404,139,34,3,0,0,Math.PI*2);g.fill();
  g.translate(PX,PY);g.scale(DS,DS);
  if(G&&G.flip){g.translate(24,0);g.scale(-1,1);}
  const pixels=moving=>SP.PODONG_ROWS.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='.'||(G?G.part(x,y):false)!==moving)return;g.fillStyle=SP.PODONG_PAL[c];g.fillRect(x,y,1,1);
  }));
  pixels(false);
  if(G){g.translate(...G.pivot);g.rotate(G.angle*G.amp(S.pt));g.translate(-G.pivot[0],-G.pivot[1]);pixels(true);}
  g.restore();
}

/* ---------- 알약 한 칸 ---------- */
/* lx,ly: 짝의 상대 위치(0,0이면 홑알). shape 0 캡슐 · 1 태블릿 · 2 주사기. nd: 주사기에서 바늘이 있는 칸이면 true(없으면 옛 규칙: 짝이 왼쪽·위인 칸) */
const ang=(lx,ly)=>Math.atan2(ly,lx); /* 짝 쪽을 가리키는 각 */
function drawCell(g,px,py,c,shape,lx,ly,nd){
  const k=col(c), s=CELL, m=2, linked=lx||ly, cx=px+s/2, cy=py+s/2;
  g.lineWidth=1; g.strokeStyle='rgba(58,48,66,.75)';
  if(shape===0){ /* 캡슐: 짝 쪽은 평평, 바깥쪽은 둥글다. 홑알은 둥근 점 */
    if(!linked){ g.fillStyle=k.b; g.beginPath(); g.arc(px+s/2,py+s/2,6.5,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.arc(px+s/2-2,py+s/2-2,2,0,Math.PI*2); g.fill(); return; }
    const R=8, rad=[lx<0||ly<0?0:R, lx>0||ly<0?0:R, lx>0||ly>0?0:R, lx<0||ly>0?0:R];
    /* 가로 짝: 왼쪽 칸은 오른쪽 모서리가 평평(rad[1],rad[2]=0), 오른쪽 칸은 왼쪽 모서리가 평평 */
    const x=px+(lx<0?0:m), y=py+(ly<0?0:m), w=s-m-(lx?0:m), h=s-m-(ly?0:m);
    g.fillStyle=k.b; rr(g,x,y,w,h,rad); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.5)'; rr(g,x+3,y+3,w-6,3,1.5); g.fill();
    return; }
  if(shape===1){ /* 태블릿: 납작한 모서리 둥근 네모, 가운데 홈 */
    const x=px+m, y=py+m, w=s-2*m, h=s-2*m;
    g.fillStyle=k.b; rr(g,x,y,w,h,4); g.fill(); g.stroke();
    g.strokeStyle='rgba(58,48,66,.45)'; g.beginPath(); if(ly){ g.moveTo(x+3,y+h/2); g.lineTo(x+w-3,y+h/2); } else { g.moveTo(x+w/2,y+3); g.lineTo(x+w/2,y+h-3); } g.stroke();
    g.fillStyle='rgba(255,255,255,.45)'; rr(g,x+2,y+2,w-4,3,1.5); g.fill();
    if(linked){ g.fillStyle='rgba(58,48,66,.25)'; if(lx>0) g.fillRect(px+s-2,py+5,2,s-10); if(lx<0) g.fillRect(px,py+5,2,s-10); if(ly>0) g.fillRect(px+5,py+s-2,s-10,2); if(ly<0) g.fillRect(px+5,py,s-10,2); }
    return; }
  /* 주사기(v0.04 그림): 통(눈금 창, 끝에 바늘)과 밀대. 바늘 칸은 nd로 받는다(v0.05 규칙: 바늘이 돌리는 방향을 따라 오른쪽→아래→왼쪽→위로 돌아 돌릴 때마다 바늘·밀대 색이 맞바뀐다). nd가 없으면(옛 저장) 짝이 왼쪽·위인 칸. 홑알은 작은 앰풀 */
  if(!linked){ g.fillStyle=k.b; rr(g,px+5,py+7,10,11,[2,2,3,3]); g.fill(); g.stroke(); g.fillStyle=k.d; g.fillRect(px+8,py+3,4,4); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(px+7,py+9,2,6); return; }
  const barrel=nd===undefined?(lx<0||ly<0):!!nd;
  g.save(); g.translate(px+s/2,py+s/2); g.rotate(ang(lx,ly)+(barrel?Math.PI:0)); /* 가로 그림을 짝 방향에 맞춰 돌린다 */
  if(barrel){ /* 통: 왼쪽이 짝(밀대) 쪽, 오른쪽 끝에 바늘 */
    g.fillStyle=k.b; rr(g,-10,-6,14,12,[0,3,3,0]); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(-7,-3,8,6); g.fillStyle=k.d; g.fillRect(-7,-3,3,6);
    g.strokeStyle='rgba(58,48,66,.5)'; g.beginPath(); for(let i=-5;i<=-1;i+=2){ g.moveTo(i,-3); g.lineTo(i,-1); } g.stroke();
    g.fillStyle=k.d; g.fillRect(4,-2,2,4); g.strokeStyle=C.ink; g.lineWidth=1.2; g.beginPath(); g.moveTo(6,0); g.lineTo(10,0); g.stroke();
  } else { /* 밀대: 오른쪽이 짝(통) 쪽, 왼쪽 끝에 손잡이 날개 */
    g.fillStyle=k.b; rr(g,-4,-4,14,8,[2,0,0,2]); g.fill(); g.stroke();
    g.fillStyle=k.b; rr(g,-10,-7,5,14,2); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(-2,-2,10,2);
  }
  g.restore();
}
function drawVirus(g,px,py,c,frame){ const im=SP.face(c,frame,2); g.drawImage(im,px+1,py+1); }

/* ---------- 청록빛 유리 약병 ----------
 * 판(BX,BY에서 8×16칸)과 목 안쪽 40px는 그대로다. 8px 유리 벽과 두꺼운 바닥은
 * 모두 판 바깥에 그린다. 분홍 리본을 남기고, 유리 반사·눈금은 셀보다 먼저 그린다. */
const BT={wall:'#cee9e1',wall2:'#83b8ae',rim:'#4d7b78',in1:'#f5faf6',in2:'#e2f0e9',dot:'rgba(78,126,118,.14)',lid:'#f3b1b6',lid2:'#b96f82',lidHi:'#ffe5df',band:'#d3ab5a'};
function bottlePath(g,x,y,w,h,T,open){ /* 바깥 윤곽: 목 → 어깨 → 몸통 → 둥근 바닥. T는 벽 두께 */
  const nl=x+3*CELL-T, nr=x+5*CELL+T, top=y-T, ny=y-17, R=12;
  g.beginPath(); g.moveTo(nl,ny); g.lineTo(nl,top-2); g.quadraticCurveTo(nl,top,nl-6,top); g.lineTo(x-T+R,top); g.quadraticCurveTo(x-T,top,x-T,top+R);
  g.lineTo(x-T,y+h+T-R); g.quadraticCurveTo(x-T,y+h+T,x-T+R,y+h+T); g.lineTo(x+w+T-R,y+h+T); g.quadraticCurveTo(x+w+T,y+h+T,x+w+T,y+h+T-R);
  g.lineTo(x+w+T,top+R); g.quadraticCurveTo(x+w+T,top,x+w+T-R,top); g.lineTo(nr+6,top); g.quadraticCurveTo(nr,top,nr,top-2); g.lineTo(nr,ny); if(!open) g.closePath(); } /* open: 테두리만 그릴 때 입구를 가로지르지 않는다 */
function bottle(g){
  const x=BX,y=BY,w=GW*CELL,h=GH*CELL,T=8;
  g.save(); g.lineJoin='round'; g.lineCap='round'; g.lineWidth=1; /* 앞 프레임이 남긴 선 설정에 기대지 않는다(첫 프레임과 다음 프레임이 같게) */
  /* 바닥 그림자 */
  g.fillStyle='rgba(48,92,82,.12)'; g.beginPath(); g.ellipse(x+w/2,y+h+T+2,w/2+6,3,0,0,Math.PI*2); g.fill();
  /* 유리 벽: 바깥 윤곽을 칠하고 */
  const wg=g.createLinearGradient(x-T,0,x+w+T,0); wg.addColorStop(0,BT.wall2); wg.addColorStop(0.035,'#f3fff7'); wg.addColorStop(0.08,BT.wall); wg.addColorStop(0.5,'#e0f3e9'); wg.addColorStop(0.91,BT.wall); wg.addColorStop(0.965,BT.wall2); wg.addColorStop(1,'#65998f');
  bottlePath(g,x,y,w,h,T); g.fillStyle=wg; g.fill();
  /* 판 안(목 안쪽 포함): 무늬를 억제한 맑은 유리. 알약 세 색과 구별된다. */
  const ig=g.createLinearGradient(x,y-18,x+w,y+h); ig.addColorStop(0,BT.in1); ig.addColorStop(0.55,'#eef7ef'); ig.addColorStop(1,BT.in2);
  g.fillStyle=ig; g.fillRect(x,y,w,h); g.fillRect(x+3*CELL,y-18,2*CELL,18+1);
  g.fillStyle=BT.dot; for(let i=1;i<GW;i++) for(let j=1;j<GH;j++) g.fillRect(x+i*CELL-1,y+j*CELL-1,2,2);
  /* 왼쪽 유리 반사. 넓은 대각선이나 기포를 판 가운데에 두지 않는다. */
  const sheen=g.createLinearGradient(x,0,x+14,0); sheen.addColorStop(0,'rgba(255,255,255,.65)'); sheen.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=sheen; g.fillRect(x,y,14,h);
  g.fillStyle='rgba(70,116,106,.07)'; g.fillRect(x+w-2,y,2,h);
  /* 바깥 테두리와 안쪽 흰 테 */
  g.lineJoin='round'; g.lineCap='round'; bottlePath(g,x,y,w,h,T,true); g.strokeStyle=BT.rim; g.lineWidth=2; g.stroke();
  g.strokeStyle='rgba(80,132,119,.35)'; g.lineWidth=1; g.strokeRect(x-0.5,y-0.5,w+1,h+1);
  g.beginPath(); g.moveTo(x+3*CELL-0.5,y-1); g.lineTo(x+3*CELL-0.5,y-17); g.moveTo(x+5*CELL+0.5,y-1); g.lineTo(x+5*CELL+0.5,y-17); g.stroke();
  /* 왼쪽 벽 반짝임(긴 줄 + 짧은 점) · 어깨 반짝임 */
  g.fillStyle='rgba(255,255,255,.88)'; rr(g,x-T+2,y+14,2,h*0.55,1); g.fill(); rr(g,x-T+2,y+h*0.55+22,2,38,1); g.fill();
  g.fillStyle='rgba(255,255,255,.7)'; rr(g,x+8,y-T+2,30,2,1); g.fill();
  /* 오른쪽 벽 눈금(네 칸마다 길게) */
  g.fillStyle='rgba(57,109,99,.48)'; for(let j=1;j<GH;j++) g.fillRect(x+w+2,y+j*CELL-1,j%4===0?4:2,1);
  /* 두꺼운 유리 바닥의 반사 두 줄. 맨 아래 칸은 비워 둔다. */
  g.fillStyle='rgba(255,255,255,.85)'; rr(g,x+8,y+h+2,w-16,2,1); g.fill();
  g.fillStyle='rgba(66,119,106,.22)'; rr(g,x+15,y+h+5,w-30,1,0.5); g.fill();
  /* 목 위 입술: 양쪽에 황동색 고리(가운데 입구 40px는 열려 있어 알약이 들어온다) */
  for(const [lx,lw] of [[x+3*CELL-T-4,T+4],[x+5*CELL,T+4]]){ const ly=y-24;
    g.fillStyle='#ead6ab'; rr(g,lx,ly,lw,9,[3,3,2,2]); g.fill(); g.strokeStyle='#aa8955'; g.lineWidth=1; g.stroke();
    g.fillStyle=BT.band; g.fillRect(lx+1,ly+6,lw-2,2); g.fillStyle='#fff4d7'; g.fillRect(lx+2,ly+2,lw-4,2); }
  /* 목 왼쪽에 맨 분홍 리본(입구는 비워 둔다) */
  ribbon(g,x+3*CELL-T-2,y-9);
  /* 반짝 별: 어깨 위 양쪽 */
  star(g,x+w-10,y-15,3); star(g,x+w-20,y-20,1.5);
  g.restore();
}
function ribbon(g,kx,ky){ /* kx,ky: 매듭. 고리 둘은 왼쪽 위·왼쪽 아래로, 꼬리 둘은 어깨 위로 */
  g.save(); g.lineJoin='round'; g.lineWidth=1.2; g.strokeStyle=BT.lid2;
  const loop=(a)=>{ g.save(); g.translate(kx,ky); g.rotate(a); g.fillStyle=BT.lid; g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(-6,-7,-15,-6,-14,0); g.bezierCurveTo(-15,6,-6,7,0,0); g.closePath(); g.fill(); g.stroke(); g.fillStyle=BT.lidHi; g.beginPath(); g.ellipse(-9,-2,3,1.2,0,0,Math.PI*2); g.fill(); g.restore(); };
  loop(-0.35); loop(0.45);
  g.fillStyle=BT.lid; for(const [tx,ty] of [[-9,10],[-3,12]]){ g.beginPath(); g.moveTo(kx-1,ky+1); g.lineTo(kx+tx,ky+ty); g.lineTo(kx+tx+3,ky+ty-1); g.lineTo(kx+1,ky+1); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle=BT.lid2; g.beginPath(); g.arc(kx,ky,2.6,0,Math.PI*2); g.fill(); g.fillStyle=BT.lidHi; g.fillRect(kx-1,ky-1.5,1.5,1); g.restore(); }
function star(g,cx,cy,r){ g.save(); g.fillStyle='#f2b705'; g.beginPath(); for(let i=0;i<8;i++){ const a=i*Math.PI/4, rr2=i%2?r*0.38:r; g.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2); } g.closePath(); g.fill(); g.restore(); }

/* ---------- 패널 ---------- */
function wrapText(g,t,maxW){ /* 넘치면 ' · ' 뒤에서 먼저 끊고, 없으면 마지막 띄어쓰기에서 끊는다. 한 글자 낱말('한 칸'의 '한') 바로 뒤에서는 끊지 않는다. 띄어쓰기가 없으면 그 자리에서 */
  const cut=(line)=>{ const d=line.lastIndexOf(' · '); if(d>0) return [line.slice(0,d+2),line.slice(d+3)];
    for(let k=line.lastIndexOf(' ');k>0;k=line.lastIndexOf(' ',k-1)){ const prev=line.lastIndexOf(' ',k-1); if(k-prev-1>1) return [line.slice(0,k),line.slice(k+1)]; }
    return null; };
  const out=[]; let cur='';
  for(const ch of t){ const n=cur+ch; if(g.measureText(n).width<=maxW||!cur){ cur=n; continue; }
    const c=cut(n); if(c&&g.measureText(c[0]).width<=maxW){ out.push(c[0].trim()); cur=c[1]; } else { out.push(cur.trim()); cur=ch===' '?'':ch; } }
  if(cur.trim()) out.push(cur.trim()); return out; }
function panel(g,x,y,w,h,tint=C.panel){
  g.fillStyle=tint;rr(g,x,y,w,h,8);g.fill();g.strokeStyle=C.line;g.lineWidth=1;g.stroke();
}
function text(g,t,x,y,size=10,color=C.sub,weight=600,align='left'){
  g.font=`${weight} ${size}px ${FONT}`;g.fillStyle=color;g.textAlign=align;g.textBaseline='top';g.fillText(t,x,y);
}
function fitText(g,t,x,y,width,size=18,color=C.ink){
  while(size>9){g.font=`700 ${size}px ${FONT}`;if(g.measureText(t).width<=width)break;size--;}
  text(g,t,x,y,size,color,700);
}
function render(g,S,T){
  const W=E.W,H=E.H;
  g.clearRect(0,0,W,H); g.fillStyle=C.paper; g.fillRect(0,0,W,H);
  const sp=E.speedOf(S);
  /* 양옆 128px, 바깥 여백 12px. 약병 중심은 240px이다. */
  panel(g,12,26,128,196);
  text(g,'단계',24,38);text(g,String(S.stage).padStart(2,'0'),24,54,26,C.ink,700);
  text(g,`/ ${E.STAGES}`,67,66,11);
  g.fillStyle=C.line;g.fillRect(24,90,104,1);g.fillRect(24,156,104,1);
  text(g,'남은 바이러스',24,102);text(g,String(S.viruses),24,118,26,'#356b61',700);
  text(g,'속도',24,168);text(g,`${sp.name} · ${E.framesPerDrop(S)}f`,24,186,14,C.ink,700);
  panel(g,12,234,128,62);text(g,'점수',24,244);
  fitText(g,S.score.toLocaleString('ko-KR'),24,258,104,20);
  if(S.lastClear)fitText(g,`마지막 지움 +${S.lastClear.gained.toLocaleString('ko-KR')}`,24,282,104,9,C.sub);
  if(!(S.msg&&S.msgT>0)){
    text(g,'←→ 옮기기 · ↓ 빨리 내리기',76,308,9,C.sub,500,'center');
    text(g,'X·↑ 시계 · Z 반시계',76,321,9,C.sub,500,'center');
    text(g,'Enter 메뉴',76,334,9,C.sub,500,'center');
  }
  panel(g,340,26,128,164,'#edf3ec');
  text(g,'닥터 포동이',352,38,11,'#356b61',700);
  g.fillStyle='#d5e3d6';g.fillRect(352,58,104,1);
  text(g,S.status==='play'&&S.phase==='throw'?gimmick(S).label:'알약을 준비하는 중',404,162,10,C.sub,500,'center');
  bottle(g);
  /* 칸 */
  const frame=Math.floor(T/24)%2, marks=new Set(S.marks);
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ const o=S.cells[E.idx(x,y)]; if(!o) continue; const px=BX+x*CELL, py=BY+y*CELL;
    if(o.kind==='virus') drawVirus(g,px,py,o.c,(frame+(o.seed||0))%2); else drawCell(g,px,py,o.c,o.shape,o.lx,o.ly,o.n);
    if(marks.has(E.idx(x,y))){ const a=0.35+0.45*Math.abs(Math.sin(T*0.6)); g.fillStyle=`rgba(255,255,255,${a})`; g.fillRect(px+1,py+1,CELL-2,CELL-2); } }
  /* 오른쪽: 닥터 포동이(알약보다 먼저 그려 던지는 알약이 위에 보인다) */
  drawDoctor(g,S,T);
  /* 떨어지는 알약 */
  if(S.piece&&S.status==='play'){
    const p=S.piece, cs=E.cellsOf(p);
    if(S.phase==='throw'){ const u=S.pt/E.THROW, G=gimmick(S), o=G.origin(S.pt); const x1=BX+3*CELL, y1=BY;
      /* 준비 동작 동안은 알약이 포동이의 꼬리·머리·발에 붙어 있고, 때리는 순간부터 포물선으로 약병 입구까지 날아간다 */
      let x=o.x, y=o.y, sc=PS; if(u>G.hit){ const v=(u-G.hit)/(1-G.hit), e=1-(1-v)*(1-v); x=o.x+(x1-o.x)*e; y=o.y+(y1-o.y)*e-Math.sin(v*Math.PI)*36; sc=PS+(1-PS)*e; }
      /* 쥐고 있는 알약은 1/2 크기, 날아가며 약병 입구에서 제 크기가 된다. */
      g.save(); g.translate(x,y); g.scale(sc,sc); drawCell(g,0,0,p.c[0],p.shape,1,0,false); drawCell(g,CELL,0,p.c[1],p.shape,-1,0,true); g.restore(); }
    else { g.save(); g.beginPath(); g.rect(BX,BY-20,GW*CELL,GH*CELL+20); g.clip(); const [a,b]=cs, ni=E.needleIdx(p.rot); drawCell(g,BX+a.x*CELL,BY+a.y*CELL,a.c,p.shape,b.x-a.x,b.y-a.y,ni===0); drawCell(g,BX+b.x*CELL,BY+b.y*CELL,b.c,p.shape,a.x-b.x,a.y-b.y,ni===1); g.restore(); }
  }
  /* 지움 효과 */
  for(const f of S.fx){ if(f.kind!=='virus') continue; const u=1-f.t/E.CLEAR_T, px=BX+f.x*CELL+CELL/2, py=BY+f.y*CELL+CELL/2; g.strokeStyle=col(f.c).b; g.globalAlpha=1-u; g.lineWidth=2; g.beginPath(); g.arc(px,py,6+u*16,0,Math.PI*2); g.stroke(); g.globalAlpha=1; }
  /* 오른쪽: 다음 알약 · 바이러스 수 */
  panel(g,340,202,128,52);text(g,'다음',352,222,11);
  if(S.next){ const nx=414,ny=218; const show=S.status==='play'&&S.phase!=='throw'||S.status!=='play'; if(show){ drawCell(g,nx,ny,S.next.c[0],S.next.shape,1,0,false); drawCell(g,nx+CELL,ny,S.next.c[1],S.next.shape,-1,0,true); } }
  const counts={1:0,2:0,3:0}; for(const o of S.cells) if(o&&o.kind==='virus') counts[o.c]++;
  panel(g,340,266,128,80);text(g,'색별 바이러스',352,278);
  [1,2,3].forEach((c,i)=>{const x=364+i*40;drawVirus(g,x-10,296,c,(frame+i)%2);text(g,String(counts[c]),x,322,14,C.ink,700,'center');});
  /* 안내 메시지 */
  if(S.msg&&S.msgT>0){ /* 왼쪽 아래 128px 칸에 띄운다. 글은 116px 안에 줄을 나누고 위로 자란다(최대 7줄). */
    g.font=`600 10px ${FONT}`; const lines=wrapText(g,S.msg,116).slice(0,7); const lh=13, bh=lines.length*lh+12, by=Math.min(294,346-bh);
    g.fillStyle='rgba(58,48,66,.96)'; rr(g,12,by,128,bh,8); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='top'; lines.forEach((ln,k)=>g.fillText(ln,76,by+6+k*lh)); }
  g.textAlign='left';
}
window.Render={render,drawCell,drawVirus,drawDoctor,gimmick,wrapText,C};
})();
