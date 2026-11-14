// 엔진 핵심 시험: node qa/core-tests.cjs
const E=require('../src/engine.js').Engine; const assert=require('assert'); let n=0; const ok=t=>{ n++; console.log('ok',t); };
const {GW,GH}=E;
const K=(o={})=>({left:false,right:false,down:false,...o});
const run=(S,k,f)=>{ for(let i=0;i<f&&S.status==='play';i++) E.step(S,k); };
const pill=(c,shape=0,lx=0,ly=0)=>({c,kind:'pill',shape,lx,ly});
const virus=c=>({c,kind:'virus',shape:0,lx:0,ly:0,seed:0});
const put=(S,x,y,o)=>{ S.cells[E.idx(x,y)]=o; };
const clearBoard=S=>{ S.cells.fill(0); S.viruses=0; };
const countV=S=>S.cells.filter(o=>o&&o.kind==='virus').length;
const settle=S=>{ /* 던지기 끝까지 */ run(S,K(),E.THROW); };
const dropLock=S=>{ for(let i=0;i<600&&S.phase==='fall'&&S.status==='play';i++) E.step(S,K({down:true})); };
const forcePiece=(S,c,shape=0)=>{ S.piece={x:3,y:0,rot:0,c,shape}; S.phase='fall'; S.dropT=0; S.dasT=0; S.dasDir=0; };
const until=(S,pred,max=5000)=>{ for(let i=0;i<max&&!pred(S);i++) E.step(S,K()); assert.ok(pred(S),'조건에 이르지 못했다'); };

// 1) 새 판: 바이러스 수·자리·연속 금지
for(const st of [1,5,14,15,17,19,20]){ const S=E.newGame({speed:1,stage:st,seed:7});
  assert.strictEqual(S.viruses,Math.min(84,4*st)); assert.strictEqual(countV(S),S.viruses);
  const top=GH-E.virusRows(st); for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ const o=S.cells[E.idx(x,y)]; if(o) assert.ok(y>=top,`단계 ${st}: 바이러스가 ${y}줄에 있다(허용 ${top}부터)`); }
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ const o=S.cells[E.idx(x,y)]; if(!o) continue; let r=1; for(let k=1;k<3;k++){ const q=E.at(S,x+k,y); if(q&&q.c===o.c) r++; else break; } assert.ok(r<3,'가로 셋 연속'); r=1; for(let k=1;k<3;k++){ const q=E.at(S,x,y+k); if(q&&q.c===o.c) r++; else break; } assert.ok(r<3,'세로 셋 연속'); } }
assert.strictEqual(E.virusRows(14),10); assert.strictEqual(E.virusRows(15),11); assert.strictEqual(E.virusRows(17),12); assert.strictEqual(E.virusRows(20),13);
ok('새 판: 바이러스 단계×4 · 바닥 10~13줄 · 같은 색 셋 연속 없음');
// 2) 깔린 알약: 값×2 홑알 · 받침 있음 · 바로 지워질 넷 없음
for(const seed of [1,2,3,4,5]){ const S=E.newGame({speed:1,stage:5,pre:3,seed}); const pills=S.cells.filter(o=>o&&o.kind==='pill'); assert.strictEqual(pills.length,6); assert.ok(pills.every(o=>!o.lx&&!o.ly)); assert.strictEqual(E.findMatches(S).size,0);
  for(let y=0;y<GH-1;y++) for(let x=0;x<GW;x++){ const o=S.cells[E.idx(x,y)]; if(o&&o.kind==='pill') assert.ok(S.cells[E.idx(x,y+1)],'깔린 알약이 떠 있다'); } }
ok('깔린 알약: 3 → 홑알 6 · 모두 받침 위 · 시작하자마자 지워지지 않는다');
// 3) 던지기 14프레임 뒤 조작 · 약병 입구 (3,0) 가로
let S=E.newGame({speed:1,stage:1,seed:7}); assert.strictEqual(S.phase,'throw'); assert.deepStrictEqual([S.piece.x,S.piece.y,S.piece.rot],[3,0,0]);
run(S,K({left:true}),E.THROW-1); assert.strictEqual(S.piece.x,3); E.step(S,K({left:true})); assert.strictEqual(S.phase,'fall'); assert.strictEqual(S.piece.x,3);
E.step(S,K({left:true})); assert.strictEqual(S.piece.x,2); ok('던지기: 14프레임 동안 조작 없음 · 그 뒤 ←로 한 칸');
// 4) 밀어 이동(DAS 10 · ARR 4) · 벽
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); run(S,K({left:true}),1); assert.strictEqual(S.piece.x,2); run(S,K({left:true}),9); assert.strictEqual(S.piece.x,2); run(S,K({left:true}),1); assert.strictEqual(S.piece.x,1); run(S,K({left:true}),4); assert.strictEqual(S.piece.x,0); run(S,K({left:true}),20); assert.strictEqual(S.piece.x,0);
run(S,K({right:true}),1); assert.strictEqual(S.piece.x,1); run(S,K({right:true}),60); assert.strictEqual(S.piece.x,GW-2); ok('옮기기: 첫 칸 즉시 · 10프레임 뒤 4프레임마다 · 벽에서 멈춘다(가로는 x≤6)');
// 5) 회전: 시계·반시계 · 세로는 위로 · 오른쪽 벽에서 왼쪽으로 차기
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); forcePiece(S,[1,2]); S.piece.y=5;
assert.ok(E.rotate(S,1)); assert.strictEqual(S.piece.rot,1); let cs=E.cellsOf(S.piece); assert.deepStrictEqual(cs.map(q=>[q.x,q.y,q.c]),[[3,5,1],[3,4,2]]);
assert.ok(E.rotate(S,1)); assert.strictEqual(S.piece.rot,2); cs=E.cellsOf(S.piece); assert.deepStrictEqual(cs.map(q=>[q.x,q.y,q.c]),[[3,5,2],[4,5,1]]);
assert.ok(E.rotate(S,-1)); assert.strictEqual(S.piece.rot,1); assert.ok(E.rotate(S,-1)); assert.strictEqual(S.piece.rot,0);
E.rotate(S,1); S.piece.x=GW-1; assert.ok(E.rotate(S,1)); assert.strictEqual(S.piece.rot,2); assert.strictEqual(S.piece.x,GW-2); ok('회전: 시계 0→1→2 · 반시계 되돌림 · 세로는 위 칸 · 오른쪽 벽에서 한 칸 밀려 돈다');
// 6) 떨어지는 속도: 느림 40 · 보통 26 · 빠름 16 · ↓는 2
for(const [sp,fr] of [[1,40],[2,26],[3,16]]){ S=E.newGame({speed:sp,stage:1,seed:7}); settle(S); assert.strictEqual(E.framesPerDrop(S),fr); run(S,K(),fr-1); assert.strictEqual(S.piece.y,0); run(S,K(),1); assert.strictEqual(S.piece.y,1); }
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); run(S,K({down:true}),2); assert.strictEqual(S.piece.y,1); run(S,K({down:true}),2); assert.strictEqual(S.piece.y,2);
S=E.newGame({speed:1,stage:1,seed:7}); S.pieces=25; assert.strictEqual(E.framesPerDrop(S),38); S.pieces=1000; assert.strictEqual(E.framesPerDrop(S),6); ok('속도: 40·26·16프레임 · ↓ 2프레임 · 알약 10개마다 1프레임 · 최소 6');
// 7) 굳기 → 넷 맞으면 지움 · 바이러스 수와 점수
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); clearBoard(S); put(S,0,GH-1,virus(1)); put(S,1,GH-1,virus(1)); S.viruses=2; put(S,2,GH-1,pill(1)); forcePiece(S,[1,2]); S.piece.x=3; S.piece.rot=1; /* 세로: A=(3,y) 색1 아래, B 위 색2 */
until(S,s=>s.phase==='clearing'); assert.strictEqual(S.marks.length,4); assert.strictEqual(S.score,100+200); assert.strictEqual(S.lastClear.v,2);
until(S,s=>s.phase!=='clearing'); assert.strictEqual(S.viruses,0); assert.ok(!S.cells[E.idx(0,GH-1)]&&!S.cells[E.idx(3,GH-1)]);
const rest=S.cells[E.idx(3,GH-2)]; /* 남은 반쪽은 홑알이 되어 떨어진다 */
until(S,s=>s.status==='clear'); assert.strictEqual(S.status,'clear'); assert.strictEqual(S.score,300+E.STAGE_BONUS); const low=S.cells[E.idx(3,GH-1)]; assert.ok(low&&low.c===2&&!low.lx&&!low.ly);
ok('지움: 바이러스 둘+알약 둘 넷 → 100+200점 · 남은 반쪽은 홑알로 떨어진다 · 바이러스 0이면 단계 클리어+보너스');
// 8) 짝은 함께 떨어진다 · 바이러스는 안 떨어진다 · 연쇄
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); clearBoard(S);
put(S,0,GH-1,pill(2)); put(S,1,GH-1,pill(2)); put(S,2,GH-1,pill(2)); /* 바닥 파랑 셋 */
put(S,3,GH-2,pill(3,0,1,0)); put(S,4,GH-2,pill(3,0,-1,0)); /* 노랑 한 쌍이 (3,14),(4,14)에 떠 있도록 받침 */
put(S,3,GH-1,pill(1)); put(S,4,GH-1,virus(1)); S.viruses=1; put(S,5,GH-1,pill(1)); put(S,6,GH-1,pill(2)); put(S,7,GH-1,virus(3)); S.viruses=2;
/* 떨어지는 알약: 가로 빨강·파랑? 대신 세로로 빨강을 (6,15) 위에 둔다… 간단히: 세로 피스 [1,1]을 x=2에 떨어뜨려 (2,14),(2,13) → 빨강은 (3,15),(5,15)와 안 이어짐 */
forcePiece(S,[2,2]); S.piece.x=2; S.piece.rot=1; /* (2,y),(2,y-1) 파랑 둘 → (2,14),(2,13) 위에 멈춤: 바닥 파랑 셋과 가로로는 안 맞고 세로는 둘뿐 */
until(S,s=>s.phase==='throw'||s.phase==='clearing'); assert.strictEqual(S.phase,'throw'); assert.ok(S.cells[E.idx(2,GH-2)]&&S.cells[E.idx(2,GH-3)]);
/* 이제 가로 피스 [2,x]를 x=3 세로로 떨어뜨려 (3,13)에 파랑 → 가로 (2,13),(3,13)? 아니다. 대신 바닥 파랑 넷: (3,15)가 빨강이라 안 된다. 연쇄 시나리오를 직접 만든다 */
clearBoard(S); put(S,0,GH-1,pill(2)); put(S,1,GH-1,pill(2)); put(S,2,GH-1,pill(2)); put(S,3,GH-1,virus(2)); S.viruses=1; /* 바닥 파랑 넷이지만 아직 지워지지 않은 상태로 둘 수 없으니, 셋+빈칸으로 */
S.cells[E.idx(3,GH-1)]=0; S.viruses=0; put(S,7,GH-1,virus(1)); S.viruses=1;
put(S,3,GH-2,pill(1,0,0,-1)); put(S,3,GH-3,pill(1,0,0,1)); /* 빨강 세로 한 쌍이 (3,14),(3,13)에 떠 있다 — 받침은 아래에 둘 파랑 */
put(S,3,GH-1,pill(2)); /* (3,15) 파랑 → 바닥 파랑 넷이 되지만 시험은 굳을 때만 검사하므로 지금은 그대로 */
put(S,4,GH-1,pill(1)); put(S,5,GH-1,pill(1)); put(S,6,GH-1,pill(1)); /* 빨강 셋 (4..6,15) + (7,15) 빨강 바이러스 = 넷! 이것도 굳을 때 같이 지워진다 */
S.cells[E.idx(7,GH-1)]=0; S.viruses=0; put(S,7,GH-1,virus(2)); S.viruses=1; /* 대신 (7,15)를 파랑 바이러스로: 바닥은 파 파 파 파 빨 빨 빨 파 */
/* 떨어뜨릴 피스: 세로 [1,1] x=7 → (7,14),(7,13) 빨강 둘… 빨강 가로 (4,5,6,15)+(7,?) 안 됨. 그냥 바닥 파랑 넷을 지우는 트리거로 쓴다: 피스가 굳으면 findMatches가 바닥 파랑 넷(0..3,15)을 찾는다 → 지움 → (3,14),(3,13) 빨강 쌍이 (3,15),(3,14)로 떨어짐 → (3,15) 빨강 + (4,5,6,15) 빨강 = 넷 → 연쇄 */
forcePiece(S,[3,3]); S.piece.x=0; S.piece.rot=1; /* 노랑 세로 (0,14),(0,13) */
until(S,s=>s.phase==='clearing'); assert.strictEqual(S.chain,1); assert.strictEqual(S.marks.length,4); assert.ok(S.marks.every(i=>Math.floor(i/GW)===GH-1&&i%GW<=3));
until(S,s=>s.phase==='drop'); until(S,s=>s.phase==='clearing',200); assert.strictEqual(S.chain,2); assert.strictEqual(S.marks.length,4);
const bl=S.cells[E.idx(3,GH-1)]; assert.ok(bl&&bl.c===1&&bl.ly===-1,'빨강 쌍이 함께 떨어져 (3,15)에 왔다'); assert.strictEqual(S.cells[E.idx(7,GH-1)].kind,'virus','바이러스는 안 떨어진다');
until(S,s=>s.phase==='throw'||s.status!=='play',400); assert.strictEqual(S.viruses,1); const top3=S.cells[E.idx(3,GH-1)]; assert.ok(top3&&top3.c===1&&!top3.lx&&!top3.ly,'남은 빨강 반쪽이 홑알로 바닥에');
ok('떨어지기·연쇄: 바닥 넷 지움 → 떠 있던 쌍이 함께 떨어져 새 넷 → 연쇄 2 · 바이러스는 제자리');
// 9) 한 알약의 바이러스 점수는 2배씩(최대 32배) · 다음 알약에서 초기화
S=E.newGame({speed:2,stage:1,seed:7}); settle(S); clearBoard(S);
for(let x=0;x<3;x++) put(S,x,GH-1,virus(1)); for(let x=0;x<3;x++) put(S,x,GH-2,virus(2)); S.viruses=6;
put(S,3,GH-1,pill(1)); S.cells[E.idx(3,GH-1)]=0; /* 비워 둠 */
forcePiece(S,[2,1]); S.piece.x=3; S.piece.rot=1; /* 세로 A=(3,y) 파랑… A 아래가 c[0]=2: 아래 칸 (3,15)=파랑, (3,14)=빨강 → 안 맞는다. 뒤집는다 */
S.piece.c=[1,2]; /* (3,15)=빨강 → 바닥 빨강 넷 · (3,14)=파랑 → 14줄 파랑 넷: 바이러스 6 한꺼번에 */
until(S,s=>s.phase==='clearing'); assert.strictEqual(S.lastClear.v,6); assert.strictEqual(S.score,200*(1+2+4+8+16+32));
until(S,s=>s.status==='clear'); assert.strictEqual(S.viruses,0); ok('점수: 보통 200점부터 2배씩, 바이러스 여섯 = 200×63 · 단계 클리어');
// 10) 다음 단계 · 단계 20 클리어 = 끝
S=E.newGame({speed:1,stage:1,seed:7}); S.status='clear'; E.nextStage(S); assert.strictEqual(S.stage,2); assert.strictEqual(S.viruses,8); assert.strictEqual(S.stagesDone,1); assert.strictEqual(S.status,'play'); assert.strictEqual(S.phase,'throw');
S=E.newGame({speed:1,stage:20,seed:7}); settle(S); clearBoard(S); put(S,0,GH-1,virus(1)); S.viruses=1; for(let x=1;x<3;x++) put(S,x,GH-1,pill(1)); forcePiece(S,[1,2]); S.piece.x=3; S.piece.rot=1;
until(S,s=>s.status!=='play'); assert.strictEqual(S.status,'win'); assert.ok(S.events.some(e=>e.t==='win')&&S.events.some(e=>e.t==='clear')); ok('단계: 다음 단계는 바이러스 +4 · 단계 20을 마치면 win');
// 11) 약병 입구이 막히면 끝 · 약병 입구 위에 걸쳐 굳어도 끝
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); clearBoard(S); put(S,7,GH-1,virus(1)); S.viruses=1; put(S,3,0,pill(1)); /* 약병 입구 자리 막힘 */
S.piece={x:0,y:0,rot:0,c:[2,2],shape:0}; S.phase='fall'; S.dropT=0; put(S,0,1,pill(3)); put(S,1,1,pill(3)); /* 바로 아래가 막혀 굳는다 → 다음 던지기 (3,0) 막힘 → over */
until(S,s=>s.status!=='play'); assert.strictEqual(S.status,'over'); assert.ok(S.events.some(e=>e.t==='over'));
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); clearBoard(S); put(S,7,GH-1,virus(1)); S.viruses=1; for(let y=1;y<GH;y++) put(S,3,y,pill(y%2?2:3)); forcePiece(S,[2,2]); S.piece.x=3; S.piece.rot=1; /* 세로: (3,0),(3,-1) → 바로 굳고 위 칸이 약병 입구 밖 */
until(S,s=>s.status!=='play'); assert.strictEqual(S.status,'over'); ok('끝: 약병 입구 막힘 · 약병 입구 위에 걸쳐 굳음');
// 12) findMatches: 세로 넷 · 셋은 아님 · 가로세로 겹침
S=E.newGame({speed:1,stage:1,seed:7}); clearBoard(S); for(let y=GH-4;y<GH;y++) put(S,5,y,pill(3)); assert.strictEqual(E.findMatches(S).size,4); S.cells[E.idx(5,GH-4)]=0; assert.strictEqual(E.findMatches(S).size,0);
put(S,5,GH-4,pill(3)); for(let x=4;x<8;x++) put(S,x,GH-1,virus(3)); assert.strictEqual(E.findMatches(S).size,7); ok('맞추기: 세로 넷 · 셋은 아님 · 가로세로 겹치면 합집합');
// 13) 저장 직렬화 왕복: 같은 입력이면 같은 진행(난수 포함)
S=E.newGame({speed:2,stage:3,pre:2,seed:99}); run(S,K({down:true}),200);
const copy=JSON.parse(JSON.stringify(S,(k,v)=>k==='events'||k==='fx'?[]:v)); copy.events=[]; copy.fx=[];
const a=[],b=[]; for(let i=0;i<600;i++){ E.step(S,K({left:i%7<3,down:i%5===0})); E.step(copy,K({left:i%7<3,down:i%5===0})); } 
assert.strictEqual(JSON.stringify(S,(k,v)=>k==='events'||k==='fx'?undefined:v),JSON.stringify(copy,(k,v)=>k==='events'||k==='fx'?undefined:v)); ok('저장 직렬화 왕복 후 같은 진행');
// 14) 같은 시드면 같은 판
assert.strictEqual(JSON.stringify(E.newGame({speed:1,stage:7,pre:2,seed:5}).cells),JSON.stringify(E.newGame({speed:1,stage:7,pre:2,seed:5}).cells)); ok('같은 시드 → 같은 판');
// 15) 태블릿은 거꾸로 돈다: X·↑(+1)가 반시계, Z(−1)가 시계. 캡슐·주사기는 그대로. 벽 차기도 같다
for(const sh of [0,2]){ S=E.newGame({speed:1,stage:1,seed:7}); settle(S); forcePiece(S,[1,2],sh); S.piece.y=5; E.rotate(S,1); assert.strictEqual(S.piece.rot,1,'모양 '+sh+' 시계'); }
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); forcePiece(S,[1,2],1); S.piece.y=5;
assert.ok(E.rotate(S,1)); assert.strictEqual(S.piece.rot,3,'태블릿 +1 → 반시계'); assert.deepStrictEqual(E.cellsOf(S.piece).map(q=>[q.x,q.y,q.c]),[[3,5,2],[3,4,1]]);
assert.ok(E.rotate(S,1)); assert.strictEqual(S.piece.rot,2); assert.ok(E.rotate(S,-1)); assert.strictEqual(S.piece.rot,3); assert.ok(E.rotate(S,-1)); assert.strictEqual(S.piece.rot,0,'태블릿 −1 → 시계');
S.piece.rot=1; S.piece.x=GW-1; assert.ok(E.rotate(S,-1)); assert.strictEqual(S.piece.rot,2); assert.strictEqual(S.piece.x,GW-2,'태블릿도 오른쪽 벽에서 한 칸 밀려 돈다');
{ const T=E.newGame({speed:1,stage:1,seed:7}); settle(T); forcePiece(T,[1,2],1); T.piece.y=5; E.rotate(T,1); const U=E.newGame({speed:1,stage:1,seed:7}); settle(U); forcePiece(U,[1,2],0); U.piece.y=5; E.rotate(U,-1); assert.deepStrictEqual(E.cellsOf(T.piece),E.cellsOf(U.piece),'태블릿 X = 캡슐 Z'); }
ok('태블릿: X·↑ 반시계 · Z 시계 · 벽 차기 · 캡슐·주사기는 그대로');
// 16) 주사기: 바늘은 돌리는 방향대로 오른쪽→아래→왼쪽→위, 색은 캡슐과 같아 돌릴 때마다 바늘 쪽 색이 맞바뀐다. 굳으면 바늘 칸을 기억한다
S=E.newGame({speed:1,stage:1,seed:7}); settle(S); forcePiece(S,[1,2],2); S.piece.y=5;
const needle=()=>{ const cs=E.cellsOf(S.piece), ni=E.needleIdx(S.piece.rot), a=cs[ni], b=cs[1-ni]; return {c:a.c,dir:[Math.sign(a.x-b.x),Math.sign(a.y-b.y)].join(',')}; };
const seen=[needle()]; for(let i=0;i<4;i++){ E.rotate(S,1); seen.push(needle()); }
assert.deepStrictEqual(seen.map(q=>q.dir),['1,0','0,1','-1,0','0,-1','1,0'],'바늘 방향 시계');
for(let i=1;i<seen.length;i++) assert.notStrictEqual(seen[i].c,seen[i-1].c,'돌릴 때마다 바늘 색이 바뀐다 '+i);
const back=[needle()]; for(let i=0;i<4;i++){ E.rotate(S,-1); back.push(needle()); } assert.deepStrictEqual(back.map(q=>q.dir),['1,0','0,-1','-1,0','0,1','1,0'],'반시계'); for(let i=1;i<back.length;i++) assert.notStrictEqual(back[i].c,back[i-1].c);
{ const T=E.newGame({speed:1,stage:1,seed:7}); settle(T); forcePiece(T,[1,2],2); T.piece.y=5; E.rotate(T,1); E.rotate(T,1); const U=E.newGame({speed:1,stage:1,seed:7}); settle(U); forcePiece(U,[1,2],0); U.piece.y=5; E.rotate(U,1); E.rotate(U,1); assert.deepStrictEqual(E.cellsOf(T.piece),E.cellsOf(U.piece),'주사기 색 자리 = 캡슐'); }
for(const rot of [0,1,2,3]){ const T=E.newGame({speed:1,stage:1,seed:7}); settle(T); T.cells.fill(0); T.viruses=0; T.cells[E.idx(0,15)]={c:3,kind:'virus',shape:0,lx:0,ly:0,seed:0}; T.viruses=1; forcePiece(T,[1,2],2); for(let i=0;i<rot;i++) E.rotate(T,1); dropLock(T);
  const pills=T.cells.map((o,i)=>o&&o.kind==='pill'?{...o,i}:null).filter(Boolean); assert.strictEqual(pills.length,2); assert.strictEqual(pills.filter(o=>o.n===true).length,1,'바늘 칸 하나 rot '+rot); const nd=pills.find(o=>o.n);
  const want=[2,1,2,1][rot]; assert.strictEqual(nd.c,want,'굳은 바늘 색 rot '+rot); }
{ const T=E.newGame({speed:1,stage:1,seed:7}); settle(T); T.cells.fill(0); T.cells[E.idx(0,15)]={c:3,kind:'virus',shape:0,lx:0,ly:0,seed:0}; T.viruses=1; forcePiece(T,[1,2],0); dropLock(T); assert.ok(T.cells.every(o=>!o||o.n===undefined),'캡슐은 바늘 표시 없음'); }
ok('주사기: 바늘 오른쪽→아래→왼쪽→위 · 돌릴 때마다 바늘·밀대 색 맞바뀜 · 색 자리는 캡슐과 같음 · 굳으면 바늘 칸 기억');
// 17) 나오는 비율: 주사기 1/3 · 태블릿 단계 1 5% → 단계 20 43% · 나머지 캡슐
assert.strictEqual(E.tabletRate(1),0.05); assert.ok(Math.abs(E.tabletRate(20)-0.43)<1e-9); for(let st=2;st<=20;st++) assert.ok(E.tabletRate(st)>E.tabletRate(st-1));
for(const [st,tr] of [[1,0.05],[10,0.23],[20,0.43]]){ const T={rs:12345,stage:st}; const cnt=[0,0,0]; const N=30000; for(let i=0;i<N;i++) cnt[E.pickShape(T)]++;
  assert.ok(Math.abs(cnt[2]/N-1/3)<0.015,'주사기 '+st+' '+cnt[2]/N); assert.ok(Math.abs(cnt[1]/N-tr)<0.015,'태블릿 '+st+' '+cnt[1]/N); assert.ok(Math.abs(cnt[0]/N-(2/3-tr))<0.015,'캡슐 '+st); }
{ let t1=0,t20=0; for(let seed=1;seed<=200;seed++){ const A=E.newGame({speed:1,stage:1,seed}); const B=E.newGame({speed:1,stage:20,seed}); if(A.piece.shape===1) t1++; if(B.piece.shape===1) t20++; } assert.ok(t20>t1*3,'단계 20에서 태블릿이 훨씬 잦다 '+t1+'/'+t20); }
ok('비율: 주사기 1/3 · 태블릿 5%→43%(단계마다 +2%) · 판에서도 단계 20이 더 잦다');
// 18) 안내 없음(v0.07): 태블릿·주사기가 처음 나와도 글을 띄우지 않고 기록 사건도 없다 · 끌기 shift는 내려오는 중에만 한 칸씩
{ let found=null; for(let seed=1;seed<400&&!found;seed++){ const T=E.newGame({speed:1,stage:20,seed}); if(T.piece.shape===1) found=T; }
  assert.ok(found,'단계 20에서 첫 알약이 태블릿인 판'); assert.strictEqual(found.msg,''); assert.ok(!found.events.some(e=>e.t==='gimmick')); assert.strictEqual(found.told,undefined);
  const T=found; settle(T); T.cells.fill(0); T.cells[E.idx(0,15)]=virus(3); T.viruses=1; T.next={c:[2,2],shape:2}; dropLock(T); assert.strictEqual(T.piece.shape,2); assert.strictEqual(T.msg,''); assert.ok(!T.events.some(e=>e.t==='gimmick'));
  settle(T); const x0=T.piece.x, y0=T.piece.y; assert.ok(E.shift(T,1,0)); assert.strictEqual(T.piece.x,x0+1); assert.ok(E.shift(T,0,1)); assert.strictEqual(T.piece.y,y0+1); assert.strictEqual(T.dropT,0);
  T.piece.x=0; assert.ok(!E.shift(T,-1,0),'벽에 막힘'); T.phase='throw'; assert.ok(!E.shift(T,1,0),'던지는 중에는 안 움직임'); }

ok('안내 없음(v0.07) · 끌기 한 칸: 좌우·아래 · 벽·던지는 중엔 안 움직임');
console.log(`핵심 시험 ${n}개 통과`);
