/* 동현닥 엔진: 8×16 병 안에 두 칸짜리 알약(캡슐·태블릿·주사기)을 떨어뜨려 같은 색 넷을 가로·세로로 맞추면 사라지고, 바이러스를 모두 없애면 단계 클리어.
   화면과 무관한 순수 상태 기계다. 조작은 step(S,keys)의 keys{left,right,down}와 rotate(S,dir)로 들어온다. */
(function(root){
const GW=8, GH=16, CELL=20, BX=150, BY=26, W=480, H=360;
const SPEEDS=[
  {id:1,key:'low',name:'느림',frames:40,base:100,desc:'알약이 40프레임(0.67초)에 한 칸 내려온다. 처음이라면 이것으로.'},
  {id:2,key:'mid',name:'보통',frames:26,base:200,desc:'26프레임(0.43초)에 한 칸. 바이러스 하나에 200점부터.'},
  {id:3,key:'high',name:'빠름',frames:16,base:300,desc:'16프레임(0.27초)에 한 칸. 바이러스 하나에 300점부터.'}
];
const STAGES=20, COLORS=3, SHAPES=['capsule','tablet','syringe'], THROW=14, CLEAR_T=18, DROP_T=6, DAS=10, ARR=4, SOFT=2;
const STAGE_BONUS=500;

/* ---------- 난수 ---------- */
function rng(S){ S.rs=(Math.imul(S.rs,1664525)+1013904223)>>>0; return S.rs/4294967296; }
function ri(S,a,b){ return a+Math.floor(rng(S)*(b-a+1)); }

/* ---------- 칸 ---------- */
const idx=(x,y)=>y*GW+x;
function at(S,x,y){ return (x<0||x>=GW||y<0||y>=GH)?null:S.cells[idx(x,y)]; }
function free(S,x,y){ return x>=0&&x<GW&&y<GH&&(y<0||!S.cells[idx(x,y)]); } /* 병목 위(y<0)는 비어 있다고 본다 */
function runAt(S,x,y,c){ /* (x,y)에 색 c를 두면 생기는 가로·세로 최대 연속 길이 */
  let best=1;
  for(const [dx,dy] of [[1,0],[0,1]]){ let n=1;
    for(let k=1;k<4;k++){ const o=at(S,x+dx*k,y+dy*k); if(o&&o.c===c) n++; else break; }
    for(let k=1;k<4;k++){ const o=at(S,x-dx*k,y-dy*k); if(o&&o.c===c) n++; else break; }
    best=Math.max(best,n); }
  return best;
}
function virusRows(stage){ return 10+(stage>=15?1:0)+(stage>=17?1:0)+(stage>=19?1:0); }
function virusCount(stage){ return Math.min(84,4*stage); }

/* ---------- 판 만들기 ---------- */
function placeViruses(S){
  const n=virusCount(S.stage), rows=virusRows(S.stage), top=GH-rows; let placed=0, tries=0;
  while(placed<n&&tries<4000){ tries++;
    const x=ri(S,0,GW-1), y=ri(S,top,GH-1); if(S.cells[idx(x,y)]) continue;
    let c=placed%COLORS+1; let ok=false;
    for(let k=0;k<COLORS;k++){ const cc=(c-1+k)%COLORS+1; if(runAt(S,x,y,cc)<3){ c=cc; ok=true; break; } }
    if(!ok) continue;
    S.cells[idx(x,y)]={c,kind:'virus',shape:0,lx:0,ly:0,seed:ri(S,0,255)}; placed++; }
  S.viruses=placed;
}
function placePre(S){
  const n=S.pre*2; let placed=0, tries=0;
  while(placed<n&&tries<2000){ tries++;
    const x=ri(S,0,GW-1), y=ri(S,GH-6,GH-1); if(S.cells[idx(x,y)]) continue;
    const c=ri(S,1,COLORS); if(runAt(S,x,y,c)>=3) continue;
    S.cells[idx(x,y)]={c,kind:'pill',shape:ri(S,0,2),lx:0,ly:0}; placed++; }
  while(gravityStep(S)){}
  if(findMatches(S).size) { /* 드물게 떨어지며 넷이 맞으면 색을 다시 섞는다 */ for(const i of findMatches(S)){ const o=S.cells[i]; if(o.kind==='pill'){ o.c=o.c%COLORS+1; } } }
}
function newPiece(S){ return {c:[ri(S,1,COLORS),ri(S,1,COLORS)],shape:ri(S,0,2)}; }
function newGame({speed=1,stage=1,pre=0,seed=1}={}){
  const S={rs:(seed>>>0)||1,speedI:speed-1,stage,pre,score:0,time:0,status:'play',phase:'throw',pt:0,pieces:0,stagesDone:0,chain:0,comboV:0,
    cells:new Array(GW*GH).fill(0),viruses:0,piece:null,next:null,dropT:0,dasT:0,dasDir:0,marks:[],fx:[],events:[],msg:'',msgT:0,lastClear:null};
  placeViruses(S); if(pre>0) placePre(S);
  S.next=newPiece(S); throwNext(S);
  S.events.push({t:'stage',stage});
  return S;
}
function nextStage(S){
  if(S.status!=='clear') return;
  S.stage++; S.stagesDone++; S.cells=new Array(GW*GH).fill(0); S.pieces=0; S.chain=0; S.comboV=0; S.marks=[]; S.fx=[]; S.status='play';
  placeViruses(S); if(S.pre>0) placePre(S);
  S.next=newPiece(S); throwNext(S); S.events.push({t:'stage',stage:S.stage});
}

/* ---------- 알약 ---------- */
function cellsOf(p){ /* A=(x,y). 가로면 B가 오른쪽, 세로면 B가 위. rot 0·1은 c[0]이 A, rot 2·3은 뒤집힘 */
  const h=p.rot%2===0, swap=p.rot>=2, a=swap?p.c[1]:p.c[0], b=swap?p.c[0]:p.c[1];
  return h?[{x:p.x,y:p.y,c:a},{x:p.x+1,y:p.y,c:b}]:[{x:p.x,y:p.y,c:a},{x:p.x,y:p.y-1,c:b}];
}
function fits(S,p){ return cellsOf(p).every(q=>free(S,q.x,q.y)); }
function throwNext(S){
  const p={x:3,y:0,rot:0,c:S.next.c,shape:S.next.shape}; S.piece=p; S.next=newPiece(S); S.comboV=0; S.chain=0;
  if(!fits(S,p)){ S.status='over'; S.phase='fall'; S.events.push({t:'over'}); return; }
  S.phase='throw'; S.pt=0; S.events.push({t:'throw'});
}
function tryMove(S,dx,dy){ const p=S.piece, q={...p,x:p.x+dx,y:p.y+dy}; if(fits(S,q)){ p.x=q.x; p.y=q.y; return true; } return false; }
function rotate(S,dir){ /* dir +1 시계 방향, -1 반시계. 벽에 막히면 왼쪽으로 한 칸 밀어 본다(원작의 벽 차기) */
  if(S.status!=='play'||S.phase!=='fall'||!S.piece) return false;
  const p=S.piece, q={...p,rot:(p.rot+dir+4)%4};
  for(const kick of [[0,0],[-1,0],[0,1]]){ const r={...q,x:q.x+kick[0],y:q.y+kick[1]}; if(fits(S,r)){ p.rot=r.rot; p.x=r.x; p.y=r.y; S.events.push({t:'rotate'}); return true; } }
  return false;
}
function framesPerDrop(S){ return Math.max(6,SPEEDS[S.speedI].frames-Math.floor(S.pieces/10)); }
function lock(S){
  const p=S.piece, cs=cellsOf(p), h=p.rot%2===0;
  if(cs.some(q=>q.y<0)){ S.status='over'; S.piece=null; S.events.push({t:'over'}); return; }
  const [a,b]=cs;
  S.cells[idx(a.x,a.y)]={c:a.c,kind:'pill',shape:p.shape,lx:b.x-a.x,ly:b.y-a.y};
  S.cells[idx(b.x,b.y)]={c:b.c,kind:'pill',shape:p.shape,lx:a.x-b.x,ly:a.y-b.y};
  S.piece=null; S.pieces++; S.events.push({t:'lock'});
  afterSettle(S);
}
function afterSettle(S){
  const m=findMatches(S);
  if(m.size){ startClear(S,m); }
  else if(S.viruses<=0){ S.status='clear'; S.score+=STAGE_BONUS*(S.speedI+1); S.events.push({t:'clear',stage:S.stage,bonus:STAGE_BONUS*(S.speedI+1)}); if(S.stage>=STAGES){ S.status='win'; S.stagesDone++; S.events.push({t:'win'}); } }
  else throwNext(S);
}

/* ---------- 맞추기·지우기·떨어지기 ---------- */
function findMatches(S){
  const set=new Set();
  for(let y=0;y<GH;y++){ let x=0; while(x<GW){ const o=at(S,x,y); if(!o){x++;continue;} let e=x; while(e+1<GW&&at(S,e+1,y)&&at(S,e+1,y).c===o.c) e++; if(e-x+1>=4) for(let k=x;k<=e;k++) set.add(idx(k,y)); x=e+1; } }
  for(let x=0;x<GW;x++){ let y=0; while(y<GH){ const o=at(S,x,y); if(!o){y++;continue;} let e=y; while(e+1<GH&&at(S,x,e+1)&&at(S,x,e+1).c===o.c) e++; if(e-y+1>=4) for(let k=y;k<=e;k++) set.add(idx(x,k)); y=e+1; } }
  return set;
}
function startClear(S,set){
  S.marks=[...set]; S.phase='clearing'; S.pt=CLEAR_T; S.chain++;
  let v=0, pl=0, gained=0; const base=SPEEDS[S.speedI].base;
  for(const i of S.marks){ const o=S.cells[i]; if(o.kind==='virus'){ v++; gained+=base*Math.pow(2,Math.min(S.comboV,5)); S.comboV++; } else pl++; }
  S.score+=gained; S.lastClear={v,pl,gained,chain:S.chain};
  for(const i of S.marks){ const o=S.cells[i]; S.fx.push({x:i%GW,y:Math.floor(i/GW),c:o.c,kind:o.kind,t:CLEAR_T}); }
  S.events.push({t:'match',viruses:v,pills:pl,gained,chain:S.chain});
}
function removeMarks(S){
  for(const i of S.marks){ const o=S.cells[i]; if(!o) continue; if(o.kind==='virus') S.viruses--;
    if(o.lx||o.ly){ const px=i%GW+o.lx, py=Math.floor(i/GW)+o.ly, q=at(S,px,py); if(q&&q.kind==='pill'){ q.lx=0; q.ly=0; } }
    S.cells[i]=0; }
  S.marks=[];
}
function gravityStep(S){ /* 받침 없는 알약(바이러스는 안 움직인다)을 한 칸 내린다. 한 쌍은 함께 */
  let moved=false; const done=new Set();
  for(let y=GH-2;y>=0;y--) for(let x=0;x<GW;x++){
    const i=idx(x,y), o=S.cells[i]; if(!o||o.kind!=='pill'||done.has(i)) continue;
    const group=[[x,y]]; if(o.lx||o.ly){ const px=x+o.lx, py=y+o.ly, q=at(S,px,py); if(q&&q.kind==='pill') group.push([px,py]); }
    const can=group.every(([gx,gy])=>{ if(gy+1>=GH) return false; const b=at(S,gx,gy+1); return !b||group.some(([hx,hy])=>hx===gx&&hy===gy+1); });
    if(!can) continue;
    group.sort((a,b)=>b[1]-a[1]);
    for(const [gx,gy] of group){ S.cells[idx(gx,gy+1)]=S.cells[idx(gx,gy)]; S.cells[idx(gx,gy)]=0; done.add(idx(gx,gy+1)); }
    moved=true; }
  return moved;
}

/* ---------- 한 프레임 ---------- */
function step(S,keys){
  S.time++; if(S.msgT>0) S.msgT--;
  for(const f of S.fx) f.t--; S.fx=S.fx.filter(f=>f.t>0);
  if(S.status!=='play') return;
  if(S.phase==='throw'){ S.pt++; if(S.pt>=THROW){ S.phase='fall'; S.dropT=0; S.dasT=0; S.dasDir=0; } return; }
  if(S.phase==='fall'){
    const p=S.piece; if(!p) return;
    const dir=(keys.left?-1:0)+(keys.right?1:0);
    if(dir===0){ S.dasDir=0; S.dasT=0; }
    else if(dir!==S.dasDir){ S.dasDir=dir; S.dasT=0; if(tryMove(S,dir,0)) S.events.push({t:'move'}); }
    else { S.dasT++; if(S.dasT>=DAS&&(S.dasT-DAS)%ARR===0){ if(tryMove(S,dir,0)) S.events.push({t:'move'}); } }
    S.dropT++;
    const per=keys.down?Math.min(SOFT,framesPerDrop(S)):framesPerDrop(S);
    if(S.dropT>=per){ S.dropT=0; if(!tryMove(S,0,1)) lock(S); }
    return;
  }
  if(S.phase==='clearing'){ S.pt--; if(S.pt<=0){ removeMarks(S); S.phase='drop'; S.pt=0; } return; }
  if(S.phase==='drop'){ S.pt++; if(S.pt>=DROP_T){ S.pt=0; if(!gravityStep(S)){ S.phase='fall'; afterSettle(S); } } return; }
}
const speedOf=S=>SPEEDS[S.speedI];
root.Engine={GW,GH,CELL,BX,BY,W,H,SPEEDS,STAGES,COLORS,SHAPES,THROW,CLEAR_T,STAGE_BONUS,newGame,step,rotate,nextStage,cellsOf,findMatches,gravityStep,virusCount,virusRows,framesPerDrop,speedOf,at,idx};
})(typeof window!=='undefined'?window:(typeof module!=='undefined'?module.exports:this));
