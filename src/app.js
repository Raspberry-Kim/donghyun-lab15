/* 동현닥 앱: 동현랭 편집기 → 출전 규약(속도·바이러스 단계·깔린 알약) → 키보드·게임패드 조작. 마우스·손가락 조작은 없다. 동현큐·동현램과 같은 키 배치와 저장 방식. */
(function(){
const HINT0='<span><kbd>←</kbd><kbd>→</kbd>옮기기</span><span><kbd>↓</kbd>내리기</span><span><kbd>X</kbd><kbd>Z</kbd>돌리기</span><span><kbd>A</kbd>설명</span><span><kbd>↵</kbd>메뉴</span>';
const $=s=>document.querySelector(s), E=window.Engine, R=window.Render, {SPEEDS,STAGES}=E;
const canvas=$('#board'), g=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- 화면 전환·소리·탭 ---------- */
$('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').setAttribute('aria-pressed',String(dark));};
const SND=DHSFX('donghyundoc:sound');
function sndUI(){ const b=$('#sound'); b.setAttribute('aria-pressed',String(SND.on)); b.classList.toggle('muted',!SND.on); b.title=SND.on?'효과음 끄기 (M)':'효과음 켜기 (M)'; }
$('#sound').onclick=()=>{ SND.set(!SND.on); sndUI(); }; sndUI();
document.addEventListener('keydown',e=>{ if(e.code!=='KeyM'||e.metaKey||e.ctrlKey||e.altKey) return; const el=document.activeElement; if(el&&(el.tagName==='TEXTAREA'||el.tagName==='INPUT'||el.tagName==='SELECT')) return; SND.set(!SND.on); sndUI(); });
let tab='play';
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
  tab=b.dataset.tab;
  document.querySelectorAll('.tabs button').forEach(x=>{const on=x.dataset.tab===tab;x.classList.toggle('active',on);on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current');});
  document.querySelectorAll('.tab-panel').forEach(p=>p.hidden=p.id!=='tab-'+tab);
  if(tab==='play') fit();
});
$('.brand').onclick=e=>{e.preventDefault();document.querySelector('[data-tab=play]').click();scrollTo({top:0,behavior:'smooth'});};

/* ---------- 규칙 탭 표 ---------- */
$('#mode-grid').innerHTML=SPEEDS.map(m=>`<article><h4>${m.id} · ${m.name}</h4><p>${m.desc}</p><p class="stat">한 칸 ${m.frames}프레임(${(m.frames/60).toFixed(2)}초) · 바이러스 하나 ${m.base}점부터 · 단계 보너스 ${(E.STAGE_BONUS*m.id).toLocaleString('ko-KR')}점</p></article>`).join('');
$('#level-table').innerHTML='<thead><tr><th>단계</th><th>바이러스</th><th>바이러스가 차는 줄</th></tr></thead><tbody>'+Array.from({length:STAGES},(_,i)=>`<tr><td>${i+1}</td><td>${E.virusCount(i+1)}</td><td>바닥에서 ${E.virusRows(i+1)}줄</td></tr>`).join('')+'</tbody>';

/* ---------- 동현랭 편집기(동현랭 시리즈와 같은 모양) ---------- */
for(const ex of examples){const o=document.createElement('option');o.value=ex.id;o.textContent=ex.title;$('#example').append(o);}
const DH_TOKEN=/(ㅋㅋ.*$)|(나는 동현이냐\?|동현이구나)|(오겡끼데스까)|(신중동역|신중동|뭉치)|(뿡뿡뿡|뿡뿡|포동이)|(꽥꽥)|(동+현아)|(동+현)|(도오*옹)|(ㅠ+)|(뚱띠|또치)/g;
const DH_CLS=[null,'t-cmt','t-frame','t-halt','t-ctl','t-out','t-in','t-assign','t-var','t-num','t-minus','t-op'];
function dhLine(line){let html='',last=0;line.replace(DH_TOKEN,(m,...gr)=>{const idx=gr[gr.length-2];html+=esc(line.slice(last,idx));const k=gr.slice(0,11).findIndex(x=>x!==undefined)+1;html+=`<span class="${DH_CLS[k]}">${esc(m)}</span>`;last=idx+m.length;return m;});return html+esc(line.slice(last));}
const code=$('#code'), area=document.createElement('div'), hl=document.createElement('div');
area.className='code-area'; hl.id='hl'; hl.setAttribute('aria-hidden','true'); code.parentNode.insertBefore(area,code); area.append(hl,code);
function hlSync(){hl.scrollTop=code.scrollTop;hl.scrollLeft=code.scrollLeft;}
function hlMetrics(){const cs=getComputedStyle(code);for(const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','lineHeight','tabSize','letterSpacing'])hl.style[p]=cs[p];}
function highlight(){hlMetrics();hl.innerHTML=code.value.split('\n').map(l=>`<span class="ln">${dhLine(l)||' '}</span>`).join('')+'<span class="ln"> </span>';hlSync();}
code.addEventListener('scroll',()=>{hlSync();$('#lines').scrollTop=code.scrollTop;});addEventListener('resize',()=>{highlight();fit();});
function indent(){
  const text=code.value,lines=text.split('\n'),lead=l=>l.length-l.replace(/^[ \t]+/,'').length;
  const next=lines.map(l=>{const b=l.slice(lead(l));if(!b)return '';if(b.startsWith('ㅋㅋ'))return '   '+b;const s=b.split('~')[0].replace(/ㅋㅋ.*$/,'').trim();return (s==='나는 동현이냐?'||s==='동현이구나'?'':'  ')+b;});
  const {selectionStart:a,selectionEnd:b,selectionDirection:dir,scrollTop:y,scrollLeft:x}=code;
  const moved=p=>{let o=0,n=0;for(let i=0;i<lines.length;i++){const L=lines[i].length;if(p<=o+L){const c=p-o,ol=lead(lines[i]),nl=lead(next[i]);return n+Math.min(next[i].length,c<ol?nl:c-ol+nl);}o+=L+1;n+=next[i].length+1;}return n;};
  const value=next.join('\n'),na=moved(a),nb=moved(b);if(value===text&&na===a&&nb===b)return;if(value!==text)code.value=value;code.setSelectionRange(na,nb,dir);code.scrollTop=y;code.scrollLeft=x;
}
function codeChanged(e){if(!e?.isComposing)indent();const n=code.value.split('\n').length;$('#line-count').textContent=n+'줄';$('#lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');highlight();autoPreview();}
code.addEventListener('compositionend',()=>codeChanged());
function codeLead(){const a=code.selectionStart,v=code.value,ls=v.lastIndexOf('\n',a-1)+1,le=v.indexOf('\n',ls);return {a,ls,lead:/^[ \t]*/.exec(v.slice(ls,le<0?v.length:le))[0].length};}
document.addEventListener('selectionchange',()=>{if(document.activeElement!==code||code.selectionStart!==code.selectionEnd)return;const {a,ls,lead}=codeLead();if(a-ls<lead)code.setSelectionRange(ls+lead,ls+lead);});
code.addEventListener('beforeinput',e=>{const {a,ls,lead}=codeLead();if(a!==code.selectionEnd)return;if(e.inputType==='deleteContentBackward'&&ls>0&&a>ls&&a-ls<=lead){e.preventDefault();code.setRangeText('',ls-1,a,'end');codeChanged();}});
code.oninput=codeChanged;
code.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();sortie();}});
function selectExample(){const ex=examples.find(e=>e.id===$('#example').value);code.value=ex.code;$('#example-note').textContent=ex.note;codeChanged();}
$('#example').onchange=selectExample;
$('#save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/plain;charset=utf-8'}));a.download='sortie.dh';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#open').onchange=async e=>{const f=e.target.files[0];if(!f)return;code.value=(await f.text()).replace(/\r/g,'').replace(/\n$/,'');codeChanged();e.target.value='';};
$('#run').onclick=()=>sortie();

/* ---------- 출전 규약: 첫 정수 속도(필수) · 둘째 바이러스 단계(선택) · 셋째 깔린 알약(선택) ---------- */
const DEFAULT={speed:1,stage:1,pre:0};
let cfg={...DEFAULT};
function parseSortie(out){
  const tok=out.split(/\s+/).filter(Boolean).map(Number), c={...DEFAULT}, err=[];
  if(tok.length===0){ return {c,go:false,err:[]}; }
  const [sp,st,pr]=tok;
  if(!(Number.isInteger(sp)&&sp>=1&&sp<=SPEEDS.length)) err.push(`첫 정수 ${sp}은(는) 속도 번호가 아니다. ${SPEEDS.map(x=>x.id+' '+x.name).join(' · ')} 중 하나를 출력하자.`);
  else c.speed=sp;
  if(!err.length&&tok.length>=2){ if(!(Number.isInteger(st)&&st>=1&&st<=STAGES)) err.push(`둘째 정수 ${st}은(는) 바이러스 단계가 아니다. 1~${STAGES}만 된다.`); else c.stage=st; }
  if(!err.length&&tok.length>=3){ if(!(Number.isInteger(pr)&&pr>=0&&pr<=9)) err.push(`셋째 정수 ${pr}은(는) 깔린 알약 수가 아니다. 0~9만 된다.`); else c.pre=pr; }
  if(!err.length&&tok.length>3) err.push(`정수가 ${tok.length}개 나왔다. 속도 · 바이러스 단계 · 깔린 알약 세 개까지만 읽는다.`);
  return {c,go:!err.length,err};
}
const speedOf=c=>SPEEDS[c.speed-1];
function sortieCard(c){
  const m=speedOf(c);
  $('#sortie-card').innerHTML=[['속도',`${m.id} · ${m.name}`],['바이러스 단계',`${c.stage} (바이러스 ${E.virusCount(c.stage)}) → ${STAGES}까지`],['깔린 알약',c.pre===0?'없음':`${c.pre} (홑알 ${c.pre*2})`],['조작','←→ 옮기기 · ↓ 내리기 · X·Z 돌리기 · 키보드·게임패드만']].map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');
  $('#stamp-mode').innerHTML=`${m.name} <span>속도</span>`;
}
function result(text,kind){ const r=$('#result'); r.textContent=text; r.dataset.kind=kind||''; }
function status(t,kind){ const s=$('#status'); s.textContent=t; s.dataset.kind=kind||''; }
let previewT=0;
function autoPreview(){ clearTimeout(previewT); previewT=setTimeout(()=>{ if(S) return; try{ const r=Donghyun.run(code.value,{maxSteps:300000}); const p=parseSortie(r.output); if(!p.err.length&&p.go){ cfg=p.c; sortieCard(cfg); preview(cfg); } }catch(e){} },250); }
function sortie(){
  if(S) return;
  let out;
  try{ const r=Donghyun.run(code.value,{maxSteps:300000}); out=r.output; }
  catch(e){ result(`동현랭 오류${e.line?` (${e.line}줄)`:''}: ${e.message}`,'error'); status('동현랭 오류','error'); return; }
  const p=parseSortie(out);
  if(p.err.length){ result('출전 규약 오류: '+p.err[0],'error'); status('출전 규약 오류','error'); return; }
  if(!p.go){ result('정수가 하나도 출력되지 않았다. 첫 정수로 속도 번호(1~3)를 출력해야 나선다.','error'); status('출전 규약 오류','error'); return; }
  cfg=p.c; sortieCard(cfg); preview(cfg);
  startGame(cfg);
}

/* ---------- 상태·화면 ---------- */
let S=null, previewS=null, mode='setup', paused=false, menu=null, T=0;
const keys={left:false,right:false,down:false};
function preview(c){ previewS=E.newGame({speed:c.speed,stage:c.stage,pre:c.pre,seed:1}); $('#day').textContent=`단계 ${c.stage} · ${speedOf(c).name}`; $('#tile-info').textContent=`${speedOf(c).name} 속도, 바이러스 단계 ${c.stage}부터. 바이러스 ${E.virusCount(c.stage)}를 모두 없애면 다음 단계로.`; fit(); }
function fit(){
  if(!canvas.width) return;
  const full=document.getElementById('stage-full');
  if(full&&full.classList.contains('fs')){
    const side=full.classList.contains('side'), cs=getComputedStyle(full), h=el=>el&&el.offsetHeight||0;
    let aw=full.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight), ah=full.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    if(side) aw-=2*190+20; else ah-=h(full.querySelector('.board-top'))+h(full.querySelector('.board-bottom'))+30;
    canvas.style.width=Math.max(120,Math.min(aw,ah*canvas.width/canvas.height))+'px'; canvas.style.margin='0 auto'; return; }
  const st=canvas.parentElement, w=st.clientWidth; if(!w) return;
  const maxH=Math.max(240,innerHeight-230), byH=maxH*canvas.width/canvas.height;
  canvas.style.width=Math.min(w,byH)+'px'; canvas.style.margin='0 auto';
}
let last=0, acc=0; const STEP=1000/60;
const fresh={}, release={}; /* 한 프레임 안에 눌렀다 뗀 키도 한 번은 먹도록 */
function tick(){ E.step(S,keys); for(const k in fresh) delete fresh[k]; for(const k in release){ keys[k]=false; delete release[k]; } events(); }
function frame(now){
  T++;
  if(S&&S.status==='play'&&!paused){
    if(!last) last=now; acc=Math.min(acc+(now-last),100); last=now;
    while(acc>=STEP){ tick(); acc-=STEP; }
  } else { last=now; acc=0; }
  if(S&&S.status!=='play'&&$('#result-card').hidden){ if(mode==='over') resultCard(S.status==='win'); else if(mode==='clear') clearCard(); }
  const s=S||previewS;
  if(s){ R.render(g,s,S?S.time:T); if(!S) previewOverlay(); if(S&&paused&&menu) drawPauseDim(); }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S&&mode==='play'&&!menu) mainMenu(); /* 다른 탭을 보는 동안 멈추고, 돌아오면 멈춤 메뉴가 떠 있다 */ });
requestAnimationFrame(frame);
function drawPauseDim(){ g.fillStyle='rgba(40,34,60,.35)'; g.fillRect(0,0,canvas.width,canvas.height); }
function previewOverlay(){ const m=speedOf(cfg);
  g.fillStyle='rgba(58,48,66,.84)'; g.fillRect(120,130,240,84); g.fillStyle='#fff'; g.font='bold 13px Pretendard, sans-serif'; g.textAlign='center'; g.textBaseline='top';
  g.fillText(`${m.id} · ${m.name}`,240,140); g.font='10px Pretendard, sans-serif'; g.fillText(m.desc.length>34?m.desc.slice(0,33)+'…':m.desc,240,160); g.fillText(`바이러스 단계 ${cfg.stage}(${E.virusCount(cfg.stage)}) · 깔린 알약 ${cfg.pre===0?'없음':cfg.pre*2}`,240,176);
  g.fillStyle='#f2b705'; g.fillText('출전을 누르면 시작한다',240,196); g.textAlign='left'; }

/* ---------- 사건 → 소리·기록 ---------- */
const SNDMAP={throw:'tick',rotate:'tick',lock:'pop',over:'lose',win:'win',clear:'cheer'};
function events(){
  const played={}; const once=k=>{ if(played[k]) return; played[k]=1; SND.play(k); };
  for(const ev of S.events){
    if(ev.t==='match'){ once(ev.viruses?'sparkle':'pop'); if(ev.viruses) log(`바이러스 ${ev.viruses} 지움${ev.chain>1?` (연쇄 ${ev.chain})`:''}. +${ev.gained.toLocaleString('ko-KR')}점. 남은 바이러스 ${S.viruses-ev.viruses}.`); else if(ev.chain>1) log(`알약 ${ev.pills}칸 연쇄로 지움.`); }
    else if(ev.t==='stage'){ if(S.time>0) once('zone'); }
    else if(SNDMAP[ev.t]) once(SNDMAP[ev.t]);
    if(ev.t==='clear') stageClear(ev);
    if(ev.t==='win') finish(true,ev);
    if(ev.t==='over') finish(false);
  }
  S.events.length=0; hud();
}
function log(html){ const li=document.createElement('li'); li.innerHTML=esc(html); const l=$('#log'); l.prepend(li); while(l.children.length>40) l.lastChild.remove(); }
function hud(){
  const m=E.speedOf(S);
  $('#mode-card').innerHTML=`<div class="form-now" style="--fc:#e0605a"><b>${m.name}</b><small>속도 ${m.id}</small><p>${m.desc}</p></div>`;
  $('#info-card').innerHTML=[['단계',`${S.stage} / ${STAGES}`],['바이러스',String(S.viruses)],['한 칸',`${E.framesPerDrop(S)}프레임`],['알약',String(S.pieces)],['점수',S.score.toLocaleString('ko-KR')],['시간',Math.floor(S.time/60)+'초']].map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');
  $('#turn-badge').textContent=`${m.name} · 단계 ${S.stage} · 바이러스 ${S.viruses}`; $('#turn-badge').className='';
}

/* ---------- 시작·종료 ---------- */
function liveUI(){ $('#setup-panel').hidden=true; $('#hud').hidden=false; $('#board-wrap').classList.add('live'); $('#full').disabled=false; fit(); $('#board-wrap').focus({preventScroll:true}); }
function startGame(c){
  S=E.newGame({speed:c.speed,stage:c.stage,pre:c.pre,seed:(Date.now()&0xffff)|1}); mode='play'; paused=false; closeMenu(); $('#result-card').hidden=true;
  liveUI(); $('#board-wrap').scrollIntoView({block:'nearest',behavior:reduced?'auto':'smooth'});
  $('#log').innerHTML=''; log(`${speedOf(c).name} 속도, 바이러스 단계 ${c.stage}(바이러스 ${S.viruses})에서 시작.${c.pre?` 깔린 알약 ${c.pre*2}.`:''}`);
  $('#day').textContent=`단계 ${c.stage} · ${speedOf(c).name}`; $('#tile-info').textContent=`바이러스 ${S.viruses}를 모두 없애면 다음 단계로. 같은 색 넷을 가로·세로로 잇자.`;
  $('#hint').innerHTML=HINT0; status('진행 중'); hud();
}
function stageClear(ev){
  mode='clear'; status('단계 '+S.stage+' 클리어'); resetKeys();
  log(`단계 ${S.stage} 클리어. 보너스 ${ev.bonus.toLocaleString('ko-KR')}점. 점수 ${S.score.toLocaleString('ko-KR')}.`);
  $('#hint').innerHTML='<span><kbd>X</kbd><kbd>↵</kbd>다음 단계로</span>';
}
function clearCard(){
  $('#result-card').innerHTML=`<div><h3 class="win">단계 ${S.stage} 클리어</h3><div class="rc-grid"><div><span>점수</span><strong>${S.score.toLocaleString('ko-KR')}</strong></div><div><span>알약</span><strong>${S.pieces}</strong></div><div><span>시간</span><strong>${Math.floor(S.time/60)}초</strong></div><div><span>다음 바이러스</span><strong>${E.virusCount(S.stage+1)}</strong></div></div><p>다음은 단계 ${S.stage+1}. 바이러스가 넷 는다. X 또는 Enter.</p><button type="button" id="rc-next">다음 단계로</button></div>`;
  $('#result-card').hidden=false; $('#rc-next').onclick=nextLevel;
}
function nextLevel(){
  if(!S||mode!=='clear') return;
  E.nextStage(S); mode='play'; paused=false; closeMenu(); $('#result-card').hidden=true; last=0;
  log(`단계 ${S.stage} 출발. 바이러스 ${S.viruses}.`);
  $('#day').textContent=`단계 ${S.stage} · ${E.speedOf(S).name}`;
  $('#hint').innerHTML=HINT0; status('진행 중'); hud(); $('#board-wrap').focus({preventScroll:true});
}
function backToSetup(){
  S=null; mode='setup'; paused=false; closeMenu(); $('#result-card').hidden=true;
  $('#setup-panel').hidden=false; $('#hud').hidden=true; $('#board-wrap').classList.remove('live'); exitFull(); $('#full').disabled=true;
  preview(cfg); status('출전 준비'); result('다시 나서려면 코드를 고치거나 그대로 출전을 누르자.'); $('#hint').innerHTML=HINT0; renderSlotList();
}
function finish(win,ev){
  mode='over'; status(win?'스무 단계 완료':'치료 실패',win?'':'error'); resetKeys();
  log(win?`단계 ${STAGES}까지 모두 마쳤다. 점수 ${S.score.toLocaleString('ko-KR')}.`:'치료 실패 · 약병 입구가 막혀 알약을 넣을 수 없다.'); $('#hint').innerHTML='<span><kbd>X</kbd><kbd>↵</kbd>출전 준비로</span>';
}
function resultCard(win){
  $('#result-card').innerHTML=`<div><h3 class="${win?'win':'lose'}">${win?'스무 단계를 모두 마쳤다':'치료 실패'}</h3><div class="rc-grid"><div><span>점수</span><strong>${S.score.toLocaleString('ko-KR')}</strong></div><div><span>마친 단계</span><strong>${S.stagesDone}</strong></div><div><span>남은 바이러스</span><strong>${S.viruses}</strong></div><div><span>시간</span><strong>${Math.floor(S.time/60)}초</strong></div></div><p>X 또는 Enter로 출전 준비로 돌아간다.</p><button type="button" id="rc-back">출전 준비로</button></div>`;
  $('#result-card').hidden=false; $('#rc-back').onclick=backToSetup;
}
$('#concede').onclick=()=>{ if(!S||mode==='over') return; confirmMenu('포기하고 출전 준비로 돌아갈까?',[['포기한다',backToSetup],['계속 간다',()=>{}]]); };
function resetKeys(){ keys.left=keys.right=keys.down=false; }

/* ---------- 메뉴(일시정지) ---------- */
function openMenu(title,items,onCancel){ paused=true; menu={title,items:items.map(it=>Array.isArray(it)?{label:it[0],fn:it[1]}:it),onCancel}; menu.i=Math.max(0,menu.items.findIndex(it=>!it.off)); drawMenu(); resetKeys(); }
function drawMenu(){ const m=$('#menu'); if(!menu){ m.hidden=true; return; } m.hidden=false; m.className='game-menu center'; m.innerHTML=(menu.title?`<h4>${esc(menu.title)}</h4>`:'')+menu.items.map((it,i)=>`<div class="mi ${i===menu.i?'sel':''} ${it.off?'off':''}" role="menuitem" data-i="${i}"><span>${esc(it.label)}</span>${it.note?`<small>${esc(it.note)}</small>`:''}</div>`).join(''); m.querySelectorAll('.mi').forEach(el=>el.onclick=e=>{e.stopPropagation();menu.i=+el.dataset.i;pick();}); m.querySelector('.sel')?.scrollIntoView({block:'nearest'}); }
function closeMenu(){ menu=null; $('#menu').hidden=true; paused=false; last=0; }
function cancelMenu(){ const c=menu&&menu.onCancel; closeMenu(); if(c) c(); }
function pick(){ const it=menu.items[menu.i]; if(!it||it.off) return; closeMenu(); it.fn(); }
function confirmMenu(q,opts,back){ openMenu(q,opts.map(([label,fn])=>({label,fn})),back); }
function mainMenu(){ openMenu('잠시 멈춤',[['계속 간다',()=>{}],['속도 설명',()=>{ const m=E.speedOf(S); openMenu(`${m.name}: ${m.desc}`,[['닫기',()=>{}]],mainMenu); }],['저장',saveMenu],['불러오기',loadMenu],['포기하고 출전 준비로',()=>confirmMenu('포기하고 출전 준비로 돌아갈까?',[['포기한다',backToSetup],['계속 간다',()=>{}]],mainMenu)]]); }

/* ---------- 저장·불러오기: 동현램과 같은 브라우저 칸 3개 + .dhsave 파일 ---------- */
const SAVE_FORMAT='donghyundoc-save', SAVE_VERSION=1, SLOT_KEY=n=>'donghyundoc:slot'+n, SLOTS=3;
function snapshot(){
  const state=JSON.parse(JSON.stringify(S,(k,v)=>k==='events'||k==='fx'?[]:v));
  const logs=[...$('#log').children].reverse().map(li=>li.textContent);
  return {format:SAVE_FORMAT,version:SAVE_VERSION,savedAt:new Date().toISOString(),summary:{stage:S.stage,speed:E.speedOf(S).name,viruses:S.viruses,score:S.score},state,logs};
}
const isCell=o=>o===0||(o&&typeof o==='object'&&Number.isInteger(o.c)&&o.c>=1&&o.c<=E.COLORS&&(o.kind==='virus'||o.kind==='pill')&&Number.isInteger(o.shape)&&o.shape>=0&&o.shape<=2&&[-1,0,1].includes(o.lx)&&[-1,0,1].includes(o.ly));
function restore(data){
  if(!data||data.format!==SAVE_FORMAT) throw new Error('동현닥 저장 파일이 아니다.');
  if(data.version!==SAVE_VERSION) throw new Error('지원하지 않는 저장 형식 버전이다('+data.version+').');
  const st=data.state;
  if(!st||!(Number.isInteger(st.stage)&&st.stage>=1&&st.stage<=STAGES)) throw new Error('단계 정보가 맞지 않는다.');
  if(!(Number.isInteger(st.speedI)&&SPEEDS[st.speedI])) throw new Error('속도 정보가 맞지 않는다.');
  if(!Array.isArray(st.cells)||st.cells.length!==E.GW*E.GH||!st.cells.every(isCell)) throw new Error('약병 정보가 맞지 않는다.');
  if(!(Number.isInteger(st.viruses)&&st.viruses===st.cells.filter(o=>o&&o.kind==='virus').length)) throw new Error('바이러스 수가 맞지 않는다.');
  if(!st.next||!Array.isArray(st.next.c)) throw new Error('다음 알약 정보가 맞지 않는다.');
  if(st.piece&&!(Number.isInteger(st.piece.x)&&Number.isInteger(st.piece.y)&&Number.isInteger(st.piece.rot))) throw new Error('알약 정보가 맞지 않는다.');
  if(st.status!=='play') throw new Error('이미 끝난 판이다.');
  st.events=[]; st.fx=[]; st.msgT=0; st.rs=st.rs>>>0; st.marks=Array.isArray(st.marks)?st.marks:[];
  closeMenu(); $('#result-card').hidden=true;
  S=st; mode='play'; cfg={speed:SPEEDS[S.speedI].id,stage:S.stage,pre:S.pre|0};
  liveUI(); $('#day').textContent=`단계 ${S.stage} · ${E.speedOf(S).name}`;
  const l=$('#log'); l.innerHTML=''; for(const t of (data.logs||[]).slice(-39)) log(String(t).replace(/<[^>]*>/g,''));
  log('저장한 판을 불러왔다.'); $('#hint').innerHTML=HINT0; status('진행 중'); hud();
}
function readSlot(n){ try{ const t=localStorage.getItem(SLOT_KEY(n)); return t?JSON.parse(t):null; }catch(e){ return null; } }
function slotNote(d){ if(!d) return '비어 있음'; const t=new Date(d.savedAt); const pad=v=>String(v).padStart(2,'0'); return `단계 ${d.summary.stage} ${d.summary.speed} · 바이러스 ${d.summary.viruses} · ${t.getMonth()+1}/${t.getDate()} ${pad(t.getHours())}:${pad(t.getMinutes())}`; }
function toast(t){ log(t); status(t); }
function saveToSlot(n){ try{ localStorage.setItem(SLOT_KEY(n),JSON.stringify(snapshot())); toast(`브라우저 칸 ${n}에 저장했다.`); renderSlotList(); } catch(e){ toast('브라우저 저장에 실패했다. 파일로 내려받아 저장하자.'); } }
function deleteSlot(n){ try{ localStorage.removeItem(SLOT_KEY(n)); }catch(e){} renderSlotList(); }
function saveToFile(){ const d=snapshot(), a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'})); a.download=`donghyundoc-stage${d.summary.stage}-${d.summary.score}.dhsave`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast('저장 파일을 내려받았다.'); }
function saveMenu(){
  const items=[];
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),fn:()=>{ if(d) confirmMenu(`칸 ${n}에 덮어쓸까?`,[['덮어쓴다',()=>saveToSlot(n)],['그만둔다',saveMenu]],saveMenu); else saveToSlot(n); }}); }
  items.push({label:'파일로 내려받기',note:'.dhsave',fn:saveToFile});
  items.push({label:'브라우저 칸 지우기',note:'',off:!Array.from({length:SLOTS},(_,i)=>readSlot(i+1)).some(Boolean),fn:deleteMenu});
  openMenu('저장',items,mainMenu);
}
function deleteMenu(){
  const items=[];
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),off:!d,fn:()=>confirmMenu(`칸 ${n}${n===2?'를':'을'} 지울까? 되돌릴 수 없다.`,[['지운다',()=>{ deleteSlot(n); toast(`브라우저 칸 ${n}${n===2?'를':'을'} 지웠다.`); deleteMenu(); }],['그만둔다',deleteMenu]],deleteMenu)}); }
  openMenu('지울 칸',items,saveMenu);
}
function loadFrom(d){ try{ restore(d); }catch(e){ const msg='불러오기 실패: '+e.message; if(S){ toast(msg); } else { result(msg,'error'); status('불러오기 실패','error'); } } }
function loadMenu(){
  const items=[];
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),off:!d,fn:()=>confirmMenu('지금 판을 버리고 불러올까?',[['불러온다',()=>loadFrom(readSlot(n))],['그만둔다',loadMenu]],loadMenu)}); }
  items.push({label:'파일에서 불러오기',note:'.dhsave',fn:()=>$('#load-file').click()});
  openMenu('불러오기',items,mainMenu);
}
$('#load-file').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; try{ loadFrom(JSON.parse(await f.text())); }catch(err){ loadFrom(null); } };
$('#load-file-setup').onchange=$('#load-file').onchange;
document.querySelector('.load-head label').addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#load-file-setup').click(); } });
function renderSlotList(){
  const box=$('#slot-list'); box.innerHTML='';
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); const b=document.createElement('button'); b.className='slot-btn'; b.disabled=!d;
    b.innerHTML=`<b>칸 ${n}</b><span>${esc(slotNote(d))}</span>${d?`<small>${Number(d.summary.score).toLocaleString('ko-KR')}점</small>`:''}`;
    b.onclick=()=>loadFrom(readSlot(n));
    const row=document.createElement('div'); row.className='slot-row'; row.append(b);
    if(d){ const x=document.createElement('button'); x.className='slot-del'; x.type='button'; x.textContent='지우기'; x.setAttribute('aria-label',`칸 ${n} 지우기`);
      let t=0; x.onclick=()=>{ if(!x.classList.contains('armed')){ x.classList.add('armed'); x.textContent='정말 지운다'; t=setTimeout(()=>{ x.classList.remove('armed'); x.textContent='지우기'; },4000); return; } clearTimeout(t); deleteSlot(n); status(`브라우저 칸 ${n}${n===2?'를':'을'} 지웠다.`); };
      row.append(x); }
    box.append(row); }
}

/* ---------- 키보드: 동현큐·동현램과 같은 배치(X·Z·A·Enter) ---------- */
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyX:'x',KeyZ:'z',KeyS:'s',KeyA:'a',Enter:'enter',NumpadEnter:'enter',Space:'x'};
function keyOf(e){ return KEYMAP[e.code]||({x:'x',z:'z',s:'s',a:'a',X:'x',Z:'z',S:'s',A:'a',Enter:'enter',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'})[e.key]||null; }
document.addEventListener('keydown',e=>{
  if(!S||tab!=='play') return;
  const el=document.activeElement; if(el&&(el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.tagName==='INPUT')) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const k=keyOf(e); if(!k) return; e.preventDefault(); if(e.repeat) return; keyDown(k);
});
document.addEventListener('keyup',e=>{ const k=keyOf(e); if(!k) return; keyUp(k); });
GP.start({hint:'A·↑ 시계 · B 반시계 돌리기 · Y 설명 · + 메뉴',status:t=>status(t),
  down(k){ if(!S||tab!=='play') return; keyDown(k); }, up(k){ if(!S) return; keyUp(k); }});
function keyDown(k){
  if(!S) return;
  if(mode==='over'){ if(k==='x'||k==='enter'||k==='z') backToSetup(); return; }
  if(mode==='clear'){ if(k==='x'||k==='enter') nextLevel(); return; }
  if(menu){ if(k==='up'||k==='down'){ const n=menu.items.length; menu.i=(menu.i+(k==='up'?-1:1)+n)%n; drawMenu(); } else if(k==='x'||k==='enter'){ pick(); } else if(k==='z'){ cancelMenu(); } return; }
  if(/^(left|right|down)$/.test(k)){ if(!keys[k]) fresh[k]=1; keys[k]=true; }
  else if(k==='x'||k==='up'){ E.rotate(S,1); } /* ↑는 X와 같은 시계 방향 돌리기(v0.03) */
  else if(k==='z'){ E.rotate(S,-1); }
  else if(k==='a'){ const m=E.speedOf(S); S.msg=`${m.name}: ${m.desc}`; S.msgT=200; }
  else if(k==='enter') mainMenu();
}
function keyUp(k){ if(/^(left|right|down)$/.test(k)){ if(fresh[k]) release[k]=1; else keys[k]=false; } }
addEventListener('blur',()=>{ resetKeys(); });
canvas.addEventListener('pointerdown',e=>{ if(!S) return; e.preventDefault(); if(mode==='over'){ backToSetup(); } else if(mode==='clear'){ nextLevel(); } else $('#board-wrap').focus({preventScroll:true}); }); /* 화면을 찍어도 조작은 되지 않는다. 결과 카드만 넘긴다 */
$('#result-card').addEventListener('pointerdown',e=>{ if(e.target.tagName==='BUTTON') return; if(mode==='clear') nextLevel(); else if(mode==='over') backToSetup(); });

/* ---------- 시험용 연결 ---------- */
window.render_game_to_text=()=>JSON.stringify(S?{mode,paused,stage:S.stage,status:S.status,phase:S.phase,viruses:S.viruses,score:S.score,pieces:S.pieces,
  piece:S.piece?{x:S.piece.x,y:S.piece.y,rot:S.piece.rot,c:S.piece.c,shape:S.piece.shape}:null,next:S.next,cells:S.cells.map(o=>o?(o.kind==='virus'?'v':'p')+o.c:'.').join('')}:{mode:'setup',cfg});
window.__donghyundoc={get state(){return S;},snd:SND,snapshot,restore,readSlot,saveToSlot,keyDown,keyUp,keys,get mode(){return mode;},start:()=>startGame(cfg),nextLevel,parseSortie,
  step:(n=1)=>{for(let i=0;i<n;i++){if(S.status!=='play')break;tick();}}};
selectExample(); sortieCard(cfg); preview(cfg); renderSlotList();
/* ---------- 전체 화면(동현램과 같은 규칙) ---------- */
const stageFull=$('#stage-full');
const fullEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const canNativeFull=!!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(stageFull.requestFullscreen||stageFull.webkitRequestFullscreen));
const isPseudo=()=>stageFull.classList.contains('pseudo-full');
const isFull=()=>fullEl()===stageFull||isPseudo();
const SIDE_MQ=matchMedia('(orientation: landscape) and (pointer: coarse)');
function setPseudo(on){ stageFull.classList.toggle('pseudo-full',on); document.documentElement.classList.toggle('pseudo-full-on',on); onFull(); }
function exitFull(){ if(isPseudo()) return setPseudo(false); if(fullEl()===stageFull) (document.exitFullscreen||document.webkitExitFullscreen||(()=>{})).call(document); }
let hintTimer=0;
function onFull(){ const on=isFull(); stageFull.classList.toggle('fs',on); stageFull.classList.toggle('side',on&&SIDE_MQ.matches);
  $('#exit-full').hidden=!on; $('#full').textContent=on?'전체 화면 닫기':'전체 화면';
  clearTimeout(hintTimer); $('#full-hint').hidden=!on; if(on) hintTimer=setTimeout(()=>$('#full-hint').hidden=true,5000);
  fit(); setTimeout(fit,60); if(on) $('#full').blur(); if(S) hud(); }
document.addEventListener('fullscreenchange',onFull); document.addEventListener('webkitfullscreenchange',onFull);
SIDE_MQ.addEventListener?SIDE_MQ.addEventListener('change',onFull):SIDE_MQ.addListener(onFull);
$('#exit-full').onclick=exitFull;
$('#full').onclick=()=>{ if(isFull()) return exitFull(); if(!S) return;
  if(!canNativeFull) return setPseudo(true);
  try{ const r=stageFull.requestFullscreen?stageFull.requestFullscreen():stageFull.webkitRequestFullscreen();
    if(r&&r.catch) r.catch(()=>setPseudo(true)); }catch(e){ setPseudo(true); } };
})();
