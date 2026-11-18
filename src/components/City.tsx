'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type {Facility} from '@/modules/enterprise/types';
import {INDUSTRIES} from '@/modules/enterprise/registry';
import type { Company, Tile } from '@/modules/simulation/types';
export interface CityControls { zoom: (amount:number)=>void; center:()=>void }
interface Props { tiles:Tile[]; company?:Company;facilities?:Facility[]; selected:number|null; onSelect:(id:number)=>void; ambient?:boolean }
const City=forwardRef<CityControls,Props>(function City({tiles,company,facilities=[],selected,onSelect,ambient},ref){
  const host=useRef<HTMLDivElement>(null);
  const bridge=useRef<{ redraw:()=>void; zoom:(n:number)=>void; center:()=>void }|null>(null);
  const latest=useRef({tiles,company,facilities,selected,onSelect});
  useEffect(()=>{latest.current={tiles,company,facilities,selected,onSelect};bridge.current?.redraw();},[tiles,company,facilities,selected,onSelect]);
  useImperativeHandle(ref,()=>({zoom:n=>bridge.current?.zoom(n),center:()=>bridge.current?.center()}),[]);
  useEffect(()=>{
    let disposed=false;let game:import('phaser').Game|undefined;let observer:ResizeObserver|undefined;
    void import('phaser').then(({default:P})=>{
      if(disposed||!host.current)return;
      class World extends P.Scene {
        drawn:import('phaser').GameObjects.GameObject[]=[];
        start={x:0,y:0,scrollX:0,scrollY:0};dragged=false;pinch=0;pinchZoom=1;
        create(){
          this.cameras.main.setBackgroundColor('#0b1826');
          this.cameras.main.setZoom(ambient?0.95:0.95);this.center();this.redraw();
          this.input.addPointer(1);
          this.input.on('pointerdown',(p:import('phaser').Input.Pointer)=>{
            this.start={x:p.x,y:p.y,scrollX:this.cameras.main.scrollX,scrollY:this.cameras.main.scrollY};this.dragged=false;
            const a=this.input.pointer1,b=this.input.pointer2;if(a.isDown&&b.isDown){this.pinch=P.Math.Distance.Between(a.x,a.y,b.x,b.y);this.pinchZoom=this.cameras.main.zoom;}
          });
          this.input.on('pointermove',(p:import('phaser').Input.Pointer)=>{
            if(!p.isDown)return;
            const a=this.input.pointer1,b=this.input.pointer2;
            if(a.isDown&&b.isDown&&this.pinch>0){this.cameras.main.setZoom(P.Math.Clamp(this.pinchZoom*P.Math.Distance.Between(a.x,a.y,b.x,b.y)/this.pinch,0.4,2));this.dragged=true;return;}
            const dx=p.x-this.start.x,dy=p.y-this.start.y;
            if(Math.abs(dx)+Math.abs(dy)>6)this.dragged=true;
            this.cameras.main.scrollX=this.start.scrollX-dx/this.cameras.main.zoom;
            this.cameras.main.scrollY=this.start.scrollY-dy/this.cameras.main.zoom;
          });
          this.input.on('pointerup',(p:import('phaser').Input.Pointer)=>{
            this.pinch=0;if(this.dragged||ambient)return;
            const w=this.cameras.main.getWorldPoint(p.x,p.y);const x=Math.round(w.x/64+w.y/32),y=Math.round(w.y/32-w.x/64);
            if(x>=0&&x<20&&y>=0&&y<20)latest.current.onSelect(y*20+x);
          });
          this.input.on('wheel',(_p:unknown,_o:unknown,_x:number,y:number)=>this.zoom(y>0?-0.1:0.1));
          bridge.current={redraw:()=>this.redraw(),zoom:n=>this.zoom(n),center:()=>this.center()};
        }
        zoom(n:number){this.cameras.main.setZoom(P.Math.Clamp(this.cameras.main.zoom+n,0.4,2));}
        center(){this.cameras.main.centerOn(0,285);}
        redraw(){
          this.drawn.forEach(o=>o.destroy());this.drawn=[];
          const g=this.add.graphics();this.drawn.push(g);
          const {tiles,company,facilities,selected}=latest.current;
          const poly=(pts:number[],color:number,alpha=1)=>{g.fillStyle(color,alpha);g.fillPoints(pts.reduce((v,n,i)=>{if(i%2===0)v.push(new P.Geom.Point(n,pts[i+1]));return v;},[] as import('phaser').Geom.Point[]),true);};
          const cube=(cx:number,cy:number,w:number,h:number,color:number,roof:number)=>{
            poly([cx-w,cy,cx,cy+w/2,cx,cy+w/2-h,cx-w,cy-h],color);
            poly([cx,cy+w/2,cx+w,cy,cx+w,cy-h,cx,cy+w/2-h],P.Display.Color.IntegerToColor(color).darken(25).color);
            poly([cx-w,cy-h,cx,cy-w/2-h,cx+w,cy-h,cx,cy+w/2-h],roof);
          };
          for(const t of [...tiles].sort((a,b)=>(a.x+a.y)-(b.x+b.y))){
            const x=(t.x-t.y)*32,y=(t.x+t.y)*16,branch=facilities.find(f=>f.tileId===t.id),owned=company?.tileId===t.id||!!branch;
            const base=t.kind==='road'?0x152535:t.kind==='park'?0x16362f:0x223b47;
            poly([x,y-15,x+30,y,x,y+15,x-30,y],owned?0x125b57:base);
            g.lineStyle(1,0x5a7385,0.12);g.strokePoints([new P.Geom.Point(x,y-15),new P.Geom.Point(x+30,y),new P.Geom.Point(x,y+15),new P.Geom.Point(x-30,y)],true);
            if(t.kind==='road'){
              g.lineStyle(1,0x648397,0.35);
              if(t.x%5===0)g.lineBetween(x-9,y+4,x+9,y-4);if(t.y%5===0)g.lineBetween(x-9,y-4,x+9,y+4);
              if((t.id%37)===0){cube(x,y,4,3,0xa77d44,0xe5b45a);}
            }else if(branch){
              const color=parseInt(INDUSTRIES[branch.industry].color.slice(1),16),height=branch.kind==='warehouse'?20:branch.industry==='hotel'?62:branch.industry==='fuel'?16:branch.industry==='factory'?30:28;
              cube(x,y-2,25,height,branch.open?color:0x3e5966,color);
              if(branch.industry==='factory'){cube(x-10,y-height-3,5,18,0x45596a,0x8d9ba3);cube(x+10,y-height-3,5,12,0x45596a,0x8d9ba3);}
              if(branch.industry==='fuel'){cube(x,y-23,27,4,0x8c5937,color);cube(x-9,y+3,3,9,0xe5b45a,0xe5b45a);}
              if(branch.industry==='logistics'||branch.kind==='warehouse'){g.fillStyle(0x101e29);g.fillRect(x-15,y-14,12,12);g.fillRect(x+4,y-14,12,12);}
              if(branch.industry==='restaurant'){g.fillStyle(0xf2dfb6);g.fillRect(x-18,y-17,36,4);}
              if(branch.industry==='hotel')for(let n=0;n<4;n++){g.fillStyle(0xbce9e6);g.fillRect(x-14,y-height+8+n*10,8,5);g.fillRect(x+5,y-height+8+n*10,8,5);}
              if(selected===t.id){const label=this.add.text(x,y-height-18,branch.name,{fontFamily:'Arial',fontSize:'10px',color:'#eef7f6',backgroundColor:'#162e3b',padding:{x:6,y:4}}).setOrigin(.5);this.drawn.push(label);}
            }else if(owned&&company?.built){
              cube(x,y-2,26,35,company.open?0x168779:0x32586b,company.open?0x6dd1bb:0x557589);
              cube(x-3,y-38,17,5,0x183a43,0x43656d);
              g.fillStyle(company.open?0xe5b45a:0x7294a5);g.fillRect(x-16,y-25,11,8);g.fillRect(x+4,y-25,10,8);
              g.fillStyle(0xf5f7fa);g.fillRect(x-19,y-14,39,4);
              const label=this.add.text(x,y-63,'TU TIENDA',{fontFamily:'Arial',fontSize:'9px',fontStyle:'bold',color:'#f3e0b2',backgroundColor:'#163d40',padding:{x:6,y:4}}).setOrigin(.5);this.drawn.push(label);
            }else if(t.kind==='available'){
              g.lineStyle(1,owned?0x19c4b5:0x699890,0.8);g.strokePoints([new P.Geom.Point(x,y-11),new P.Geom.Point(x+23,y),new P.Geom.Point(x,y+11),new P.Geom.Point(x-23,y)],true);
              g.lineStyle(1,0x7fb3a5,0.65);g.lineBetween(x-4,y,x+4,y);g.lineBetween(x,y-4,x,y+4);
            }else if(t.kind==='park'){
              for(let n=0;n<3;n++){const tx=x-11+n*10,ty=y+(n%2)*7;g.fillStyle(0x273c30);g.fillRect(tx-1,ty-11,3,13);g.fillStyle(n%2?0x2e6855:0x3b7d60);g.fillCircle(tx,ty-13,7);g.fillStyle(0x6b9d73,.45);g.fillCircle(tx-2,ty-16,4);}
            }else{
              const h=t.kind==='commercial'?35+(t.id%4)*18:t.kind==='industrial'?18:20+(t.id%3)*8;
              const color=t.kind==='industrial'?0x4b5156:t.kind==='commercial'?0x32576b:0x546674;
              cube(x,y-2,t.kind==='industrial'?25:20,h,color,t.kind==='industrial'?0x697275:0x6c8896);
              if(t.kind==='commercial'){cube(x+2,y-h-4,12,5,0x28485d,0x7d98a4);}
              for(let level=0;level<Math.floor(h/11)-1;level++){
                g.fillStyle((t.id+level)%3===0?0xe5b45a:0x8cbbc9,0.7);
                for(let win=0;win<3;win++){g.fillRect(x-16+win*5,y-h+8+level*10+win*2,3,5);g.fillRect(x+3+win*5,y-h+12+level*10-win*2,3,5);}
              }
            }
            if(t.id===selected){g.lineStyle(2,0xe5b45a);g.strokePoints([new P.Geom.Point(x,y-16),new P.Geom.Point(x+32,y),new P.Geom.Point(x,y+16),new P.Geom.Point(x-32,y)],true);}
          }
        }
      }
      game=new P.Game({type:P.AUTO,parent:host.current,width:host.current.clientWidth,height:host.current.clientHeight,backgroundColor:'#0b1826',antialias:true,scene:World,render:{pixelArt:false,roundPixels:true},input:{touch:{capture:true},mouse:{preventDefaultWheel:true}},scale:{mode:P.Scale.RESIZE,autoCenter:P.Scale.CENTER_BOTH},fps:{target:30,forceSetTimeOut:true}});
      observer=new ResizeObserver(()=>{if(host.current)game?.scale.resize(host.current.clientWidth,host.current.clientHeight);});observer.observe(host.current);
    });
    return()=>{disposed=true;observer?.disconnect();bridge.current=null;game?.destroy(true);};
  },[ambient]);
  return <div ref={host} className="city-canvas" role="img" aria-label="Ciudad isométrica de 20 por 20 parcelas. Arrastra para moverte. Usa los controles para acercar o seleccionar terrenos."/>;
});
export default City;
