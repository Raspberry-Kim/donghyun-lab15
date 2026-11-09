/* 동현닥 화면: 왼쪽 정보 · 가운데 병 · 오른쪽 닥터 포동이와 다음 알약, 바이러스 수. 알약은 캡슐·태블릿·주사기 세 모양으로 그린다(색은 같은 규칙). */
(function(){
const E=window.Engine, SP=window.Sprites;
const C={paper:'#fbf7ef',panel:'#f3ecdf',line:'#d9cdb8',ink:'#3a3042',sub:'#7a7086',glass:'#ebe5f3',glassLine:'#8d84a0',dot:'rgba(74,66,88,.10)',accent:'#f2b705',white:'#ffffff'};
const {GW,GH,CELL,BX,BY}=E;
const FONT='Pretendard, "Apple SD Gothic Neo", sans-serif';
function rr(g,x,y,w,h,r){ const R=Array.isArray(r)?r:[r,r,r,r]; g.beginPath(); g.moveTo(x+R[0],y); g.lineTo(x+w-R[1],y); g.quadraticCurveTo(x+w,y,x+w,y+R[1]); g.lineTo(x+w,y+h-R[2]); g.quadraticCurveTo(x+w,y+h,x+w-R[2],y+h); g.lineTo(x+R[3],y+h); g.quadraticCurveTo(x,y+h,x,y+h-R[3]); g.lineTo(x,y+R[0]); g.quadraticCurveTo(x,y,x+R[0],y); g.closePath(); }
const col=c=>SP.COL[c];

/* ---------- 알약 한 칸 ---------- */
/* lx,ly: 짝의 상대 위치(0,0이면 홑알). shape 0 캡슐 · 1 태블릿 · 2 주사기 */
function drawCell(g,px,py,c,shape,lx,ly){
  const k=col(c), s=CELL, m=2, linked=lx||ly;
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
  /* 주사기: 짝이 왼쪽·위에 있는 칸이 통(눈금 창, 끝에 바늘), 짝이 오른쪽·아래에 있는 칸이 밀대. 홑알은 작은 앰풀 */
  if(!linked){ g.fillStyle=k.b; rr(g,px+5,py+7,10,11,[2,2,3,3]); g.fill(); g.stroke(); g.fillStyle=k.d; g.fillRect(px+8,py+3,4,4); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(px+7,py+9,2,6); return; }
  const barrel=lx<0||ly<0, horiz=!!lx;
  g.save(); g.translate(px+s/2,py+s/2); if(!horiz) g.rotate(Math.PI/2); /* 가로 기준으로 그린 뒤 세로면 90° 돌린다: 통은 아래쪽(바늘이 아래) */
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

/* ---------- 병 ---------- */
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
  g.fillText('←→ 옮기기 · ↓ 빨리 내리기',74,300); g.fillText('X 시계 · Z 반시계로 돌리기',74,314); g.fillText('Enter 메뉴',74,328);
  bottle(g);
  /* 칸 */
  const frame=Math.floor(T/24)%2, marks=new Set(S.marks);
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ const o=S.cells[E.idx(x,y)]; if(!o) continue; const px=BX+x*CELL, py=BY+y*CELL;
    if(o.kind==='virus') drawVirus(g,px,py,o.c,(frame+(o.seed||0))%2); else drawCell(g,px,py,o.c,o.shape,o.lx,o.ly);
    if(marks.has(E.idx(x,y))){ const a=0.35+0.45*Math.abs(Math.sin(T*0.6)); g.fillStyle=`rgba(255,255,255,${a})`; g.fillRect(px+1,py+1,CELL-2,CELL-2); } }
  /* 떨어지는 알약 */
  if(S.piece&&S.status==='play'){
    const p=S.piece, cs=E.cellsOf(p);
    if(S.phase==='throw'){ const u=S.pt/E.THROW, e=1-(1-u)*(1-u); const x0=372,y0=160, x1=BX+3*CELL, y1=BY; const x=x0+(x1-x0)*e, y=y0+(y1-y0)*e-Math.sin(u*Math.PI)*40;
      drawCell(g,x,y,p.c[0],p.shape,1,0); drawCell(g,x+CELL,y,p.c[1],p.shape,-1,0); }
    else { g.save(); g.beginPath(); g.rect(BX,BY-20,GW*CELL,GH*CELL+20); g.clip(); const [a,b]=cs; drawCell(g,BX+a.x*CELL,BY+a.y*CELL,a.c,p.shape,b.x-a.x,b.y-a.y); drawCell(g,BX+b.x*CELL,BY+b.y*CELL,b.c,p.shape,a.x-b.x,a.y-b.y); g.restore(); }
  }
  /* 지움 효과 */
  for(const f of S.fx){ if(f.kind!=='virus') continue; const u=1-f.t/E.CLEAR_T, px=BX+f.x*CELL+CELL/2, py=BY+f.y*CELL+CELL/2; g.strokeStyle=col(f.c).b; g.globalAlpha=1-u; g.lineWidth=2; g.beginPath(); g.arc(px,py,6+u*16,0,Math.PI*2); g.stroke(); g.globalAlpha=1; }
  /* 오른쪽: 닥터 포동이 · 다음 알약 · 바이러스 수 */
  const D=SP.DOCTOR; if(D.complete&&D.naturalWidth){ const dw=104, dh=D.naturalHeight*dw/D.naturalWidth; const bob=S.status==='play'&&S.phase==='throw'?-4:Math.sin(T/30)*1.5; g.drawImage(D,344,36+bob,dw,dh); }
  g.fillStyle=C.sub; g.font=`600 10px ${FONT}`; g.textAlign='left'; g.fillText('다음',386,178);
  if(S.next){ const nx=402,ny=168; const show=S.status==='play'&&S.phase!=='throw'||S.status!=='play'; if(show){ drawCell(g,nx,ny-8+14,S.next.c[0],S.next.shape,1,0); drawCell(g,nx+CELL,ny-8+14,S.next.c[1],S.next.shape,-1,0); } }
  const counts={1:0,2:0,3:0}; for(const o of S.cells) if(o&&o.kind==='virus') counts[o.c]++;
  g.fillStyle=C.panel; rr(g,330,218,138,124,10); g.fill(); g.strokeStyle=C.line; g.stroke();
  g.fillStyle=C.sub; g.font=`600 10px ${FONT}`; g.fillText('바이러스',342,226);
  const names={1:'빨강',2:'파랑',3:'노랑'};
  [1,2,3].forEach((c,i)=>{ const y=244+i*30; drawVirus(g,342,y,c,(frame+i)%2); g.fillStyle=C.ink; g.font=`700 14px ${FONT}`; g.textAlign='left'; g.fillText(String(counts[c]),372,y+3); g.fillStyle=C.sub; g.font=`500 10px ${FONT}`; g.fillText(names[c],400,y+5); });
  /* 안내 메시지 */
  if(S.msg&&S.msgT>0){ g.fillStyle='rgba(58,48,66,.9)'; g.font=`600 11px ${FONT}`; const tw=Math.min(300,g.measureText(S.msg).width+20); rr(g,W/2-tw/2,H-24,tw,20,6); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(S.msg.length>48?S.msg.slice(0,47)+'…':S.msg,W/2,H-14); g.textBaseline='top'; }
  g.textAlign='left';
}
window.Render={render,drawCell,drawVirus,C};
})();
