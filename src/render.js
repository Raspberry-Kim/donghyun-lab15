/* 동현닥 화면: 왼쪽 정보 · 가운데 약병 · 오른쪽 닥터 포동이와 다음 알약, 바이러스 수. 알약은 캡슐·태블릿·주사기 세 모양으로 그린다(색은 같은 규칙). */
(function(){
const E=window.Engine, SP=window.Sprites;
const C={paper:'#fbf7ef',panel:'#f3ecdf',line:'#d9cdb8',ink:'#3a3042',sub:'#7a7086',glass:'#ebe5f3',glassLine:'#8d84a0',dot:'rgba(74,66,88,.10)',accent:'#f2b705',white:'#ffffff'};
const {GW,GH,CELL,BX,BY}=E;
const FONT='Pretendard, "Apple SD Gothic Neo", sans-serif';
function rr(g,x,y,w,h,r){ const R=Array.isArray(r)?r:[r,r,r,r]; g.beginPath(); g.moveTo(x+R[0],y); g.lineTo(x+w-R[1],y); g.quadraticCurveTo(x+w,y,x+w,y+R[1]); g.lineTo(x+w,y+h-R[2]); g.quadraticCurveTo(x+w,y+h,x+w-R[2],y+h); g.lineTo(x+R[3],y+h); g.quadraticCurveTo(x,y+h,x,y+h-R[3]); g.lineTo(x,y+R[0]); g.quadraticCurveTo(x,y,x+R[0],y); g.closePath(); }
const col=c=>SP.COL[c];


/* ---------- 닥터 포동이: 알약을 던지는 네 가지 동작 ----------
 * 포동이 PNG(941×1050)를 104px 폭으로 그린다. 던지기 14프레임 동안 조각(꼬리·앞발)을 따로 떼어 움직이거나 몸 전체를 기울여,
 * 0 꼬리치기 · 1 머리 들이받기 · 2 앞발 차기 · 3 돌아서서 뒷발 차기(좌우 뒤집어 그리고 새로 그린 뒷다리가 나온다)를 알약마다 돌아가며 한다.
 * hit: 알약이 손을 떠나는 시점(0~1). origin: 그때까지 알약이 붙어 있는 자리 */
const DX=344, DY=36, DW=104, DSC=DW/941, DH=Math.round(1050*DSC);
const TAIL_POLY=[[0,0],[330,0],[330,110],[300,250],[230,430],[0,440]]; /* 꼬리 조각(원본 좌표) */
const PAW_RECT=[250,820,230,230]; /* 왼쪽 앞발 조각(원본 좌표) x,y,w,h */
const GIMMICKS=[
  {name:'tail',hit:0.36,origin:a=>({x:DX+6-a*6,y:DY+26+a*10})},
  {name:'head',hit:0.4,origin:a=>({x:DX+2-a*16,y:DY+66+a*10})},
  {name:'paw',hit:0.4,origin:a=>({x:DX+8-a*16,y:DY+104-a*18})},
  {name:'kick',hit:0.42,origin:a=>({x:DX+10-a*24,y:DY+104-a*10})}];
function gimIndex(S){ return (S.pieces*3+S.stage*5+S.stagesDone)%GIMMICKS.length; }
function gimmick(S){ const G=GIMMICKS[gimIndex(S)]; const amp=pt=>{ const u=pt/E.THROW; return u<G.hit?Math.sin(u/G.hit*Math.PI/2):Math.max(0,1-(u-G.hit)/(1-G.hit)*1.6); }; return {...G,amp,origin:pt=>G.origin(amp(pt))}; }
function polyPath(g,pts,ox,oy,add){ if(!add) g.beginPath(); pts.forEach(([x,y],i)=>{ const X=ox+x*DSC, Y=oy+y*DSC; i?g.lineTo(X,Y):g.moveTo(X,Y); }); g.closePath(); }
function hindLeg(g,x,y,a){ /* 새로 그린 뒷다리: 몸 뒤에서 왼쪽으로 뻗는다. a 0~1 */
  const L=10+Math.round(a*16); g.fillStyle='#2b2f45'; g.fillRect(x-L-2,y-1,L+4,10); g.fillStyle='#f1e6cf'; g.fillRect(x-L,y+1,L+2,6); g.fillStyle='#e6d8bb'; g.fillRect(x-L,y+5,L+2,2);
  g.fillStyle='#2b2f45'; g.fillRect(x-L-7,y-2,8,12); g.fillStyle='#f1e6cf'; g.fillRect(x-L-6,y,6,8); g.fillStyle='#8a7f73'; g.fillRect(x-L-5,y+6,1,1); g.fillRect(x-L-3,y+7,1,1); g.fillRect(x-L-1,y+6,1,1); }
function drawDoctor(g,S,T){
  const D=SP.DOCTOR; if(!(D.complete&&D.naturalWidth)) return;
  const throwing=S.status==='play'&&S.phase==='throw', G=throwing?gimmick(S):null, a=G?G.amp(S.pt):0, bob=throwing?-2:Math.sin(T/30)*1.5, y0=DY+bob;
  if(!G||G.name==='head'){ g.save(); if(G){ g.translate(DX+DW/2,y0+DH); g.rotate(-a*0.32); g.translate(-DX-DW/2-a*8,-y0-DH+a*5); } g.drawImage(D,DX,y0,DW,DH); g.restore(); return; }
  if(G.name==='tail'){ /* 몸(꼬리 자리 비움) → 꼬리 조각을 밑동 기준으로 흔든다 */
    g.save(); g.beginPath(); g.rect(DX,y0,DW,DH); polyPath(g,TAIL_POLY,DX,y0,true); g.clip('evenodd'); g.drawImage(D,DX,y0,DW,DH); g.restore();
    const px=DX+290*DSC, py=y0+400*DSC; g.save(); g.translate(px,py); g.rotate(-0.85*a+0.12); g.translate(-px,-py); polyPath(g,TAIL_POLY,DX,y0); g.clip(); g.drawImage(D,DX,y0,DW,DH); g.restore(); return; }
  if(G.name==='paw'){ /* 몸(앞발 자리 비움) → 앞발 조각이 왼쪽 위로 차 올린다 */
    const [rx,ry,rw,rh]=PAW_RECT, ns=D.naturalWidth/941; g.save(); g.beginPath(); g.rect(DX,y0,DW,DH); g.rect(DX+rx*DSC,y0+ry*DSC,rw*DSC,rh*DSC); g.clip('evenodd'); g.drawImage(D,DX,y0,DW,DH); g.restore();
    const px=DX+(rx+rw)*DSC, py=y0+ry*DSC; g.save(); g.translate(px-a*16,py-a*18); g.rotate(-0.8*a); g.translate(-px,-py); g.drawImage(D,rx*ns,ry*ns,rw*ns,rh*ns,DX+rx*DSC,y0+ry*DSC,rw*DSC,rh*DSC); g.restore(); return; }
  /* kick: 좌우를 뒤집어 돌아선 모습으로 그리고, 왼쪽 아래 몸 뒤에서 뒷다리가 뻗어 나온다 */
  g.save(); g.translate(DX+DW/2,y0+DH); g.rotate(a*0.12); g.translate(-DX-DW/2,-y0-DH); hindLeg(g,DX+22,y0+DH-20,a); g.translate(DX+DW,0); g.scale(-1,1); g.drawImage(D,0,y0,DW,DH); g.restore(); }

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
  if(shape===1){ /* 태블릿: 가운데 절취선(두 칸의 경계)을 사이에 두고 양쪽이 볼록볼록한 하나의 둥근 알. 경계에서는 살짝 잘록하지만 이어져 있다 */
    if(!linked){ g.fillStyle=k.b; g.beginPath(); g.arc(cx,cy,7.5,0,Math.PI*2); g.fill(); g.stroke();
      g.strokeStyle='rgba(58,48,66,.45)'; g.beginPath(); g.moveTo(cx-4.5,cy); g.lineTo(cx+4.5,cy); g.stroke();
      g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx-2.5,cy-3.5,2.6,1.4,-0.5,0,Math.PI*2); g.fill(); return; }
    g.save(); g.translate(cx,cy); g.rotate(ang(lx,ly)); /* 짝이 오른쪽(+x)에 오도록 돌려 그린다 */
    g.beginPath(); g.moveTo(10,-6.2);
    g.bezierCurveTo(7.6,-6.2,6.6,-8.8,1.2,-8.8); g.bezierCurveTo(-5.4,-8.8,-9.4,-5.2,-9.4,0);
    g.bezierCurveTo(-9.4,5.2,-5.4,8.8,1.2,8.8); g.bezierCurveTo(6.6,8.8,7.6,6.2,10,6.2);
    g.fillStyle=k.b; g.fill(); g.stroke(); /* 열린 윤곽: 짝과 맞닿는 x=10 쪽은 선을 긋지 않는다 */
    g.strokeStyle='rgba(58,48,66,.62)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(10,-5); g.lineTo(10,5); g.stroke(); /* 절취선(짝의 반쪽과 합쳐 하나) */
    g.restore();
    g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx-2+lx*1.5,cy-4.2+ly*1.5,3,1.5,-0.35,0,Math.PI*2); g.fill();
    return; }
  /* 주사기: 바늘 칸은 통(눈금 창, 끝에 바늘), 다른 칸은 통의 뒤쪽과 밀대(손가락 날개·누르개). 바늘은 짝의 반대쪽을 가리킨다. 홑알은 작은 앰풀 */
  if(!linked){ g.fillStyle=k.b; rr(g,px+4,py+6,12,13,[3,3,4,4]); g.fill(); g.stroke(); g.fillStyle=k.d; g.fillRect(px+7.5,py+2,5,4); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(px+6.5,py+8.5,2.5,8); return; }
  const barrel=nd===undefined?(lx<0||ly<0):!!nd;
  g.save(); g.translate(cx,cy);
  if(barrel){ g.rotate(ang(lx,ly)+Math.PI); /* 짝이 왼쪽(−x), 바늘이 오른쪽(+x) */
    g.fillStyle=k.b; rr(g,-10,-7.5,14.5,15,[0,3.5,3.5,0]); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.72)'; g.fillRect(-8,-3.5,10,7); g.fillStyle=k.d; g.fillRect(-8,-3.5,4,7);
    g.strokeStyle='rgba(58,48,66,.5)'; g.beginPath(); for(let i=-3;i<=1;i+=2){ g.moveTo(i,-3.5); g.lineTo(i,-1); } g.stroke();
    g.fillStyle=k.d; g.strokeStyle='rgba(58,48,66,.75)'; rr(g,4.5,-2.8,2.5,5.6,1); g.fill(); g.stroke();
    g.strokeStyle=C.ink; g.lineWidth=1.4; g.beginPath(); g.moveTo(7,0); g.lineTo(10.5,0); g.stroke();
  } else { g.rotate(ang(lx,ly)); /* 짝이 오른쪽(+x), 밀대가 왼쪽(−x) */
    g.fillStyle=k.d; rr(g,-10,-5.5,2.5,11,1); g.fill(); g.stroke();      /* 누르개 */
    g.fillStyle=k.d; g.fillRect(-7.5,-2,3,4);                            /* 밀대 막대 */
    g.fillStyle=k.b; rr(g,-5.5,-9,3,18,1.5); g.fill(); g.stroke();       /* 손가락 날개 */
    g.fillStyle=k.b; rr(g,-2.5,-7.5,12.5,15,0); g.fill(); g.stroke();    /* 통의 뒤쪽 */
    g.fillStyle='rgba(58,48,66,.35)'; g.fillRect(4.5,-7,2,14);           /* 고무 마개 */
    g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(-1,-5.5,5,2);
  }
  g.restore();
}
function drawVirus(g,px,py,c,frame){ const im=SP.face(c,frame,2); g.drawImage(im,px+1,py+1); }

/* ---------- 약병 ---------- */
function bottle(g){
  const x=BX,y=BY,w=GW*CELL,h=GH*CELL;
  g.fillStyle=C.glass; g.fillRect(x,y,w,h);
  g.fillStyle=C.dot; for(let i=1;i<GW;i++) for(let j=1;j<GH;j++) g.fillRect(x+i*CELL-1,y+j*CELL-1,2,2);
  g.strokeStyle=C.glassLine; g.lineWidth=3; g.lineJoin='round';
  g.beginPath(); g.moveTo(x+3*CELL,y-2); g.lineTo(x+3*CELL,y-16); g.moveTo(x+5*CELL,y-2); g.lineTo(x+5*CELL,y-16);
  g.moveTo(x+3*CELL,y-2); g.lineTo(x,y-2); g.lineTo(x,y+h+2); g.lineTo(x+w,y+h+2); g.lineTo(x+w,y-2); g.lineTo(x+5*CELL,y-2); g.stroke();
  g.lineWidth=2; g.beginPath(); g.moveTo(x+3*CELL-4,y-18); g.lineTo(x+5*CELL+4,y-18); g.stroke();
}

/* ---------- 패널 ---------- */
function wrapText(g,t,maxW){ /* 넘치면 ' · ' 뒤에서 먼저 끊고, 없으면 마지막 띄어쓰기에서 끊는다. 한 글자 낱말('한 칸'의 '한') 바로 뒤에서는 끊지 않는다. 띄어쓰기가 없으면 그 자리에서 */
  const cut=(line)=>{ const d=line.lastIndexOf(' · '); if(d>0) return [line.slice(0,d+2),line.slice(d+3)];
    for(let k=line.lastIndexOf(' ');k>0;k=line.lastIndexOf(' ',k-1)){ const prev=line.lastIndexOf(' ',k-1); if(k-prev-1>1) return [line.slice(0,k),line.slice(k+1)]; }
    return null; };
  const out=[]; let cur='';
  for(const ch of t){ const n=cur+ch; if(g.measureText(n).width<=maxW||!cur){ cur=n; continue; }
    const c=cut(n); if(c&&g.measureText(c[0]).width<=maxW){ out.push(c[0].trim()); cur=c[1]; } else { out.push(cur.trim()); cur=ch===' '?'':ch; } }
  if(cur.trim()) out.push(cur.trim()); return out; }
function card(g,x,y,w,h,label,value,small){
  g.fillStyle=C.panel; rr(g,x,y,w,h,8); g.fill(); g.strokeStyle=C.line; g.lineWidth=1; g.stroke();
  g.fillStyle=C.sub; g.font=`600 10px ${FONT}`; g.textAlign='left'; g.textBaseline='top'; g.fillText(label,x+10,y+8);
  g.fillStyle=C.ink; g.font=`700 ${small?14:18}px ${FONT}`; g.fillText(value,x+10,y+22);
}
function render(g,S,T){
  const W=E.W,H=E.H;
  g.clearRect(0,0,W,H); g.fillStyle=C.paper; g.fillRect(0,0,W,H);
  const sp=E.speedOf(S);
  card(g,12,26,124,46,'단계',`${S.stage} / ${E.STAGES}`);
  card(g,12,80,124,46,'남은 바이러스',String(S.viruses));
  card(g,12,134,124,46,'속도',`${sp.name} · ${E.framesPerDrop(S)}f`,true);
  card(g,12,188,124,46,'점수',S.score.toLocaleString('ko-KR'),S.score>=100000);
  if(S.lastClear){ card(g,12,242,124,46,'마지막 지움',`${S.lastClear.v}바이러스 +${S.lastClear.gained.toLocaleString('ko-KR')}`,true); }
  g.fillStyle=C.sub; g.font=`500 10px ${FONT}`; g.textAlign='center'; g.textBaseline='top';
  if(!(S.msg&&S.msgT>0)){ g.fillText('←→ 옮기기 · ↓ 빨리 내리기',74,300); g.fillText('X·↑ 시계 · Z 반시계로 돌리기',74,314); g.fillText('Enter 메뉴',74,328); } /* 안내 글이 뜨면 그 자리를 비켜 준다 */
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
      let x=o.x, y=o.y; if(u>G.hit){ const v=(u-G.hit)/(1-G.hit), e=1-(1-v)*(1-v); x=o.x+(x1-o.x)*e; y=o.y+(y1-o.y)*e-Math.sin(v*Math.PI)*36; }
      drawCell(g,x,y,p.c[0],p.shape,1,0,false); drawCell(g,x+CELL,y,p.c[1],p.shape,-1,0,true); }
    else { g.save(); g.beginPath(); g.rect(BX,BY-20,GW*CELL,GH*CELL+20); g.clip(); const [a,b]=cs, ni=E.needleIdx(p.rot); drawCell(g,BX+a.x*CELL,BY+a.y*CELL,a.c,p.shape,b.x-a.x,b.y-a.y,ni===0); drawCell(g,BX+b.x*CELL,BY+b.y*CELL,b.c,p.shape,a.x-b.x,a.y-b.y,ni===1); g.restore(); }
  }
  /* 지움 효과 */
  for(const f of S.fx){ if(f.kind!=='virus') continue; const u=1-f.t/E.CLEAR_T, px=BX+f.x*CELL+CELL/2, py=BY+f.y*CELL+CELL/2; g.strokeStyle=col(f.c).b; g.globalAlpha=1-u; g.lineWidth=2; g.beginPath(); g.arc(px,py,6+u*16,0,Math.PI*2); g.stroke(); g.globalAlpha=1; }
  /* 오른쪽: 다음 알약 · 바이러스 수 */
  g.fillStyle=C.sub; g.font=`600 10px ${FONT}`; g.textAlign='left'; g.fillText('다음',364,178); /* 라벨과 알약 사이를 띄운다(주사기는 칸 밖으로 삐져나온다) */
  if(S.next){ const nx=414,ny=168; const show=S.status==='play'&&S.phase!=='throw'||S.status!=='play'; if(show){ drawCell(g,nx,ny-8+14,S.next.c[0],S.next.shape,1,0,false); drawCell(g,nx+CELL,ny-8+14,S.next.c[1],S.next.shape,-1,0,true);
    if(S.next.shape===1){ g.fillStyle=C.sub; g.font=`700 11px ${FONT}`; g.textAlign='center'; g.fillText('↺ 거꾸로',nx+CELL,ny+30); g.textAlign='left'; } } }
  const counts={1:0,2:0,3:0}; for(const o of S.cells) if(o&&o.kind==='virus') counts[o.c]++;
  g.fillStyle=C.panel; rr(g,330,218,138,124,10); g.fill(); g.strokeStyle=C.line; g.stroke();
  g.fillStyle=C.sub; g.font=`600 10px ${FONT}`; g.fillText('바이러스',342,226);
  const names={1:'빨강',2:'파랑',3:'노랑'};
  [1,2,3].forEach((c,i)=>{ const y=244+i*30; drawVirus(g,342,y,c,(frame+i)%2); g.fillStyle=C.ink; g.font=`700 14px ${FONT}`; g.textAlign='left'; g.fillText(String(counts[c]),372,y+3); g.fillStyle=C.sub; g.font=`500 10px ${FONT}`; g.fillText(names[c],400,y+5); });
  /* 안내 메시지 */
  if(S.msg&&S.msgT>0){ /* 왼쪽 아래 조작 안내 자리에 띄운다(약병을 가리지 않는다). 폭 124px에 줄을 나누고, 넘치면 위로 자란다(최대 7줄) */
    g.font=`600 10px ${FONT}`; const lines=wrapText(g,S.msg,116).slice(0,7); const lh=13, bh=lines.length*lh+12, by=Math.min(294,346-bh);
    g.fillStyle='rgba(58,48,66,.92)'; rr(g,12,by,124,bh,8); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='top'; lines.forEach((ln,k)=>g.fillText(ln,74,by+6+k*lh)); }
  g.textAlign='left';
}
window.Render={render,drawCell,drawVirus,wrapText,C};
})();
