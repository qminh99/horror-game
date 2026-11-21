import { cellar } from './cellar-layout.js';
import { stairOpening, house, yard, entrance, kitchenDoorway, livingDoorway } from './ground-floor.js';

export function createMinimap(canvas) {
  const ctx=canvas.getContext('2d');
  const {width,height}=canvas;
  const ink='#91a89a', room='#33433f';
  const walls=[], gaps=[];
  function area(x,z,w,d,color=room,solid=true){
    if(solid) walls.push([x,z,x+w,z],[x,z+d,x+w,z+d],[x,z,x,z+d],[x+w,z,x+w,z+d]);
    ctx.fillStyle=color;
    ctx.fillRect(x,z,w,d);
    ctx.strokeStyle=ink;
    ctx.strokeRect(x,z,w,d);
  }
  function opening(x,z,w,d,open=true){
    if(!open) return;
    gaps.push([x,z,x+w,z+d]);
    ctx.fillStyle=room;
    ctx.fillRect(x,z,w,d);
  }
  function stairs(left,right,top,bottom){
    area(left,top,right-left,bottom-top,'#485347',false);
    ctx.fillStyle='#84947e';
    for(let z=top+.35;z<bottom;z+=.6) ctx.fillRect(left+.08,z,right-left-.16,.08);
  }
  // Fit the whole floor so the player can see both their movement and destination.
  return function draw(position,yaw,level,halfFov,doors){
    walls.length=0;
    gaps.length=0;
    const upper=level==='Tầng hai', basement=level==='Tầng hầm';
    const bounds=upper ? [-4.5,-3.55,19.5,5.5] : basement
      ? [cellar.right-13,cellar.top,cellar.right,cellar.top+10]
      : [yard.left,3.43,yard.right,yard.end];
    const [west,north,east,south]=bounds;
    const scale=Math.min((width-28)/(east-west),(height-24)/(south-north));
    ctx.resetTransform();
    ctx.clearRect(0,0,width,height);
    ctx.translate(width/2,height/2);
    ctx.scale(scale,scale);
    ctx.translate(-(west+east)/2,-(north+south)/2);
    ctx.lineWidth=1.8/scale;
    if(upper){
      area(-4.5,-3.55,8.96,7.05);
      area(4.46,.34,6.66,3.12);
      area(11.12,-1.7,8.38,7.1);
      area(7.2,-2.75,3.84,3.09);
      stairs(stairOpening.left,stairOpening.right,3.46,5.45);
      opening(4.34,1.42,.24,.96,doors.bedroom);
      opening(11,1.42,.24,.96,doors.guest);
      opening(7.52,.21,.96,.26,doors.bathroom);
      opening(stairOpening.left,3.32,stairOpening.right-stairOpening.left,.28);
    }else if(basement){
      area(west,north,13,10);
      for(const [x,w] of [[0,2],[4,4],[10,3]]) area(west+x,north+7.5,w,.15);
      stairs(cellar.left,cellar.right,cellar.firstStep,cellar.foot);
    }else{
      area(yard.left,house.front,yard.right-yard.left,yard.end-house.front,'#24372f');
      for(const [left,right,back] of [[house.west,house.kitchenWall,house.back],
        [house.kitchenWall,house.livingWall,9.56],[house.livingWall,house.east,house.back]]){
        area(left,back,right-left,house.front-back);
      }
      for(const [x,door] of [[house.kitchenWall,kitchenDoorway],[house.livingWall,livingDoorway]]){
        opening(x-.16,door.start,.32,door.end-door.start);
      }
      opening(entrance.left,house.front-.16,entrance.right-entrance.left,.32,doors.front);
      opening(stairOpening.left,9.4,stairOpening.right-stairOpening.left,.32);
      walls.push([stairOpening.left,3.43,stairOpening.left,9.56],[stairOpening.right,3.43,stairOpening.right,9.56]);
      stairs(stairOpening.left,stairOpening.right,3.43,9.56);
      area(cellar.left,cellar.top,cellar.right-cellar.left,cellar.coverEnd-cellar.top,'#65543e',false);
    }
    // Intersect each sight line with the walls of the displayed floor plan.
    const range=6;
    ctx.beginPath();
    ctx.moveTo(position.x,position.z);
    for(let i=0;i<=64;i++){
      const angle=yaw-halfFov+2*halfFov*i/64;
      const dx=-Math.sin(angle), dz=-Math.cos(angle);
      let distance=range;
      for(const [x1,z1,x2,z2] of walls){
        const vertical=x1===x2;
        const direction=vertical ? dx : dz;
        if(Math.abs(direction)<1e-8) continue;
        const t=(vertical ? x1-position.x : z1-position.z)/direction;
        if(t<=0 || t>=distance) continue;
        const x=position.x+t*dx, z=position.z+t*dz;
        if(vertical ? z<z1 || z>z2 : x<x1 || x>x2) continue;
        if(!gaps.some(([l,n,r,s])=>x>=l && x<=r && z>=n && z<=s)) distance=t;
      }
      ctx.lineTo(position.x+dx*distance,position.z+dz*distance);
    }
    ctx.closePath();
    const glow=ctx.createRadialGradient(position.x,position.z,0,position.x,position.z,range);
    glow.addColorStop(0,'rgba(255,220,128,.55)');
    glow.addColorStop(1,'rgba(255,220,128,.17)');
    ctx.fillStyle=glow;
    ctx.fill();
    ctx.translate(position.x,position.z);
    ctx.rotate(-yaw);
    ctx.scale(1/scale,1/scale);
    ctx.beginPath();
    ctx.moveTo(0,-10);ctx.lineTo(7,7);ctx.lineTo(0,4);ctx.lineTo(-7,7);ctx.closePath();
    ctx.fillStyle='#ffd28a';ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle='#17211b';ctx.stroke();
  };
}
