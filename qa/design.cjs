// 도트 원본·화면 좌표·동작·작은 화면 회귀 검사. node build.cjs 뒤 실행한다.
const {chromium}=require('/home/user/node_modules/playwright');
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const url=process.env.QA_URL||'file://'+path.join(__dirname,'..','index.html');
(async()=>{
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:960},hasTouch:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.evaluate(()=>document.fonts.ready);await p.click('#run');
  const raw=await p.evaluate(()=>Sprites.PODONG_ROWS.join('\n'));
  assert.strictEqual(crypto.createHash('sha256').update(raw).digest('hex'),'1b39f78c72ddd1bb165f3f1bc744ae6fd8dd3839cbf5d2a623c702b7c83e20e7','동현크 P_idle 원본');
  assert.deepStrictEqual(await p.evaluate(()=>Sprites.PODONG_PAL),{W:'#f6ecd6',G:'#c9aa78',K:'#2e2a38',R:'#d6403a',E:'#ffffff'});
  assert.deepStrictEqual(await p.evaluate(()=>[Engine.BX+Engine.GW*Engine.CELL/2,Engine.GW,Engine.GH,Engine.CELL]),[240,8,16,20]);
  const report=await p.evaluate(()=>{
    const E=Engine,R=Render,S=E.newGame({speed:1,stage:1,seed:7}),cv=document.createElement('canvas');
    cv.width=480;cv.height=360;const g=cv.getContext('2d');const poses=[];
    for(let k=0;k<4;k++){
      S.pieces=k;S.phase='throw';const G=R.gimmick(S);
      for(let pt=0;pt<=E.THROW;pt++){
        S.pt=pt;R.render(g,S,10);
        const o=G.origin(pt);if(o.x<340||o.x+20>468||o.y<60||o.y+10>152)throw Error('접점 영역 이탈 '+G.name+':'+JSON.stringify(o));
      }
      poses.push(G.name);
    }
    // 안내가 길어도 중앙 판의 그림은 같아야 한다.
    S.phase='fall';S.score=999999999;S.lastClear={v:12,gained:999999};
    const shot=msg=>{S.msg=msg;S.msgT=100;R.render(g,S,10);return Array.from(g.getImageData(152,2,176,354).data);};
    const a=shot(''),z=shot('빠름: 알약이 16프레임에 한 칸 내려온다. 바이러스 하나에 300점부터. 같은 색 넷을 이어 보자.');
    if(a.some((v,i)=>v!==z[i]))throw Error('안내가 약병을 가렸다');
    return {poses,centre:240};
  });
  fs.mkdirSync(path.join(__dirname,'tmp'),{recursive:true});
  await p.locator('#board').screenshot({path:path.join(__dirname,'tmp/design-board.png')});
  for(const width of [375,390,844,1280]){
    await p.setViewportSize({width,height:900});
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' 가로 넘침');
    const r=await p.locator('#board').boundingBox();assert.ok(Math.abs(r.width/r.height-4/3)<0.01);
    assert.strictEqual(await p.locator('#info-card').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),3);
  }
  await p.setViewportSize({width:844,height:390});await p.click('#full');
  await p.waitForFunction(()=>document.querySelector('#stage-full').classList.contains('side'));
  assert.ok(await p.evaluate(()=>{const a=document.querySelector('#full-hint').getBoundingClientRect(),b=document.querySelector('#board').getBoundingClientRect();return a.right<=b.left||a.bottom<=b.top||a.left>=b.right||a.top>=b.bottom;}),'가로 전체 화면 안내가 판을 가리지 않는다');
  await p.keyboard.press('Enter');assert.ok(await p.locator('#menu').isVisible());
  const ink=await p.evaluate(()=>getComputedStyle(document.body).color);
  assert.strictEqual(await p.locator('#menu').evaluate(e=>getComputedStyle(e).color),ink,'전체 화면 메뉴 글자색');
  await p.keyboard.press('KeyZ');
  await p.evaluate(()=>{
    const D=__donghyundoc,S=D.state,E=Engine;
    for(let y=1;y<16;y++)S.cells[E.idx(3,y)]={c:(y%2)+1,kind:'pill',shape:0,lx:0,ly:0};
    S.piece={x:3,y:0,rot:0,c:[3,3],shape:0};S.phase='fall';S.dropT=0;D.step(300);
  });
  await p.locator('#result-card').waitFor({state:'visible'});
  assert.strictEqual(await p.locator('.rc-grid strong').first().evaluate(e=>getComputedStyle(e).color),ink,'전체 화면 결과 숫자색');
  assert.deepStrictEqual(errors,[]);
  console.log('디자인 검사 통과: 원본 도트·색, 중앙 8×16, 네 동작 60프레임 접점, 긴 안내, 4화면 폭, 메뉴, 오류 0',report);
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
