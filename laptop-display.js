// Draw the desktop at its native resolution. All details land on whole pixels.
export function paintWallpaper(canvas) {
  const ctx = canvas.getContext('2d');
  const {width:w,height:h} = canvas;
  const palette = ['#161b1c','#252c2b','#323a35','#424b40','#535c4d','#646d59'];
  const dots = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const moonX=258, moonY=56;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const distance=Math.hypot(x-moonX,y-moonY);
      const glow=Math.max(0,1-distance/100);
      const mist=.17*Math.sin(x*.04+y*.16)+.13*Math.sin(x*.012-y*.33);
      let tone=.55+glow*2.7+y/h*1.35+mist;
      if(distance<13) tone=4.85+mist;
      const level=Math.floor(tone+dots[(y%4)*4+x%4]/16);
      ctx.fillStyle=palette[Math.min(level,palette.length-1)];
      ctx.fillRect(x,y,1,1);
    }
  }
  const hill=(x,layer)=>Math.floor(102+layer*18+Math.sin(x*.028+layer)*9+
    Math.cos(x*.057+layer*3)*4+Math.sin(x*.012-layer)*14);
  let seed=392;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  for(let layer=0;layer<3;layer++){
    ctx.fillStyle=['#394139','#272f2b','#141b19'][layer];
    for(let x=0;x<w;x++){
      const y=hill(x,layer);
      ctx.fillRect(x,y,1,h-y);
      if(rand()<.16){
        const height=3+Math.floor(rand()*6)+layer*2;
        for(let j=0;j<height;j++){
          const half=Math.floor(j*.23);
          ctx.fillRect(x-half,y-height+j,half*2+1,1);
        }
      }
    }
  }
  const x=242, y=hill(x,2)-2;
  ctx.fillStyle='#101513';
  ctx.fillRect(x,y-16,26,20);
  ctx.fillRect(x+19,y-27,3,12);
  for(let i=0;i<10;i++) ctx.fillRect(x+10-i,y-26+i,7+i*2,1);
  ctx.fillStyle='#bdab79';
  ctx.fillRect(x+16,y-13,2,4);
  ctx.fillRect(x+19,y-13,2,4);
}

// Eight-bit rows keep the four monochrome glyphs crisp at every scale.
const glyphs=[
  [0,255,195,165,153,129,255,0],
  [96,240,208,96,48,27,15,6],
  [254,130,186,130,178,130,254,0],
  [0,102,153,153,153,153,255,24],
  [0,48,126,195,165,165,195,126]
];
export function paintIcon(canvas,index){
  canvas.width=canvas.height=10;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#cfcca4';
  glyphs[index].forEach((row,y)=>{
    for(let x=0;x<8;x++) if(row & (128>>x)) ctx.fillRect(x+1,y+1,1,1);
  });
}
