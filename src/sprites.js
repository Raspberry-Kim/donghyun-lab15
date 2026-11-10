/* 동현닥 그림: 바이러스 얼굴 셋과 동현크의 포동이 원본 도트(24×20). */
(function(){
const VIRUS={"red": ["..k.k.k..", ".kbkbkbk.", "kbbbbbbbk", "kbwkbwkbk", "kbbbbbbbk", "kbkkbkkbk", ".kbbbbbk.", "..kkkkk..", "........."], "red2": ["..k.k.k..", ".kbkbkbk.", "kbbbbbbbk", "kbkwbkwbk", "kbbbbbbbk", "kbkkbkkbk", ".kbbbbbk.", "..kkkkk..", "........."], "blue": [".........", "..kkkkk..", ".kbbbbbk.", "kbbbbbbbk", "kbkkbkkbk", "kbbbbbbbk", "kbbkkkbbk", ".kbbbbbk.", "..kkkkk.."], "blue2": [".........", "..kkkkk..", ".kbbbbbk.", "kbbbbbbbk", "kbkkbkkbk", "kbbbbbbbk", "kbbbkbbbk", ".kbbbbbk.", "..kkkkk.."], "yellow": ["..kkkkk..", ".kbbbbbk.", "kbwwbwwbk", "kbwkbwkbk", "kbbbbbbbk", "kbkkkkkbk", ".kbbrrbk.", "..kkrkk..", "....k...."], "yellow2": ["..kkkkk..", ".kbbbbbk.", "kbwwbwwbk", "kbkwbkwbk", "kbbbbbbbk", "kbkkkkkbk", ".kbbrrbk.", "..kkrkk..", "....k...."]};
const COL={1:{b:'#e0605a',d:'#9c3a38',r:'#f7a8a0'},2:{b:'#5b8fd6',d:'#355b93',r:'#f7a8a0'},3:{b:'#e9c04a',d:'#9d7a1c',r:'#ef7f7a'}};
const NAME={1:'red',2:'blue',3:'yellow'};
const cache={};
function face(c,frame,scale){ const key=c+':'+frame+':'+scale; if(cache[key]) return cache[key];
  const rows=VIRUS[NAME[c]+(frame?'2':'')], cv=document.createElement('canvas'); cv.width=9*scale; cv.height=9*scale; const g=cv.getContext('2d');
  const pal={k:'#3a3042',b:COL[c].b,d:COL[c].d,w:'#ffffff',r:COL[c].r};
  rows.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch==='.') return; g.fillStyle=pal[ch]; g.fillRect(x*scale,y*scale,scale,scale); }));
  cache[key]=cv; return cv; }
const PODONG_ROWS=`..............KKKKKK....
............KKWWWWWWKK..
...........KKWWWWWWWWK..
.KKK......KWWKWWWWWWWKK.
KWWWK.....KWWKEKKWEKKWWK
KWWWK.....KWWKKKKWKKKWWK
.KWWK......KKWKKKWKKKKK.
..KWK......KWWWWWWWWWWK.
...KKKKKKKKKWWWWWKKWWWK.
...KWWWWWWWKWWWWWKKWWWK.
..KWWWWWWWWWKKWWWWWWKK..
..KWWWWWWWKRRWKKKKKK....
..KWWWWWWWKRRRWWWK......
..KWWWWWWWWKKRRWWK......
...KWWWWWWWWWKKWK.......
..KWWWKKKKWWWKKKK.......
..KWWWKGGKWWWKGGK.......
..KGGGKGGKGGGKGGK.......
..KKKKKKKKKKKKKKK.......
........................`.split('\n');
const PODONG_PAL={W:'#f6ecd6',G:'#c9aa78',K:'#2e2a38',R:'#d6403a',E:'#ffffff'};
window.Sprites={VIRUS,COL,face,PODONG_ROWS,PODONG_PAL};
})();
