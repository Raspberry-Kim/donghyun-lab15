// 화면 시험: node qa/ui.cjs (build 뒤 index.html을 파일로 연다)
// 첫 화면·규약 오류·예제 여섯·키보드(←→↓·X·Z·A·Enter)·마우스 찍기 X·끌기 ←→↓·메뉴 저장 칸 3개·.dhsave·첫 화면 칸 목록·클리어 카드→다음 단계·결과 카드·전체 화면·휴대폰 띠·콘솔 오류
const {chromium}=require('/home/user/node_modules/playwright'); const path=require('path'); const assert=require('assert'); const fs=require('fs');
const url='file://'+path.join(__dirname,'..','index.html');
const H='window.__donghyundoc';
(async()=>{
  const b=await chromium.launch(); const errs=[]; let n=0; const ok=(name)=>{ n++; console.log('ok',name); };
  const p=await b.newPage({viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(400);
  const G=(js)=>p.evaluate(`(()=>{const D=${H};const S=D.state;const E=window.Engine;return (${js});})()`);
  const X=(js)=>p.evaluate(`(()=>{const D=${H};const S=D.state;const E=window.Engine;${js}})()`);
  const txt=async()=>JSON.parse(await p.evaluate('render_game_to_text()'));
  const bb=async()=>p.$eval('#board',e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  const menuText=async()=>p.$eval('#menu',e=>e.hidden?'':e.textContent);
  const toSetup=async()=>{ if((await G('D.mode'))!=='setup'){ await p.click('#concede'); await mi('포기한다'); } };
  const mi=async(label)=>{ const items=await p.$$('#menu .mi'); for(const it of items){ const t=await it.$eval('span',e=>e.textContent); if(t===label){ await it.click(); await p.waitForTimeout(60); return; } } throw new Error('메뉴 항목 없음: '+label+' / '+await menuText()); };
  const settle=()=>X(`D.keys.left=D.keys.right=D.keys.down=false; while(S.phase==='throw') D.step(1);`);
  const startEx=async(id)=>{ await toSetup(); await p.selectOption('#example',id); await p.click('#run'); await p.waitForTimeout(150); };

  // 0) 첫 화면
  assert.strictEqual(await G('D.mode'),'setup'); assert.ok(!(await p.$eval('#setup-panel',e=>e.hidden))); assert.ok(await p.$eval('#hud',e=>e.hidden));
  assert.deepStrictEqual(await p.$$eval('.slot-btn',a=>a.map(b=>b.disabled)),[true,true,true]); assert.ok(await p.$eval('#full',e=>e.disabled));
  assert.strictEqual(await p.$eval('#example',e=>e.options.length),6); assert.match(await p.$eval('#stamp-mode',e=>e.textContent),/느림/);
  assert.strictEqual(await p.$eval('.series-links',e=>e.children.length),18); assert.strictEqual(await p.$eval('.series-item.is-current .series-name',e=>e.textContent.replace('™','')),'동현닥');
  assert.strictEqual(await p.$$eval('.input-marks .mark',a=>a.map(m=>m.classList.contains('on')).join()),'true,true,true,true','입력 표식: 넷 모두 on(v0.07 마우스 켬)');
  assert.strictEqual(await p.$('#touchpad'),null,'터치패드 없음'); assert.ok(await G('window.Sprites.PODONG_ROWS.length===20 && window.Sprites.PODONG_ROWS.every(r=>r.length===24)'),'포동이 24×20 도트'); ok('첫 화면: 설정 패널 · 칸 비어 있음 · 예제 6 · 띠 18 · 입력 표식 · 터치패드 없음 · 동현크 포동이 도트');
  // 1) 규약 오류
  await p.fill('#code','나는 동현이냐?\n뿡뿡 도오오오옹~뿡뿡뿡\n동현이구나'); await p.click('#run'); await p.waitForTimeout(100);
  assert.match(await p.$eval('#result',e=>e.textContent),/속도 번호가 아니다/); assert.strictEqual(await G('D.mode'),'setup');
  const pr=await G(`D.parseSortie('2 3 4 5')`); assert.strictEqual(pr.go,false); assert.match(pr.err[0],/4개/);
  const pr2=await G(`D.parseSortie('3 20 9')`); assert.deepStrictEqual([pr2.go,pr2.c.speed,pr2.c.stage,pr2.c.pre],[true,3,20,9]);
  const pr3=await G(`D.parseSortie('1 21')`); assert.strictEqual(pr3.go,false); assert.match(pr3.err[0],/바이러스 단계가 아니다/);
  const pr4=await G(`D.parseSortie('1 1 10')`); assert.strictEqual(pr4.go,false); assert.match(pr4.err[0],/깔린 알약 수가 아니다/);
  const pr5=await G(`D.parseSortie('2')`); assert.deepStrictEqual([pr5.go,pr5.c.speed,pr5.c.stage,pr5.c.pre],[true,2,1,0]); ok('규약: 속도 범위 · 정수 개수 · 단계·깔린 알약 범위 · 속도만 써도 된다');
  // 2) 예제 여섯
  const want={slow:[1,1,0,4],mid:[2,5,0,20],fast:[3,8,0,32],pre:[1,5,3,20],fastpre:[3,10,5,40],last:[2,20,0,80]};
  for(const id of Object.keys(want)){ await startEx(id); const t=await txt(); assert.strictEqual(t.mode,'play',id); assert.strictEqual(await G('E.speedOf(S).id'),want[id][0],id); assert.strictEqual(t.stage,want[id][1]); assert.strictEqual(await G('S.pre'),want[id][2]); assert.strictEqual(t.viruses,want[id][3]); assert.ok(!(await p.$eval('#hud',e=>e.hidden)));
    const pills=await G(`S.cells.filter(o=>o&&o.kind==='pill').length`); assert.strictEqual(pills,want[id][2]*2,id+' 깔린 알약'); }
  assert.match(await p.$eval('#day',e=>e.textContent),/단계 20 · 보통/); ok('예제 여섯: 속도·단계·깔린 알약·바이러스 수');
  // 3) 키보드
  await startEx('slow'); await settle(); await p.evaluate(()=>document.querySelector('#board-wrap').scrollIntoView({block:'center'})); await p.focus('#board-wrap');
  let t=await txt(); assert.deepStrictEqual([t.piece.x,t.piece.y,t.piece.rot],[3,0,0]);
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.x,2,'←');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.x,4,'→');
  await p.keyboard.press('KeyX'); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,1,'X 시계'); await p.keyboard.press('KeyZ'); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,0,'Z 반시계');
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,1,'↑ 시계(X와 같다)'); await p.keyboard.press('KeyZ'); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,0,'↑ 뒤 Z 반시계'); ok('↑ 돌리기 = X 시계');
  // 충분한 빈 공간에서 본다. 앞선 키 시험 동안 바닥에 닿아 다음 알약(y=0)이 나오면 오판할 수 있다.
  await X(`S.cells.fill(0);S.viruses=0;S.piece={x:3,y:0,rot:0,c:[1,2],shape:0};S.phase='fall';S.dropT=0;S.pt=0;`);
  const y0=(await txt()).piece.y; await p.keyboard.down('ArrowDown'); await p.waitForFunction(()=>window.__donghyundoc.state.piece.y>=4); await p.keyboard.up('ArrowDown'); t=await txt(); assert.ok(t.piece.y>=y0+4,'↓ 빨리 내리기 '+t.piece.y);
  await p.keyboard.press('KeyA'); await p.waitForTimeout(100); assert.match(await G('S.msg'),/느림:/,'A 설명');
  await p.keyboard.press('Enter'); await p.waitForTimeout(100); assert.match(await menuText(),/잠시 멈춤/); const fr0=await G('S.time'); await p.waitForTimeout(400); assert.strictEqual(await G('S.time'),fr0,'메뉴 동안 멎음'); await mi('속도 설명'); assert.match(await menuText(),/느림:/); await p.keyboard.press('KeyZ'); await p.waitForTimeout(60); assert.match(await menuText(),/잠시 멈춤/); await mi('계속 간다'); assert.strictEqual(await menuText(),''); await p.waitForTimeout(200); assert.ok((await G('S.time'))>fr0,'계속 간다 뒤 흐른다');
  ok('키보드: ← → 한 칸 · X 시계 · Z 반시계 · ↓ 빨리 · A 설명 · Enter 메뉴(멎음) · 속도 설명 · 계속 간다');
  // 4) 마우스·손가락(v0.07): 알약을 찍으면 X(시계) · 멀리 찍으면 그대로 · 끌면 가로 20px마다 한 칸 · 아래로 20px마다 한 줄 · 위로는 안 올라감
  { await X(`S.phase='fall'; S.piece.x=3; S.piece.y=5; S.piece.rot=0; S.piece.shape=0; S.dropT=-1e6;`); const r=await bb(), k=r.w/480; const at=(cx,cy)=>[r.x+cx*k,r.y+cy*k];
    const E0=await G('({BX:E.BX,BY:E.BY,C:E.CELL})'); const pc=at(E0.BX+3*E0.C+10,E0.BY+5*E0.C+10);
    await p.mouse.click(...pc); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,1,'알약 찍기 = X 시계');
    await p.mouse.click(...at(E0.BX+7*E0.C+10,E0.BY+14*E0.C+10)); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,1,'멀리 찍으면 안 돈다');
    await X(`S.piece.rot=0; S.piece.shape=1;`); await p.mouse.click(...pc); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,3,'태블릿은 찍어도 거꾸로');
    await X(`S.piece.rot=0; S.piece.shape=0;`); const s0=at(200,120); await p.mouse.move(...s0); await p.mouse.down(); for(let i=1;i<=9;i++) await p.mouse.move(s0[0]+i*5*k,s0[1]); await p.waitForTimeout(40); t=await txt(); assert.strictEqual(t.piece.x,5,'오른쪽 45px 끌기 = 두 칸');
    for(let i=1;i<=6;i++) await p.mouse.move(s0[0]+45*k-i*5*k,s0[1]); t=await txt(); assert.strictEqual(t.piece.x,4,'왼쪽 30px = 한 칸');
    for(let i=1;i<=9;i++) await p.mouse.move(s0[0]+15*k,s0[1]+i*5*k); t=await txt(); assert.deepStrictEqual([t.piece.x,t.piece.y],[4,7],'아래 45px = 두 줄');
    for(let i=1;i<=6;i++) await p.mouse.move(s0[0]+15*k,s0[1]+45*k-i*10*k); t=await txt(); assert.strictEqual(t.piece.y,7,'위로는 안 올라감'); await p.mouse.up(); await p.waitForTimeout(60); t=await txt(); assert.strictEqual(t.piece.rot,0,'끈 뒤 놓아도 돌지 않음');
    await p.keyboard.press('Enter'); await p.waitForTimeout(80); await p.mouse.click(...pc); await p.waitForTimeout(80); t=await txt(); assert.strictEqual(t.piece.rot,0,'메뉴 동안 찍어도 그대로'); await p.keyboard.press('KeyZ'); await p.waitForTimeout(80);
    await X(`S.dropT=0;`); ok('마우스: 알약 찍기 X · 태블릿 거꾸로 · 끌기 좌우·아래 · 위로는 안 감 · 메뉴 중 무시'); }
  // 5) 저장 메뉴
  await p.evaluate(()=>{ window.__dl=null; URL.createObjectURL=(blob)=>{ blob.text().then(t=>window.__dl=t); return 'blob:x'; }; URL.revokeObjectURL=()=>{}; HTMLAnchorElement.prototype.click=function(){ window.__dlname=this.download; }; });
  await X(`S.score=1200;`); await p.keyboard.press('Enter'); await p.waitForTimeout(80); await mi('저장'); assert.match(await menuText(),/^저장/); await mi('브라우저 칸 1'); assert.strictEqual(await menuText(),''); const s1=await p.evaluate(()=>JSON.parse(localStorage.getItem('donghyundoc:slot1'))); assert.strictEqual(s1.format,'donghyundoc-save'); assert.strictEqual(s1.summary.speed,'느림'); assert.strictEqual(s1.state.score,1200); const savedScore=1200;
  assert.match(await p.$eval('.slot-btn',e=>e.textContent),/칸 1.*단계 1 느림/); assert.strictEqual((await p.$$('.slot-del')).length,1);
  await p.keyboard.press('Enter'); await mi('저장'); await mi('브라우저 칸 1'); assert.match(await menuText(),/덮어쓸까/); await mi('그만둔다'); assert.match(await menuText(),/^저장/); await mi('파일로 내려받기'); await p.waitForTimeout(200); const dl=await p.evaluate(()=>[window.__dl,window.__dlname]); assert.ok(dl[0]&&JSON.parse(dl[0]).format==='donghyundoc-save'); assert.strictEqual(dl[1],'donghyundoc-stage1-1200.dhsave'); fs.writeFileSync('/tmp/doc.dhsave',dl[0]); assert.strictEqual(await menuText(),'');
  await X(`S.score+=777;`); await p.keyboard.press('Enter'); await mi('불러오기'); assert.match(await menuText(),/^불러오기/); await mi('브라우저 칸 1'); assert.match(await menuText(),/버리고 불러올까/); await mi('그만둔다'); await mi('브라우저 칸 1'); await mi('불러온다'); assert.strictEqual(await G('S.score'),savedScore,'칸에서 불러오면 그 시점'); assert.strictEqual(await menuText(),'');
  await X(`S.score+=5;`); await p.keyboard.press('Enter'); await mi('불러오기'); await mi('파일에서 불러오기'); await p.setInputFiles('#load-file','/tmp/doc.dhsave'); await p.waitForTimeout(200); assert.strictEqual(await G('S.score'),savedScore,'파일에서 불러오면 그 시점');
  fs.writeFileSync('/tmp/doc-bad.dhsave','{"hello":1}'); await p.setInputFiles('#load-file','/tmp/doc-bad.dhsave'); await p.waitForTimeout(200); assert.match(await p.$eval('#status',e=>e.textContent),/불러오기 실패: 동현닥 저장 파일이 아니다/);
  const bad=JSON.parse(dl[0]); bad.state.viruses=99; fs.writeFileSync('/tmp/doc-bad2.dhsave',JSON.stringify(bad)); await p.setInputFiles('#load-file','/tmp/doc-bad2.dhsave'); await p.waitForTimeout(200); assert.match(await p.$eval('#status',e=>e.textContent),/바이러스 수가 맞지 않는다/);
  const bad3=JSON.parse(dl[0]); bad3.state.cells[5]={c:9}; fs.writeFileSync('/tmp/doc-bad3.dhsave',JSON.stringify(bad3)); await p.setInputFiles('#load-file','/tmp/doc-bad3.dhsave'); await p.waitForTimeout(200); assert.match(await p.$eval('#status',e=>e.textContent),/병 정보가 맞지 않는다/);
  await p.keyboard.press('Enter'); await mi('저장'); await mi('브라우저 칸 2'); await p.keyboard.press('Enter'); await mi('저장'); await mi('브라우저 칸 지우기'); assert.match(await menuText(),/^지울 칸/); await mi('브라우저 칸 2'); await mi('지운다'); assert.strictEqual(await p.evaluate(()=>localStorage.getItem('donghyundoc:slot2')),null); await p.keyboard.press('KeyZ');
  ok('저장 메뉴 · 덮어쓰기 확인 · 불러오기 확인 · .dhsave 내려받기·열기 · 잘못된 파일 셋 · 칸 지우기');
  // 6) 포기 → 첫 화면 칸 목록
  await p.click('#concede'); await mi('포기한다'); assert.strictEqual(await G('D.mode'),'setup'); assert.deepStrictEqual(await p.$$eval('.slot-btn',a=>a.map(b=>b.disabled)),[false,true,true]);
  await p.click('.slot-btn'); await p.waitForTimeout(100); assert.strictEqual(await G('D.mode'),'play'); assert.strictEqual(await G('S.score'),savedScore);
  await p.click('#concede'); await mi('포기한다'); await p.click('.slot-del'); assert.strictEqual(await p.$eval('.slot-del',e=>e.textContent),'정말 지운다'); await p.click('.slot-del'); assert.strictEqual(await p.evaluate(()=>localStorage.getItem('donghyundoc:slot1')),null);
  await p.setInputFiles('#load-file-setup','/tmp/doc.dhsave'); await p.waitForTimeout(200); assert.strictEqual(await G('D.mode'),'play'); assert.strictEqual(await G('S.score'),savedScore); ok('첫 화면 칸 목록 · 지우기 두 번 · 파일에서 불러오기');
  // 7) 넷 맞추면 지움 → 바이러스 0 → 클리어 카드 → 다음 단계
  await settle(); await X(`S.cells.fill(0); S.viruses=0; const V=c=>({c,kind:'virus',shape:0,lx:0,ly:0,seed:0}); S.cells[E.idx(0,15)]=V(1); S.cells[E.idx(1,15)]=V(1); S.cells[E.idx(2,15)]=V(1); S.viruses=3; S.piece={x:3,y:0,rot:1,c:[1,2],shape:0}; S.phase='fall'; S.dropT=0; D.keys.down=true; D.step(33); D.keys.down=false;`); await p.waitForTimeout(100);
  t=await txt(); assert.strictEqual(t.phase,'clearing'); await X(`D.step(40);`); await p.waitForTimeout(200); t=await txt(); assert.strictEqual(t.viruses,0); assert.strictEqual(await G('D.mode'),'clear'); assert.ok(!(await p.$eval('#result-card',e=>e.hidden))); assert.match(await p.$eval('#result-card',e=>e.textContent),/단계 1 클리어.*다음은 단계 2/); assert.match(await p.$eval('#log',e=>e.textContent),/바이러스 3 지움.*\+700점/);
  await p.click('#rc-next'); await p.waitForTimeout(100); t=await txt(); assert.strictEqual(t.mode,'play'); assert.strictEqual(t.stage,2); assert.strictEqual(t.viruses,8); assert.match(await p.$eval('#day',e=>e.textContent),/단계 2 · 느림/);
  /* 단계 20 → 결과 카드(끝) */
  await settle(); await X(`S.stage=20; S.cells.fill(0); const V=c=>({c,kind:'virus',shape:0,lx:0,ly:0,seed:0}); S.cells[E.idx(0,15)]=V(2); S.cells[E.idx(1,15)]=V(2); S.cells[E.idx(2,15)]=V(2); S.viruses=3; S.piece={x:3,y:0,rot:1,c:[2,1],shape:1}; S.phase='fall'; S.dropT=0; D.keys.down=true; D.step(100); D.keys.down=false;`); await p.waitForTimeout(300);
  assert.strictEqual(await G('D.mode'),'over'); assert.match(await p.$eval('#result-card',e=>e.textContent),/스무 단계를 모두 마쳤다/); await p.click('#rc-back'); assert.strictEqual(await G('D.mode'),'setup'); ok('클리어 카드(바이러스 셋 700점) → 다음 단계 2 · 단계 20 클리어 → 끝 카드');
  // 8) 약병 입구가 막히면 치료 실패 카드
  await startEx('fast'); await settle(); await X(`for(let y=1;y<16;y++) if(!S.cells[E.idx(3,y)]) S.cells[E.idx(3,y)]={c:(y%2)+1,kind:'pill',shape:0,lx:0,ly:0}; S.piece={x:3,y:0,rot:0,c:[3,3],shape:0}; S.phase='fall'; S.dropT=0; D.step(200);`); await p.waitForTimeout(300);
  assert.strictEqual(await G('D.mode'),'over'); assert.match(await p.$eval('#result-card',e=>e.textContent),/치료 실패/); await p.keyboard.press('Enter'); await p.waitForTimeout(100); assert.strictEqual(await G('D.mode'),'setup'); ok('병목 막힘 → 결과 카드 · Enter로 첫 화면');
  // 9) 전체 화면
  await startEx('mid'); const w0=(await bb()).w; await p.click('#full'); await p.waitForTimeout(500); assert.ok(!(await p.$eval('#exit-full',e=>e.hidden))); assert.ok((await bb()).w>w0,'전체 화면에서 판이 넓다'); await p.click('#exit-full'); await p.waitForTimeout(400); assert.ok(Math.abs((await bb()).w-w0)<2); ok('전체 화면 들어가기·나오기');
  // 10) 다른 탭을 보면 멎는다
  await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{get:()=>true,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(100); const t1=await G('S.time'); await p.waitForTimeout(500); assert.strictEqual(await G('S.time'),t1,'숨기면 멎는다');
  await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{get:()=>false,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(300); assert.match(await menuText(),/잠시 멈춤/); await mi('계속 간다'); await p.waitForTimeout(300); assert.ok((await G('S.time'))>t1); ok('숨기면 멎는다 · 돌아오면 멈춤 메뉴');
  // 11) 규칙 탭 표
  await p.click('text=규칙과 알약'); await p.waitForTimeout(100);
  assert.strictEqual(await p.$eval('#mode-grid',e=>e.querySelectorAll('article').length),3); assert.strictEqual(await p.$eval('#level-table',e=>e.querySelectorAll('tbody tr').length),20); ok('규칙 표: 속도 3 · 단계 20');
  await p.evaluate(()=>localStorage.clear());
  // 12) 휴대폰: 띠 · 터치패드 없음 · 전체 화면
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}); const m=await ctx.newPage();
  m.on('pageerror',e=>errs.push('mobile: '+e.message)); m.on('console',x=>{ if(x.type()==='error') errs.push('mobile console: '+x.text()); });
  await m.goto(url); await m.waitForTimeout(400); const MG=(js)=>m.evaluate(`(()=>{const D=${H};const S=D.state;return (${js});})()`);
  await m.tap('#run'); await m.waitForTimeout(200); assert.strictEqual(await MG('D.mode'),'play'); assert.strictEqual(await m.$('#touchpad'),null);
  await m.tap('#full'); await m.waitForTimeout(500); assert.ok(!(await m.$eval('#exit-full',e=>e.hidden))); assert.ok((await m.$eval('#board',e=>e.getBoundingClientRect().width))>=360); await m.tap('#exit-full'); await m.waitForTimeout(300); assert.ok(await m.$eval('#exit-full',e=>e.hidden));
  assert.strictEqual(await m.$eval('.series-links',e=>e.children.length),18); const strip=await m.$eval('.series-links',e=>{ const n=e.children.length, L=e.querySelector('.series-item[data-series="lang"]'); const r=[...e.children].map(c=>c.getBoundingClientRect()); return {n, langW:L.getBoundingClientRect().width, otherW:r[1].width}; });
  assert.ok(Math.abs(strip.langW-strip.otherW)<2,'18개(짝수)라 동현랭도 반 폭 '+JSON.stringify(strip)); ok('휴대폰: 터치패드 없음 · 전체 화면 · 띠 18 짝수 → 동현랭 반 폭');
  { /* v0.06 · 안내 글(A 속도 설명)은 왼쪽 아래 조작 안내 자리에 뜨고 약병을 가리지 않는다. 줄은 폭 116px 안에 7줄까지 */
    const q=await b.newPage(); q.on('pageerror',e=>errs.push(e.message)); await q.goto(url); await q.waitForTimeout(300);
    const r=await q.evaluate(()=>{ const E=window.Engine,R=window.Render; const cv=document.createElement('canvas'); cv.width=E.W; cv.height=E.H; const g=cv.getContext('2d');
      const msgs=[...E.SPEEDS.map(m=>`${m.name}: ${m.desc}`)]; let worst=0, maxLines=0;
      g.font='600 10px Pretendard, sans-serif'; for(const m of msgs){ const ls=R.wrapText(g,m,116); maxLines=Math.max(maxLines,ls.length); for(const l of ls) worst=Math.max(worst,g.measureText(l).width); if(ls.join('').replace(/ /g,'')!==m.replace(/ /g,'')) return {lost:m}; }
      const shot=(msg)=>{ const S=E.newGame({speed:1,stage:3,seed:5}); S.msg=msg; S.msgT=msg?100:0; R.render(g,S,10); return Array.from(g.getImageData(E.BX-4,E.BY-20,E.GW*E.CELL+8,E.GH*E.CELL+24).data); };
      const a=shot(''), bb=shot(`${E.SPEEDS[2].name}: ${E.SPEEDS[2].desc}`); let diff=0; for(let i=0;i<a.length;i++) if(a[i]!==bb[i]) diff++; return {worst,maxLines,diff}; });
    assert.ok(!r.lost,'줄 나눔에서 글자가 빠졌다 '+r.lost); assert.ok(r.worst<=116,'줄 폭 '+r.worst); assert.ok(r.maxLines<=7); assert.strictEqual(r.diff,0,'안내 글이 약병을 가린다');
    await q.close(); ok('안내 글: 왼쪽 아래 · 약병을 가리지 않음 · 줄 폭 116px 안'); }
  await ctx.close(); await b.close();
  if(errs.length){ console.error('콘솔 오류',errs); process.exit(1); }
  console.log(`\n${n} ui tests passed · 콘솔 오류 0`);
})().catch(e=>{ console.error(e); process.exit(1); });
