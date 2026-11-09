// 규칙 봇: 떨어지는 알약마다 놓을 수 있는 모든 자리·회전을 셈해 점수가 가장 높은 자리(색 맞춤·바이러스 인접·낮은 높이)에 둔다.
// 멈춤·값 깨짐이 없는지, 단계가 끝까지 가는지(혹은 약병 입구가 막혀 치료 실패로 끝나는지) 본다. node qa/bot.cjs
const E=require('../src/engine.js').Engine; const assert=require('assert');
const {GW,GH}=E;
function heights(S){ const h=[]; for(let x=0;x<GW;x++){ let y=0; while(y<GH&&!S.cells[E.idx(x,y)]) y++; h.push(y); } return h; }
function evalPlace(S,p){ /* 가상으로 굳혔을 때의 점수 */
  const cs=E.cellsOf(p); let score=0; const h=heights(S);
  for(const q of cs){ if(q.y<0) return -1e9;
    /* 같은 색 이웃 수(바이러스 가중) */
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const o=E.at(S,q.x+dx,q.y+dy); if(o){ if(o.c===q.c) score+=o.kind==='virus'?6:3; else score-=o.kind==='virus'?2:1; } }
    /* 세로줄 같은 색 이어짐 */
    let run=1; for(let k=1;k<4;k++){ const o=E.at(S,q.x,q.y+k); if(o&&o.c===q.c) run++; else break; } score+=run*run;
    score+=q.y*0.8; /* 낮을수록 좋다 */ }
  /* 바닥 높이 들쭉날쭉 벌점 */
  const mn=Math.min(...h); score-=(GH-mn)*0.3;
  return score;
}
function bestPlace(S){
  const p0=S.piece; let best=null;
  for(let rot=0;rot<4;rot++) for(let x=-1;x<GW;x++){ const p={...p0,x,rot,y:p0.y}; const cs=E.cellsOf(p); if(!cs.every(q=>q.x>=0&&q.x<GW&&(q.y<0||!S.cells[E.idx(q.x,q.y)]))) continue;
    /* 바닥까지 내린다 */ let y=p.y; while(E.cellsOf({...p,y:y+1}).every(q=>q.x>=0&&q.x<GW&&q.y<GH&&(q.y<0||!S.cells[E.idx(q.x,q.y)]))) y++; const q={...p,y}; const sc=evalPlace(S,q); if(!best||sc>best.sc) best={x,rot,sc}; }
  return best;
}
function play(speed,stage,pre,seed,maxFrames){
  const S=E.newGame({speed,stage,pre,seed}); const k={left:false,right:false,down:false}; let frames=0, target=null, stagesDone=0, matches=0, chains=0, pieces=0;
  const colsOK=()=>{ let v=0; for(const o of S.cells) if(o&&o.kind==='virus') v++; assert.strictEqual(v,S.viruses,'바이러스 수 불일치'); };
  while(frames<maxFrames&&S.status!=='over'&&S.status!=='win'){
    if(S.status==='clear'){ stagesDone++; colsOK(); E.nextStage(S); target=null; continue; }
    k.left=k.right=k.down=false;
    if(S.phase==='fall'&&S.piece){ if(!target||target.pieceN!==S.pieces){ const b=bestPlace(S); target={x:b?b.x:S.piece.x,rot:b?b.rot:S.piece.rot,pieceN:S.pieces}; }
      const p=S.piece; if(p.rot!==target.rot){ E.rotate(S,1); } else if(p.x<target.x){ k.right=true; } else if(p.x>target.x){ k.left=true; } else k.down=true; }
    E.step(S,k); frames++;
    for(const ev of S.events){ if(ev.t==='match'){ matches++; if(ev.chain>1) chains++; } if(ev.t==='lock') pieces++; } S.events.length=0;
    /* 불변식: 짝 연결은 서로를 가리킨다 · 보이는 바이러스 수 = S.viruses */
    for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ const o=S.cells[E.idx(x,y)]; if(o&&(o.lx||o.ly)){ const q=E.at(S,x+o.lx,y+o.ly); assert.ok(q&&q.kind==='pill'&&q.lx===-o.lx&&q.ly===-o.ly,`짝 연결 깨짐 (${x},${y})`); } }
    if(S.phase==='fall') colsOK();
  }
  return {status:S.status,stage:S.stage,stagesDone,viruses:S.viruses,score:S.score,frames,matches,chains,pieces};
}
const results=[];
for(const [speed,stage,pre,seed] of [[1,1,0,11],[2,5,0,22],[3,8,0,33],[1,5,3,44],[3,10,5,55],[2,20,0,66]]){ const r=play(speed,stage,pre,seed,400000); results.push({speed,stage,pre,...r}); console.log(JSON.stringify(results.at(-1))); }
assert.ok(results.every(r=>r.status==='over'||r.status==='win'),'끝나지 않은 판이 있다');
assert.ok(results.some(r=>r.stagesDone>=1),'봇이 한 단계도 못 깼다');
assert.ok(results.some(r=>r.chains>0),'연쇄가 한 번도 없었다');
console.log('봇 완료: 모두 끝까지 갔고 값이 깨지지 않았다');
