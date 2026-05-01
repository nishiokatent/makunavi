'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface Pt { x: number; y: number }
interface Fabric { maker: string; name: string; code: string; color: string; r: number; g: number; b: number }
interface Label {
  visible: boolean; ix: number; iy: number; fontSize: number
  dragging: boolean; resizing: boolean
  _dragStartX: number; _dragStartY: number; _dragIx0: number; _dragIy0: number
  _resizeStartX: number; _resizeStartY: number; _resizeFontSize0: number
  _bx: number; _by: number; _bw: number; _bh: number
  pinching: boolean; pinchDist0: number; pinchFontSize0: number
}
interface NtVerts { WLU:Pt; WL:Pt; WRU:Pt; WR:Pt; FLU:Pt; FL:Pt; FRU:Pt; FR:Pt; _wIsLeft:boolean; [key:string]:Pt|boolean }
interface PinchState { dist:number; scale0:number; offX0:number; offY0:number; mid0X:number; mid0Y:number }

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQyMy5PUSJjr1f_fnQIpRIUagAp8Dw7Hqckr9422w_459qgQ_j4Bhw4LWygLVWTURa9n4Xl_gBNHAie/pub?output=csv'
const NT_KEYS: (keyof Omit<NtVerts,'_wIsLeft'>)[] = ['WLU','WL','WRU','WR','FLU','FL','FRU','FR']

// ─────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────
function rgbToHsl(r:number,g:number,b:number): [number,number,number] {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=((g-b)/d+(g<b?6:0))/6;
    else if(max===g)h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6;}
  return[h,s,l];
}
function hue2rgb(p:number,q:number,t:number){
  if(t<0)t+=1;if(t>1)t-=1;
  if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;
  if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;
}
function hslToRgb(h:number,s:number,l:number):[number,number,number]{
  if(s===0){const v=Math.round(l*255);return[v,v,v];}
  const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  return[Math.round(hue2rgb(p,q,h+1/3)*255),Math.round(hue2rgb(p,q,h)*255),Math.round(hue2rgb(p,q,h-1/3)*255)];
}
function boostedColor(r:number,g:number,b:number,blendVal:number):[number,number,number]{
  if(blendVal<=0)return[r,g,b];
  const[h,s,l]=rgbToHsl(r,g,b);
  return hslToRgb(h,Math.min(1,s+blendVal*0.30),Math.min(0.88,l+blendVal*0.06));
}

function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function lineIntersect(p1:Pt,p2:Pt,p3:Pt,p4:Pt):Pt|null{
  const d1x=p2.x-p1.x,d1y=p2.y-p1.y,d2x=p4.x-p3.x,d2y=p4.y-p3.y;
  const cross=d1x*d2y-d1y*d2x;
  if(Math.abs(cross)<0.001)return null;
  const t=((p3.x-p1.x)*d2y-(p3.y-p1.y)*d2x)/cross;
  return{x:p1.x+t*d1x,y:p1.y+t*d1y};
}
function yOnLine(p1:Pt,p2:Pt,x:number){
  if(Math.abs(p2.x-p1.x)<0.1)return p1.y;
  return p1.y+(p2.y-p1.y)/(p2.x-p1.x)*(x-p1.x);
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────
export default function TentsukuCanvas() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cssSizeRef = useRef({ w: 0, h: 0 })

  // React UI state
  const [appMode,     setAppMode]     = useState<'replace'|'new'>('replace')
  const [activeTab,   setActiveTab]   = useState<'draw'|'fabric'|'export'>('draw')
  const [fabricDB,    setFabricDB]    = useState<Fabric[]>([])
  const [fabIdx,      setFabIdx]      = useState<string>('')
  const [blend,       setBlend]       = useState(0)
  const [contrast,    setContrast]    = useState(0)
  const [blendLabel,  setBlendLabel]  = useState('自然')
  const [ctLabel,     setCtLabel]     = useState('標準')
  const [pointCount,  setPointCount]  = useState(0)
  const [canApply,    setCanApply]    = useState(false)
  const [canExport,   setCanExport]   = useState(false)
  const [statusMsg,   setStatusMsg]   = useState<{text:string;type:string}|null>(null)
  const [zoomLabel,   setZoomLabel]   = useState('100%')
  const [showBefore,  setShowBefore]  = useState(false)
  const [ntStep,      setNtStep]      = useState('')
  const [ntGenLabel,  setNtGenLabel]  = useState('テントを自動生成')
  const [ntAdjustVis, setNtAdjustVis] = useState(false)
  const [ntGenDis,    setNtGenDis]    = useState(true)
  const [brightNagare,setBrightNagare] = useState(10)
  const [brightFront, setBrightFront]  = useState(0)
  const [brightLeft,  setBrightLeft]   = useState(-10)
  const [brightRight, setBrightRight]  = useState(-20)
  const [depthVal,    setDepthVal]    = useState(25)
  const [frontHVal,   setFrontHVal]   = useState(70)
  const [groundVal,   setGroundVal]   = useState(0)
  const [ntLeftLabel, setNtLeftLabel] = useState('左妻面')
  const [ntRightLabel,setNtRightLabel]= useState('右妻面')
  const [swatchColor, setSwatchColor] = useState('transparent')

  // Canvas-only mutable refs
  const srcImgRef    = useRef<HTMLImageElement|null>(null)
  const scaleRef     = useRef(1)
  const offXRef      = useRef(0)
  const offYRef      = useRef(0)
  const polygonsRef  = useRef<{points:Pt[];applied:boolean}[]>([{points:[],applied:false}])
  const activeIdxRef = useRef(0)
  const appliedRef   = useRef(false)
  const blendRef     = useRef(0)
  const contrastRef  = useRef(0)
  const fabricRef    = useRef<Fabric|null>(null)
  const ntPtsRef     = useRef<Pt[]>([])
  const ntVertsRef   = useRef<NtVerts|null>(null)
  const ntAppliedRef = useRef(false)
  const ntDragIdxRef = useRef<keyof Omit<NtVerts,'_wIsLeft'>|null>(null)
  const brightRef    = useRef({nagare:10,front:0,left:-10,right:-20})
  const depthRef     = useRef(25)
  const frontHRef    = useRef(70)
  const groundRef    = useRef(0)
  const labelRef     = useRef<Label>({
    visible:false,ix:0,iy:0,fontSize:28,dragging:false,resizing:false,
    _dragStartX:0,_dragStartY:0,_dragIx0:0,_dragIy0:0,
    _resizeStartX:0,_resizeStartY:0,_resizeFontSize0:0,
    _bx:0,_by:0,_bw:0,_bh:0,
    pinching:false,pinchDist0:0,pinchFontSize0:0,
  })
  const ccRef     = useRef<{cache:HTMLCanvasElement|null;val:number|null}>({cache:null,val:null})
  const ptrRef    = useRef<Map<number,{x:number;y:number}>>(new Map())
  const dragIdxRef = useRef(-1)
  const didDragRef = useRef(false)
  const panStartRef = useRef<{cx:number;cy:number;ox:number;oy:number;_ntTapCandidate?:Pt}|null>(null)
  const pinchRef  = useRef<PinchState|null>(null)
  const longTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const pinchJustEndedRef = useRef(false)
  const lastMouseRef = useRef<{x:number;y:number}|null>(null)
  const appModeRef   = useRef<'replace'|'new'>('replace')

  function pts(){ return polygonsRef.current[activeIdxRef.current].points; }

  // ── Canvas helpers ──
  function ctx(){ return canvasRef.current?.getContext('2d') ?? null; }
  function getWrapPos(e:{clientX:number;clientY:number}){
    const r=wrapRef.current!.getBoundingClientRect();
    return{x:e.clientX-r.left,y:e.clientY-r.top};
  }
  function screenToImg(x:number,y:number):Pt{
    return{x:(x-offXRef.current)/scaleRef.current,y:(y-offYRef.current)/scaleRef.current};
  }
  function imgToScreen(p:Pt):{sx:number;sy:number}{
    return{sx:p.x*scaleRef.current+offXRef.current,sy:p.y*scaleRef.current+offYRef.current};
  }

  // ── Contrast cache ──
  function makeContrastedImage(src:HTMLImageElement,ct:number):HTMLCanvasElement|null{
    if(Math.abs(ct-1.0)<0.01){ccRef.current={cache:null,val:null};return null;}
    if(ccRef.current.cache&&ccRef.current.val===ct)return ccRef.current.cache;
    const tmp=document.createElement('canvas');
    tmp.width=src.width;tmp.height=src.height;
    const tc=tmp.getContext('2d')!;tc.drawImage(src,0,0);
    const d=tc.getImageData(0,0,tmp.width,tmp.height);
    const px=d.data,f=ct,iv=128*(1-f);
    for(let i=0;i<px.length;i+=4){
      px[i]=Math.min(255,Math.max(0,px[i]*f+iv));
      px[i+1]=Math.min(255,Math.max(0,px[i+1]*f+iv));
      px[i+2]=Math.min(255,Math.max(0,px[i+2]*f+iv));
    }
    tc.putImageData(d,0,0);
    ccRef.current={cache:tmp,val:ct};
    return tmp;
  }

  // ── Fabric label ──
  function drawFabricLabel(c:CanvasRenderingContext2D,showHandle:boolean,sc:number,ox:number,oy:number){
    const f=fabricRef.current;if(!f)return;
    const lb=labelRef.current;
    const line1=`${f.maker} ${f.name}`;
    const line2=`${f.code}  ${f.color}`;
    const sx=lb.ix*sc+ox,sy=lb.iy*sc+oy;
    const fs=lb.fontSize*sc;
    const fs2=fs*0.72;
    const padX=fs*0.7,padY=fs*0.55;
    const gap=fs*0.38;               // line1 と line2 の間の縦余白
    const accentW=fs*0.22;            // 左端の色帯
    const serif=`'Noto Serif JP','Noto Sans JP',serif`;
    c.save();
    c.font=`700 ${fs}px ${serif}`;
    const w1=c.measureText(line1).width;
    c.font=`400 ${fs2}px ${serif}`;
    const w2=c.measureText(line2).width;
    const bw=Math.max(w1,w2)+padX*2+accentW;
    const bh=padY*2+fs+gap+fs2;
    const bx=sx-bw/2,by=sy-bh/2;
    c.shadowColor='rgba(0,0,0,0.45)';c.shadowBlur=fs*0.5;
    c.shadowOffsetX=fs*0.08;c.shadowOffsetY=fs*0.08;
    c.globalAlpha=0.93;c.fillStyle='#f5f0e8';
    roundRect(c,bx,by,bw,bh,fs*0.22);c.fill();
    c.shadowColor='transparent';c.globalAlpha=1;
    c.fillStyle=`rgb(${f.r},${f.g},${f.b})`;
    roundRect(c,bx,by,accentW,bh,fs*0.1);c.fill();
    c.strokeStyle='rgba(150,120,80,0.35)';c.lineWidth=Math.max(0.8,fs*0.04);
    roundRect(c,bx,by,bw,bh,fs*0.22);c.stroke();
    const textX=bx+accentW+padX;
    c.font=`700 ${fs}px ${serif}`;c.fillStyle='#2a1a0a';
    c.textAlign='left';c.textBaseline='top';
    c.fillText(line1,textX,by+padY);
    c.font=`400 ${fs2}px ${serif}`;c.fillStyle='#6b5040';
    c.fillText(line2,textX,by+padY+fs+gap);
    lb._bx=bx;lb._by=by;lb._bw=bw;lb._bh=bh;
    const CORNER_R=12;
    if(showHandle&&!('ontouchstart' in window)){
      c.save();
      c.beginPath();c.arc(bx+bw,by+bh,CORNER_R,0,Math.PI*2);
      c.fillStyle=lb.resizing?'#e8ff47':'rgba(255,255,255,0.9)';c.fill();
      c.strokeStyle='#888';c.lineWidth=1.5;c.setLineDash([]);c.stroke();
      c.fillStyle='#333';c.font='bold 9px monospace';
      c.textAlign='center';c.textBaseline='middle';
      c.fillText('⤡',bx+bw,by+bh);c.restore();
    }
    c.restore();
  }

  // ── Hit tests ──
  function hitTestScreen(x:number,y:number){
    const pts2=pts(),HIT=24,sc=scaleRef.current,ox=offXRef.current,oy=offYRef.current;
    for(let i=pts2.length-1;i>=0;i--){
      if(Math.hypot(pts2[i].x*sc+ox-x,pts2[i].y*sc+oy-y)<HIT)return i;
    }
    return -1;
  }
  function hitTestEdge(sx:number,sy:number){
    const pts2=pts();if(pts2.length<2)return -1;
    const EDGE_HIT=14,n=pts2.length,sc=scaleRef.current,ox=offXRef.current,oy=offYRef.current;
    for(let i=0;i<n;i++){
      const a=pts2[i],b=pts2[(i+1)%n];
      const ax=a.x*sc+ox,ay=a.y*sc+oy,bx=b.x*sc+ox,by=b.y*sc+oy;
      const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
      if(len2===0)continue;
      const t=Math.max(0,Math.min(1,((sx-ax)*dx+(sy-ay)*dy)/len2));
      const px=ax+t*dx,py=ay+t*dy;
      if(Math.hypot(sx-px,sy-py)<EDGE_HIT){
        if(Math.hypot(sx-ax,sy-ay)<20)return -1;
        if(Math.hypot(sx-bx,sy-by)<20)return -1;
        return (i+1)%n===0?n:i+1;
      }
    }
    return -1;
  }
  function hitTestLabel(sx:number,sy:number){
    const lb=labelRef.current;
    if(!lb.visible||!lb._bw)return false;
    return sx>=lb._bx&&sx<=lb._bx+lb._bw&&sy>=lb._by&&sy<=lb._by+lb._bh;
  }
  function hitTestLabelCorner(sx:number,sy:number){
    const lb=labelRef.current;if(!lb.visible||!lb._bw)return -1;
    if(Math.hypot(sx-(lb._bx+lb._bw),sy-(lb._by+lb._bh))<12)return 0;
    return -1;
  }
  function ntHitTestVert(sx:number,sy:number):keyof Omit<NtVerts,'_wIsLeft'>|null{
    if(!ntVertsRef.current)return null;
    const HIT=22,sc=scaleRef.current,ox=offXRef.current,oy=offYRef.current;
    for(const k of NT_KEYS){
      const p=(ntVertsRef.current as Record<string,Pt>)[k];
      if(Math.hypot(sx-p.x*sc-ox,sy-p.y*sc-oy)<HIT)return k;
    }
    return null;
  }

  // ── RENDER ──
  const render = useCallback(() => {
    const c=canvasRef.current;if(!c)return;
    const vc=c.getContext('2d');if(!vc)return;
    const {w:cssW,h:cssH}=cssSizeRef.current;
    vc.clearRect(0,0,cssW,cssH);
    const src=srcImgRef.current;if(!src)return;
    const sc=scaleRef.current,ox=offXRef.current,oy=offYRef.current;
    const iw=src.width*sc,ih=src.height*sc;
    vc.drawImage(src,ox,oy,iw,ih);
    if(showBefore)return; // Before表示は元画像のみ

    // ── 新調モード ──
    if(appModeRef.current==='new'){
      const ptColors=['#ff9f00','#ff9f00','#e8ff47','#47c8ff','#ff4747'];
      ntPtsRef.current.forEach((p,i)=>{
        const sx=p.x*sc+ox,sy=p.y*sc+oy;
        vc.save();
        vc.beginPath();vc.arc(sx,sy,13,0,Math.PI*2);
        vc.fillStyle='rgba(0,0,0,0.35)';vc.fill();
        vc.beginPath();vc.arc(sx,sy,10,0,Math.PI*2);
        vc.fillStyle=ptColors[i];vc.fill();
        vc.strokeStyle='#111';vc.lineWidth=1.5;vc.stroke();
        vc.font='bold 10px monospace';vc.fillStyle='#111';
        vc.textAlign='center';vc.textBaseline='middle';
        vc.fillText(String(i+1),sx,sy);
        vc.restore();
      });
      if(ntPtsRef.current.length>=2){
        const p1=ntPtsRef.current[0],p2=ntPtsRef.current[1];
        vc.save();vc.beginPath();
        vc.moveTo(p1.x*sc+ox,p1.y*sc+oy);vc.lineTo(p2.x*sc+ox,p2.y*sc+oy);
        vc.strokeStyle='rgba(255,159,0,0.7)';vc.lineWidth=2;vc.setLineDash([6,4]);vc.stroke();
        vc.restore();
      }
      if(ntPtsRef.current.length>=4){
        const p3=ntPtsRef.current[2],p4=ntPtsRef.current[3];
        vc.save();vc.beginPath();
        vc.moveTo(p3.x*sc+ox,p3.y*sc+oy);vc.lineTo(p4.x*sc+ox,p4.y*sc+oy);
        vc.strokeStyle='rgba(232,255,71,0.7)';vc.lineWidth=2;vc.setLineDash([6,4]);vc.stroke();
        vc.restore();
      }
      const V=ntVertsRef.current;
      if(V){
        const vsx=(p:Pt)=>p.x*sc+ox,vsy=(p:Pt)=>p.y*sc+oy;
        const fab=fabricRef.current;
        if(fab&&ntAppliedRef.current){
          const[r,g,b]=boostedColor(fab.r,fab.g,fab.b,blendRef.current);
          const br=brightRef.current;
          const bNagare=br.nagare,bFront=br.front,bLeft=br.left,bRight=br.right;
          const wIsLeft=V._wIsLeft;
          function fillFaceNT(pts2:Pt[],bright:number){
            vc!.save();
            vc!.beginPath();vc!.moveTo(vsx(pts2[0]),vsy(pts2[0]));
            pts2.slice(1).forEach(p=>vc!.lineTo(vsx(p),vsy(p)));
            vc!.closePath();
            vc!.globalCompositeOperation='source-over';vc!.globalAlpha=1;
            vc!.fillStyle=`rgb(${r},${g},${b})`;vc!.fill();
            if(Math.abs(bright)>=1){
              vc!.beginPath();vc!.moveTo(vsx(pts2[0]),vsy(pts2[0]));
              pts2.slice(1).forEach(p=>vc!.lineTo(vsx(p),vsy(p)));
              vc!.closePath();
              vc!.globalAlpha=Math.abs(bright)/100;
              vc!.fillStyle=bright>0?'#ffffff':'#000000';vc!.fill();
            }
            vc!.restore();
          }
          fillFaceNT([V.WL,V.WLU,V.FLU,V.FL],wIsLeft?bLeft:bRight);
          fillFaceNT([V.WR,V.WRU,V.FRU,V.FR],wIsLeft?bRight:bLeft);
          fillFaceNT([V.FL,V.FR,V.FRU,V.FLU],bFront);
          fillFaceNT([V.WL,V.WR,V.FR,V.FL],bNagare);
        }
        // ワイヤーフレーム
        vc.save();vc.strokeStyle='rgba(232,255,71,0.85)';vc.lineWidth=1.8;vc.setLineDash([]);
        vc.beginPath();vc.moveTo(vsx(V.WL),vsy(V.WL));vc.lineTo(vsx(V.WLU),vsy(V.WLU));
        vc.lineTo(vsx(V.WRU),vsy(V.WRU));vc.lineTo(vsx(V.WR),vsy(V.WR));vc.lineTo(vsx(V.WL),vsy(V.WL));vc.stroke();
        vc.beginPath();vc.moveTo(vsx(V.FL),vsy(V.FL));vc.lineTo(vsx(V.FLU),vsy(V.FLU));
        vc.lineTo(vsx(V.FRU),vsy(V.FRU));vc.lineTo(vsx(V.FR),vsy(V.FR));vc.lineTo(vsx(V.FL),vsy(V.FL));vc.stroke();
        [[V.WL,V.FL],[V.WR,V.FR],[V.WLU,V.FLU]].forEach(([a,b])=>{
          vc.beginPath();vc.moveTo(vsx(a),vsy(a));vc.lineTo(vsx(b),vsy(b));vc.stroke();
        });
        vc.restore();
        // ハンドル
        NT_KEYS.forEach(k=>{
          const p=(V as Record<string,Pt>)[k];
          vc.save();
          vc.beginPath();vc.arc(vsx(p),vsy(p),12,0,Math.PI*2);
          vc.fillStyle='rgba(0,0,0,0.3)';vc.fill();
          vc.beginPath();vc.arc(vsx(p),vsy(p),9,0,Math.PI*2);
          vc.fillStyle=String(k).startsWith('F')?'#47c8ff':'#fff';vc.fill();
          vc.strokeStyle='#111';vc.lineWidth=1.5;vc.stroke();
          vc.restore();
        });
        if(ntAppliedRef.current&&fab&&labelRef.current.visible){
          drawFabricLabel(vc,true,sc,ox,oy);
        }
      }
      return;
    }

    // ── 張替モード ──
    const pts2=pts();
    if(pts2.length===0)return;
    const vsx=(p:Pt)=>p.x*sc+ox,vsy=(p:Pt)=>p.y*sc+oy;
    const fab=fabricRef.current;
    if(appliedRef.current&&fab&&pts2.length>=3){
      const[r,g,b]=boostedColor(fab.r,fab.g,fab.b,blendRef.current);
      const ct=1+contrastRef.current/100;
      const ci=makeContrastedImage(src,ct);
      vc.save();
      vc.beginPath();vc.moveTo(vsx(pts2[0]),vsy(pts2[0]));
      for(let i=1;i<pts2.length;i++)vc.lineTo(vsx(pts2[i]),vsy(pts2[i]));
      vc.closePath();vc.clip();
      if(ci)vc.drawImage(ci,ox,oy,iw,ih);else vc.drawImage(src,ox,oy,iw,ih);
      const bl=blendRef.current;
      if(bl<=0){vc.globalCompositeOperation='multiply';vc.globalAlpha=1;vc.fillStyle=`rgb(${r},${g},${b})`;vc.fillRect(ox,oy,iw,ih);}
      else if(bl>=1){vc.globalCompositeOperation='source-over';vc.globalAlpha=1;vc.fillStyle=`rgb(${r},${g},${b})`;vc.fillRect(ox,oy,iw,ih);}
      else{
        vc.globalCompositeOperation='multiply';vc.globalAlpha=1-bl;vc.fillStyle=`rgb(${r},${g},${b})`;vc.fillRect(ox,oy,iw,ih);
        vc.globalCompositeOperation='source-over';vc.globalAlpha=bl;vc.fillStyle=`rgb(${r},${g},${b})`;vc.fillRect(ox,oy,iw,ih);
      }
      vc.restore();
    }
    // ポリゴン辺
    if(pts2.length>=2){
      vc.save();
      const lm=lastMouseRef.current;
      if(lm&&pts2.length>=2){
        const ei=hitTestEdge(lm.x,lm.y);
        if(ei>=0){
          const n=pts2.length,a=pts2[(ei-1+n)%n],b2=pts2[ei%n];
          vc.beginPath();vc.moveTo(vsx(a),vsy(a));vc.lineTo(vsx(b2),vsy(b2));
          vc.strokeStyle='rgba(71,200,255,0.9)';vc.lineWidth=4;vc.setLineDash([]);vc.stroke();
          const mx=(vsx(a)+vsx(b2))/2,my=(vsy(a)+vsy(b2))/2;
          vc.beginPath();vc.arc(mx,my,8,0,Math.PI*2);vc.fillStyle='#47c8ff';vc.fill();
          vc.font='bold 10px monospace';vc.fillStyle='#000';vc.textAlign='center';vc.textBaseline='middle';
          vc.fillText('+',mx,my);
        }
      }
      vc.beginPath();vc.moveTo(vsx(pts2[0]),vsy(pts2[0]));
      for(let i=1;i<pts2.length;i++)vc.lineTo(vsx(pts2[i]),vsy(pts2[i]));
      if(pts2.length>=3)vc.closePath();
      vc.strokeStyle='rgba(232,255,71,0.9)';vc.lineWidth=2;vc.setLineDash([]);vc.stroke();
      vc.restore();
    }
    // 頂点
    pts2.forEach((p,i)=>{
      vc.save();
      vc.beginPath();vc.arc(vsx(p),vsy(p),13,0,Math.PI*2);vc.fillStyle='rgba(0,0,0,0.4)';vc.fill();
      vc.beginPath();vc.arc(vsx(p),vsy(p),10,0,Math.PI*2);
      vc.fillStyle=i===0?'#e8ff47':'#ffffff';vc.fill();
      vc.strokeStyle='#111';vc.lineWidth=1.5;vc.stroke();
      vc.font='bold 10px monospace';vc.fillStyle='#111';
      vc.textAlign='center';vc.textBaseline='middle';
      vc.fillText(String(i+1),vsx(p),vsy(p));
      vc.restore();
    });
    if(labelRef.current.visible&&fab&&appliedRef.current){
      drawFabricLabel(vc,true,sc,ox,oy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[showBefore])

  // ── Offscreen render for download ──
  function renderOffscreen():HTMLCanvasElement|null{
    const src=srcImgRef.current;if(!src)return null;
    const out=document.createElement('canvas');
    out.width=src.width;out.height=src.height;
    const oc=out.getContext('2d')!;
    oc.drawImage(src,0,0);
    const fab=fabricRef.current;
    if(!fab)return out;
    const[r,g,b]=boostedColor(fab.r,fab.g,fab.b,blendRef.current);
    const ct=1+contrastRef.current/100;
    const ci=makeContrastedImage(src,ct);
    const bl=blendRef.current;
    function blendRect(){
      if(bl<=0){oc.globalCompositeOperation='multiply';oc.globalAlpha=1;oc.fillStyle=`rgb(${r},${g},${b})`;oc.fillRect(0,0,src!.width,src!.height);}
      else if(bl>=1){oc.globalCompositeOperation='source-over';oc.globalAlpha=1;oc.fillStyle=`rgb(${r},${g},${b})`;oc.fillRect(0,0,src!.width,src!.height);}
      else{
        oc.globalCompositeOperation='multiply';oc.globalAlpha=1-bl;oc.fillStyle=`rgb(${r},${g},${b})`;oc.fillRect(0,0,src!.width,src!.height);
        oc.globalCompositeOperation='source-over';oc.globalAlpha=bl;oc.fillStyle=`rgb(${r},${g},${b})`;oc.fillRect(0,0,src!.width,src!.height);
      }
      oc.restore();
    }
    const V=ntVertsRef.current;
    if(appModeRef.current==='new'&&V&&ntAppliedRef.current){
      const br=brightRef.current;
      const[ro,go,bo]=boostedColor(fab.r,fab.g,fab.b,blendRef.current);
      const wIsLeft=V._wIsLeft;
      function ffNT(pts2:Pt[],bright:number){
        oc.save();oc.beginPath();oc.moveTo(pts2[0].x,pts2[0].y);
        pts2.slice(1).forEach(p=>oc.lineTo(p.x,p.y));oc.closePath();
        oc.globalCompositeOperation='source-over';oc.globalAlpha=1;
        oc.fillStyle=`rgb(${ro},${go},${bo})`;oc.fill();
        if(Math.abs(bright)>=1){
          oc.beginPath();oc.moveTo(pts2[0].x,pts2[0].y);pts2.slice(1).forEach(p=>oc.lineTo(p.x,p.y));oc.closePath();
          oc.globalAlpha=Math.abs(bright)/100;oc.fillStyle=bright>0?'#ffffff':'#000000';oc.fill();
        }
        oc.restore();
      }
      ffNT([V.WL,V.WLU,V.FLU,V.FL],wIsLeft?br.left:br.right);
      ffNT([V.WR,V.WRU,V.FRU,V.FR],wIsLeft?br.right:br.left);
      ffNT([V.FL,V.FR,V.FRU,V.FLU],br.front);
      ffNT([V.WL,V.WR,V.FR,V.FL],br.nagare);
    } else {
      const pts2=pts();
      if(pts2.length>=3&&appliedRef.current){
        oc.save();oc.beginPath();oc.moveTo(pts2[0].x,pts2[0].y);
        for(let i=1;i<pts2.length;i++)oc.lineTo(pts2[i].x,pts2[i].y);
        oc.closePath();oc.clip();
        if(ci)oc.drawImage(ci,0,0);else oc.drawImage(src,0,0);
        blendRect();
      }
    }
    if(labelRef.current.visible){
      drawFabricLabel(oc,false,1,0,0);
    }
    return out;
  }

  // ── Status ──
  function showStatus(text:string,type:string){
    setStatusMsg({text,type});
    setTimeout(()=>setStatusMsg(null),2500);
  }

  // ── UI sync ──
  function syncApplyBtn(){
    const mode=appModeRef.current;
    const ok=mode==='new'
      ?!!(ntVertsRef.current&&fabricRef.current)
      :!!(srcImgRef.current&&pts().length>=3&&fabricRef.current);
    setCanApply(ok);
  }
  function syncExport(){
    const ok=mode==='new'?ntAppliedRef.current:appliedRef.current;
    setCanExport(ok);
  }
  const mode=appModeRef.current; // used in syncExport - keep it

  // ── FitToScreen ──
  function fitToScreen(){
    const src=srcImgRef.current;if(!src)return;
    const{w:cssW,h:cssH}=cssSizeRef.current;
    scaleRef.current=Math.min(cssW/src.width,cssH/src.height)*0.95;
    offXRef.current=(cssW-src.width*scaleRef.current)/2;
    offYRef.current=(cssH-src.height*scaleRef.current)/2;
    setZoomLabel(Math.round(scaleRef.current*100)+'%');
  }

  // ── Canvas resize ──
  function resizeCanvas(){
    const wrap=wrapRef.current;const c=canvasRef.current;if(!wrap||!c)return;
    const cssW=wrap.clientWidth,cssH=wrap.clientHeight;
    cssSizeRef.current={w:cssW,h:cssH};
    const dpr=window.devicePixelRatio||1;
    c.width=cssW*dpr;c.height=cssH*dpr;
    c.style.width=cssW+'px';c.style.height=cssH+'px';
    c.getContext('2d')!.setTransform(dpr,0,0,dpr,0,0);
    render();
  }

  // ── ntGenerate ──
  function ntGenerate(){
    const p=ntPtsRef.current;if(p.length<5)return;
    const GL=p[0],GR=p[1],A=p[2],B=p[3],C=p[4];
    const dr=depthRef.current/100,fhr=frontHRef.current/100,gr=groundRef.current/100;
    const span=Math.hypot(B.x-A.x,B.y-A.y);
    const VP=lineIntersect(GL,GR,A,B);
    const distCA=Math.hypot(C.x-A.x,C.y-A.y),distCB=Math.hypot(C.x-B.x,C.y-B.y);
    const wallPt=distCA<distCB?A:B,frontPt=distCA<distCB?B:A;
    const wallH=wallPt.y-C.y;
    const midX=(A.x+B.x)/2,wIsLeft=wallPt.x<midX;
    const depthPx=span*dr;
    let dDirX=0,dDirY=1,shrink=0.92;
    if(VP){
      const vfX=frontPt.x-VP.x,vfY=frontPt.y-VP.y,vfLen=Math.hypot(vfX,vfY);
      dDirX=vfX/vfLen;dDirY=vfY/vfLen;
      if(dDirY<0){dDirX=-dDirX;dDirY=-dDirY;}
      shrink=vfLen/(vfLen+depthPx);
    }
    const WLU={x:wallPt.x,y:wallPt.y},WL={x:C.x,y:C.y};
    const WRU={x:frontPt.x,y:frontPt.y};
    const WR=VP?{x:WRU.x,y:yOnLine(WL,VP,WRU.x)}:{x:WRU.x,y:WRU.y-wallH*shrink};
    const groundOffset=wallH*gr;
    const midBotX=(WLU.x+WRU.x)/2+dDirX*depthPx,midBotY=(WLU.y+WRU.y)/2+dDirY*depthPx;
    const FLU={x:midBotX+(WLU.x+dDirX*depthPx-midBotX)*shrink,y:midBotY+(WLU.y+dDirY*depthPx-midBotY)*shrink-groundOffset};
    const FRU={x:midBotX+(WRU.x+dDirX*depthPx-midBotX)*shrink,y:midBotY+(WRU.y+dDirY*depthPx-midBotY)*shrink-groundOffset};
    const FLUbaseY=FLU.y+groundOffset,FRUbaseY=FRU.y+groundOffset;
    const FLlineY=VP?yOnLine(WL,VP,FLU.x):FLUbaseY-wallH*shrink;
    const FRlineY=VP?yOnLine(WR,VP,FRU.x):FRUbaseY-wallH*shrink*shrink;
    const FL={x:FLU.x,y:(FLUbaseY-(FLUbaseY-FLlineY)*fhr)-groundOffset};
    const FR={x:FRU.x,y:(FRUbaseY-(FRUbaseY-FRlineY)*fhr)-groundOffset};
    ntVertsRef.current={WLU,WL,WRU,WR,FLU,FL,FRU,FR,_wIsLeft:wIsLeft};
    ntAppliedRef.current=false;
    setNtAdjustVis(true);setNtGenLabel('再生成');
    setNtLeftLabel(wIsLeft?'左妻面(W)':'左妻面(F)');
    setNtRightLabel(wIsLeft?'右妻面(F)':'右妻面(W)');
    syncApplyBtn();render();
  }

  function ntAdjustShape(){
    const V=ntVertsRef.current;const p=ntPtsRef.current;
    if(!V||p.length<5)return;
    const GL=p[0],GR=p[1],A=p[2],B=p[3],C=p[4];
    const dr=depthRef.current/100,fhr=frontHRef.current/100,gr=groundRef.current/100;
    const span=Math.hypot(B.x-A.x,B.y-A.y);
    const VP=lineIntersect(GL,GR,A,B);
    const distCA=Math.hypot(C.x-A.x,C.y-A.y);
    const wallPt=distCA<Math.hypot(C.x-B.x,C.y-B.y)?A:B;
    const frontPt=wallPt===A?B:A;
    const wallH=wallPt.y-C.y;
    const depthPx=span*dr;
    let dDirX=0,dDirY=1,shrink=0.92;
    if(VP){
      const vfX=frontPt.x-VP.x,vfY=frontPt.y-VP.y,vfLen=Math.hypot(vfX,vfY);
      dDirX=vfX/vfLen;dDirY=vfY/vfLen;
      if(dDirY<0){dDirX=-dDirX;dDirY=-dDirY;}
      shrink=vfLen/(vfLen+depthPx);
    }
    const groundOffset=wallH*gr;
    const WLU=V.WLU,WL=V.WL,WRU=V.WRU,WR=V.WR;
    const midBotX=(WLU.x+WRU.x)/2+dDirX*depthPx,midBotY=(WLU.y+WRU.y)/2+dDirY*depthPx;
    const FLU={x:midBotX+(WLU.x+dDirX*depthPx-midBotX)*shrink,y:midBotY+(WLU.y+dDirY*depthPx-midBotY)*shrink-groundOffset};
    const FRU={x:midBotX+(WRU.x+dDirX*depthPx-midBotX)*shrink,y:midBotY+(WRU.y+dDirY*depthPx-midBotY)*shrink-groundOffset};
    const FLUbaseY=FLU.y+groundOffset,FRUbaseY=FRU.y+groundOffset;
    const FLlineY=VP?yOnLine(WL,VP,FLU.x):FLUbaseY-wallH*shrink;
    const FRlineY=VP?yOnLine(WR,VP,FRU.x):FRUbaseY-wallH*shrink*shrink;
    const verts=ntVertsRef.current!;
    verts.FLU=FLU;verts.FL={x:FLU.x,y:(FLUbaseY-(FLUbaseY-FLlineY)*fhr)-groundOffset};
    verts.FRU=FRU;verts.FR={x:FRU.x,y:(FRUbaseY-(FRUbaseY-FRlineY)*fhr)-groundOffset};
    ntAppliedRef.current=false;render();
  }

  // ── Pointer events ──
  function cancelLong(){if(longTimerRef.current){clearTimeout(longTimerRef.current);longTimerRef.current=null;}}

  function onPD(e:PointerEvent){
    e.preventDefault();
    const pos=getWrapPos(e);
    ptrRef.current.set(e.pointerId,pos);
    const ptrs=[...ptrRef.current.values()];
    if(ptrs.length===2){
      cancelLong();dragIdxRef.current=-1;panStartRef.current=null;labelRef.current.dragging=false;
      pinchJustEndedRef.current=false;
      const d=Math.hypot(ptrs[1].x-ptrs[0].x,ptrs[1].y-ptrs[0].y);
      const mx=(ptrs[0].x+ptrs[1].x)/2,my=(ptrs[0].y+ptrs[1].y)/2;
      if(labelRef.current.visible&&hitTestLabel(mx,my)){
        labelRef.current.pinching=true;labelRef.current.pinchDist0=d;labelRef.current.pinchFontSize0=labelRef.current.fontSize;
      }
      pinchRef.current={dist:d,scale0:scaleRef.current,offX0:offXRef.current,offY0:offYRef.current,mid0X:mx,mid0Y:my};
      return;
    }
    if(pinchJustEndedRef.current)return;
    if(!srcImgRef.current||pinchRef.current)return;
    if(appModeRef.current==='new'){
      if(labelRef.current.visible&&hitTestLabelCorner(pos.x,pos.y)>=0){
        labelRef.current.resizing=true;labelRef.current._resizeStartX=pos.x;labelRef.current._resizeStartY=pos.y;labelRef.current._resizeFontSize0=labelRef.current.fontSize;
        didDragRef.current=false;return;
      }
      if(labelRef.current.visible&&hitTestLabel(pos.x,pos.y)){
        labelRef.current.dragging=true;labelRef.current._dragStartX=pos.x;labelRef.current._dragStartY=pos.y;
        labelRef.current._dragIx0=labelRef.current.ix;labelRef.current._dragIy0=labelRef.current.iy;
        didDragRef.current=false;return;
      }
      const ntHit=ntHitTestVert(pos.x,pos.y);
      if(ntHit!==null){ntDragIdxRef.current=ntHit;didDragRef.current=false;return;}
      panStartRef.current={cx:pos.x,cy:pos.y,ox:offXRef.current,oy:offYRef.current};
      if(ntPtsRef.current.length<5){const ip=screenToImg(pos.x,pos.y);panStartRef.current._ntTapCandidate=ip;}
      didDragRef.current=false;return;
    }
    if(labelRef.current.visible&&hitTestLabelCorner(pos.x,pos.y)>=0){
      labelRef.current.resizing=true;labelRef.current._resizeStartX=pos.x;labelRef.current._resizeStartY=pos.y;labelRef.current._resizeFontSize0=labelRef.current.fontSize;
      didDragRef.current=false;return;
    }
    if(labelRef.current.visible&&hitTestLabel(pos.x,pos.y)){
      labelRef.current.dragging=true;labelRef.current._dragStartX=pos.x;labelRef.current._dragStartY=pos.y;
      labelRef.current._dragIx0=labelRef.current.ix;labelRef.current._dragIy0=labelRef.current.iy;
      didDragRef.current=false;return;
    }
    const hit=hitTestScreen(pos.x,pos.y);
    if(hit>=0){
      dragIdxRef.current=hit;didDragRef.current=false;
      longTimerRef.current=setTimeout(()=>{
        if(!didDragRef.current){
          pts().splice(dragIdxRef.current,1);dragIdxRef.current=-1;
          appliedRef.current=false;setPointCount(pts().length);syncApplyBtn();render();
          showStatus('頂点を削除しました','info');
        }
      },600);
    } else {
      panStartRef.current={cx:pos.x,cy:pos.y,ox:offXRef.current,oy:offYRef.current};
      didDragRef.current=false;
    }
  }

  function onPM(e:PointerEvent){
    e.preventDefault();
    const pos=getWrapPos(e);
    ptrRef.current.set(e.pointerId,pos);
    const ptrs=[...ptrRef.current.values()];
    if(pinchRef.current&&ptrs.length===2){
      const dist=Math.hypot(ptrs[1].x-ptrs[0].x,ptrs[1].y-ptrs[0].y);
      const midX=(ptrs[0].x+ptrs[1].x)/2,midY=(ptrs[0].y+ptrs[1].y)/2;
      if(labelRef.current.pinching){
        labelRef.current.fontSize=Math.min(120,Math.max(10,labelRef.current.pinchFontSize0*(dist/pinchRef.current.dist)));
        render();return;
      }
      const ratio=dist/pinchRef.current.dist;
      const ns=Math.min(20,Math.max(0.05,pinchRef.current.scale0*ratio));
      const imgMX=(pinchRef.current.mid0X-pinchRef.current.offX0)/pinchRef.current.scale0;
      const imgMY=(pinchRef.current.mid0Y-pinchRef.current.offY0)/pinchRef.current.scale0;
      scaleRef.current=ns;offXRef.current=midX-imgMX*ns;offYRef.current=midY-imgMY*ns;
      setZoomLabel(Math.round(ns*100)+'%');render();return;
    }
    if(appModeRef.current==='new'&&ntDragIdxRef.current!==null){
      didDragRef.current=true;
      const ip=screenToImg(pos.x,pos.y);
      const src=srcImgRef.current!;
      if(ntVertsRef.current){
        ntVertsRef.current[ntDragIdxRef.current]={
          x:Math.max(0,Math.min(src.width,ip.x)),y:Math.max(0,Math.min(src.height,ip.y))
        };
      }
      render();return;
    }
    if(labelRef.current.resizing){
      didDragRef.current=true;
      const dx=pos.x-labelRef.current._resizeStartX,dy=pos.y-labelRef.current._resizeStartY;
      labelRef.current.fontSize=Math.min(120,Math.max(8,labelRef.current._resizeFontSize0+(dx+dy)/2/scaleRef.current));
      render();return;
    }
    if(labelRef.current.dragging){
      didDragRef.current=true;
      labelRef.current.ix=labelRef.current._dragIx0+(pos.x-labelRef.current._dragStartX)/scaleRef.current;
      labelRef.current.iy=labelRef.current._dragIy0+(pos.y-labelRef.current._dragStartY)/scaleRef.current;
      render();return;
    }
    if(dragIdxRef.current>=0){
      didDragRef.current=true;cancelLong();
      const ip=screenToImg(pos.x,pos.y);const src=srcImgRef.current!;
      pts()[dragIdxRef.current]={x:Math.max(0,Math.min(src.width,ip.x)),y:Math.max(0,Math.min(src.height,ip.y))};
      appliedRef.current=false;render();return;
    }
    if(panStartRef.current){
      const dx=pos.x-panStartRef.current.cx,dy=pos.y-panStartRef.current.cy;
      if(Math.hypot(dx,dy)>6)didDragRef.current=true;
      offXRef.current=panStartRef.current.ox+dx;offYRef.current=panStartRef.current.oy+dy;
      render();
    }
  }

  function onPU(e:PointerEvent){
    e.preventDefault();
    ptrRef.current.delete(e.pointerId);
    cancelLong();
    if(pinchRef.current&&ptrRef.current.size<2){
      pinchRef.current=null;labelRef.current.pinching=false;labelRef.current.resizing=false;
      pinchJustEndedRef.current=true;setTimeout(()=>{pinchJustEndedRef.current=false;},300);
      dragIdxRef.current=-1;panStartRef.current=null;labelRef.current.dragging=false;return;
    }
    if(labelRef.current.resizing){labelRef.current.resizing=false;render();return;}
    if(labelRef.current.dragging){labelRef.current.dragging=false;render();return;}
    if(appModeRef.current==='new'&&ntDragIdxRef.current!==null){ntDragIdxRef.current=null;render();return;}
    if(panStartRef.current&&!didDragRef.current&&srcImgRef.current&&dragIdxRef.current<0){
      if(appModeRef.current==='new'&&panStartRef.current._ntTapCandidate&&ntPtsRef.current.length<5){
        const ip=panStartRef.current._ntTapCandidate;
        const src=srcImgRef.current;
        if(ip.x>=0&&ip.x<=src.width&&ip.y>=0&&ip.y<=src.height){
          ntPtsRef.current.push({x:ip.x,y:ip.y});
          const done=ntPtsRef.current.length>=5;
          setNtGenDis(!done);
          const msgs=['1: 奥行き線の一端をタップ','2: 奥行き線のもう一端をタップ','3: 間口の一端をタップ','4: 間口のもう一端をタップ','5: テント取付高さをタップ','5点完了。「テントを自動生成」を押してください'];
          setNtStep(msgs[Math.min(ntPtsRef.current.length,5)]);
          render();
        }
        panStartRef.current=null;return;
      }
      const ip=screenToImg(panStartRef.current.cx,panStartRef.current.cy);
      const src=srcImgRef.current;
      if(ip.x>=0&&ip.x<=src.width&&ip.y>=0&&ip.y<=src.height){
        const edgeIdx=pts().length>=2?hitTestEdge(panStartRef.current.cx,panStartRef.current.cy):-1;
        if(edgeIdx>=0){pts().splice(edgeIdx,0,{x:ip.x,y:ip.y});showStatus('辺に頂点を挿入しました','info');}
        else pts().push({x:ip.x,y:ip.y});
        appliedRef.current=false;setPointCount(pts().length);syncApplyBtn();render();
      }
    }
    dragIdxRef.current=-1;panStartRef.current=null;
  }

  // ── Effects ──
  useEffect(()=>{
    const wrap=wrapRef.current;const c=canvasRef.current;if(!wrap||!c)return;
    const ro=new ResizeObserver(resizeCanvas);ro.observe(wrap);
    resizeCanvas();
    return()=>ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    const wrap=wrapRef.current;if(!wrap)return;
    const opts={passive:false} as EventListenerOptions;
    wrap.addEventListener('pointerdown',onPD as EventListener,opts);
    wrap.addEventListener('pointermove',onPM as EventListener,opts);
    wrap.addEventListener('pointerup',  onPU as EventListener,opts);
    wrap.addEventListener('pointercancel',onPU as EventListener,opts);
    const onMM=(e:MouseEvent)=>{
      if(ptrRef.current.size>0)return;
      const pos=getWrapPos(e);lastMouseRef.current=pos;
      if(srcImgRef.current)render();
    };
    const onML=()=>{lastMouseRef.current=null;render();};
    const onWheel=(e:WheelEvent)=>{
      e.preventDefault();
      if(!srcImgRef.current)return;
      const pos=getWrapPos(e);
      if(labelRef.current.visible&&hitTestLabel(pos.x,pos.y)){
        labelRef.current.fontSize=Math.min(120,Math.max(10,labelRef.current.fontSize*(e.deltaY>0?0.9:1.11)));
        render();return;
      }
      const delta=e.deltaY>0?0.85:1.18;
      const imgX=(pos.x-offXRef.current)/scaleRef.current,imgY=(pos.y-offYRef.current)/scaleRef.current;
      scaleRef.current=Math.min(20,Math.max(0.05,scaleRef.current*delta));
      offXRef.current=pos.x-imgX*scaleRef.current;offYRef.current=pos.y-imgY*scaleRef.current;
      setZoomLabel(Math.round(scaleRef.current*100)+'%');render();
    };
    const onKey=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.code==='KeyZ'){undoPoint();e.preventDefault();}};
    wrap.addEventListener('mousemove',onMM as EventListener);
    wrap.addEventListener('mouseleave',onML);
    wrap.addEventListener('wheel',onWheel as EventListener,{passive:false});
    document.addEventListener('keydown',onKey);
    return()=>{
      wrap.removeEventListener('pointerdown',onPD as EventListener);
      wrap.removeEventListener('pointermove',onPM as EventListener);
      wrap.removeEventListener('pointerup',onPU as EventListener);
      wrap.removeEventListener('pointercancel',onPU as EventListener);
      wrap.removeEventListener('mousemove',onMM as EventListener);
      wrap.removeEventListener('mouseleave',onML);
      wrap.removeEventListener('wheel',onWheel as EventListener);
      document.removeEventListener('keydown',onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    fetch(CSV_URL).then(r=>r.text()).then(text=>{
      const rows=text.trim().split('\n').slice(1);
      const db:Fabric[]=[];
      rows.forEach(row=>{
        if(!row.trim())return;
        const c=row.split(',');
        if(!c[4]||!c[5]||!c[6])return;
        db.push({maker:c[0].trim(),name:c[1].trim(),code:c[2].trim(),color:c[3].trim(),r:+c[4],g:+c[5],b:+c[6]});
      });
      setFabricDB(db);
      showStatus('生地データ読み込み完了','success');
      const saved=localStorage.getItem('tentSim_v1');
      if(saved){const s=JSON.parse(saved);if(s.fabricIdx){setFabIdx(s.fabricIdx);}}
    }).catch(()=>showStatus('生地データの読み込みに失敗しました','error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{render();},[render]);

  // Sync fabric from idx
  useEffect(()=>{
    if(fabIdx===''||fabricDB.length===0){fabricRef.current=null;setSwatchColor('transparent');}
    else{const f=fabricDB[+fabIdx]??null;fabricRef.current=f;setSwatchColor(f?`rgb(${f.r},${f.g},${f.b})`:'transparent');}
    syncApplyBtn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[fabIdx,fabricDB]);

  // ── Actions ──
  function handleImageFile(file:File){
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        srcImgRef.current=img;ccRef.current={cache:null,val:null};
        polygonsRef.current=[{points:[],applied:false}];activeIdxRef.current=0;
        appliedRef.current=false;labelRef.current.visible=false;
        fitToScreen();render();setPointCount(0);syncApplyBtn();setCanExport(false);
        showStatus('画像を読み込みました','success');
      };
      img.src=ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function applyFabric(){
    if(!fabricRef.current){showStatus('生地を選択してください','error');return;}
    if(appModeRef.current==='new'){
      if(!ntVertsRef.current){showStatus('先にテントを生成してください','error');return;}
      ntAppliedRef.current=true;
    } else {
      if(!srcImgRef.current||pts().length<3){showStatus('3点以上の頂点と生地が必要です','error');return;}
      appliedRef.current=true;polygonsRef.current[activeIdxRef.current].applied=true;
    }
    const src=srcImgRef.current;
    if(!labelRef.current.visible&&src){
      if(appModeRef.current==='new'&&ntVertsRef.current){
        labelRef.current.ix=ntVertsRef.current.FRU.x+src.width*0.02;
        labelRef.current.iy=ntVertsRef.current.FRU.y-src.height*0.05;
      } else {
        labelRef.current.ix=src.width*0.78;labelRef.current.iy=src.height*0.90;
      }
      labelRef.current.fontSize=Math.round(src.width*0.028);
      labelRef.current.visible=true;
    }
    render();setCanExport(true);showStatus('生地を適用しました ✓','success');
  }

  function undoPoint(){
    if(!pts().length)return;
    pts().pop();appliedRef.current=false;setPointCount(pts().length);syncApplyBtn();render();
  }
  function clearPoints(){
    polygonsRef.current[activeIdxRef.current].points=[];appliedRef.current=false;
    setPointCount(0);syncApplyBtn();render();
  }

  function fallbackDownload(out:HTMLCanvasElement){
    const a=document.createElement('a');a.download='tentsukun.png';a.href=out.toDataURL('image/png');a.click();
  }
  function isMobile(){
    if(typeof navigator==='undefined')return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
  async function saveViaShareSheet(out:HTMLCanvasElement,opts?:{title?:string;text?:string}){
    return new Promise<boolean>(resolve=>{
      out.toBlob(async blob=>{
        if(!blob){resolve(false);return;}
        const file=new File([blob],'tentsukun.png',{type:'image/png'});
        const nav=navigator as Navigator & {canShare?:(d:{files:File[]})=>boolean};
        if(!nav.canShare?.({files:[file]})){resolve(false);return;}
        try{
          await navigator.share({files:[file],...(opts??{})});
          resolve(true);
        }catch(e){
          if((e as Error).name==='AbortError'){resolve(true);return;}
          resolve(false);
        }
      },'image/png');
    });
  }
  async function downloadImage(){
    const out=renderOffscreen();if(!out)return;
    // スマホでは共有シートから「画像を保存」でカメラロールに保存できる
    if(isMobile()){
      const ok=await saveViaShareSheet(out);
      if(ok)return;
    }
    fallbackDownload(out);
  }
  async function shareImage(){
    const out=renderOffscreen();if(!out)return;
    const ok=await saveViaShareSheet(out,{title:'てんつ君'});
    if(!ok)fallbackDownload(out);
  }

  function resetAll(){
    srcImgRef.current=null;scaleRef.current=1;offXRef.current=0;offYRef.current=0;
    polygonsRef.current=[{points:[],applied:false}];activeIdxRef.current=0;
    appliedRef.current=false;ccRef.current={cache:null,val:null};
    ntPtsRef.current=[];ntVertsRef.current=null;ntAppliedRef.current=false;
    labelRef.current={...labelRef.current,visible:false};
    setPointCount(0);setCanApply(false);setCanExport(false);setNtAdjustVis(false);
    setNtGenLabel('テントを自動生成');setNtGenDis(true);setNtStep('');render();
  }

  function switchMode(m:'replace'|'new'){
    appModeRef.current=m;setAppMode(m);syncApplyBtn();render();
  }

  function saveSettings(){
    try{localStorage.setItem('tentSim_v1',JSON.stringify({blend:blendRef.current,contrast:contrastRef.current,fabricIdx:fabIdx}));}catch{}
  }

  // ─────────────────────────────────────────
  // Render UI
  // ─────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.brand}>
          <div style={S.brandLogo}>
            <svg width="18" height="16" viewBox="0 0 22 19" fill="none">
              <path d="M11 1 L21 18 H1 Z" fill="white" opacity="0.95"/>
              <line x1="11" y1="1" x2="11" y2="18" stroke="rgba(232,52,42,0.5)" strokeWidth="1"/>
              <rect x="8.5" y="11" width="5" height="7" rx="0.5" fill="rgba(232,52,42,0.35)"/>
            </svg>
          </div>
          <div>
            <div style={S.brandName}>てんつ君</div>
            <div style={S.brandSub}>FABRIC SIMULATOR</div>
          </div>
        </div>

        <div style={S.headerActions}>
          {appMode === 'replace' && srcImgRef.current && (
            <div style={S.pointBadge}>
              <span style={{fontSize: 9, color: '#71717a', letterSpacing: '0.14em', fontWeight: 600}}>POINTS</span>
              <span style={{color: pointCount >= 3 ? '#E8342A' : '#a1a1aa', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 13, fontFamily: 'var(--font-roboto-mono), monospace'}}>{pointCount}</span>
            </div>
          )}
          <label style={S.uploadBtn}>
            <Icon name="upload" size={14}/>
            <span>画像を開く</span>
            <input type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>{const f=e.target.files?.[0];if(f)handleImageFile(f);e.target.value='';}} />
          </label>
        </div>
      </header>

      {/* Mode toggle */}
      <div style={S.modeWrap}>
        <div style={S.modeToggle}>
          {([
            ['replace', '張替シミュレーター', 'replace'],
            ['new', '新調シミュレーター', 'sparkles'],
          ] as [string, string, string][]).map(([key, label2, icon]) => (
            <button key={key} onClick={()=>switchMode(key as 'replace'|'new')}
              style={{
                ...S.modeBtn,
                ...(appMode === key ? S.modeBtnActive : {}),
              }}>
              <Icon name={icon} size={13}/>
              <span>{label2}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapRef} style={S.canvasWrap}>
        <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%'}} />

        {!srcImgRef.current && (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>
              <Icon name="image" size={28}/>
            </div>
            <div style={S.emptyTitle}>画像を開いてください</div>
            <div style={S.emptySub}>テントの写真を読み込んで<br/>シミュレーションを開始</div>
          </div>
        )}

        {statusMsg && (
          <div style={{
            ...S.toast,
            borderColor: statusMsg.type === 'success' ? '#10b981' : statusMsg.type === 'error' ? '#ef4444' : '#3b82f6',
            color: statusMsg.type === 'success' ? '#10b981' : statusMsg.type === 'error' ? '#ef4444' : '#3b82f6',
          }}>
            <Icon name={statusMsg.type === 'success' ? 'check' : 'info'} size={12}/>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {showBefore && <div style={S.beforeBadge}>BEFORE</div>}

        <div style={S.zoomBadge}>{zoomLabel}</div>

        {appMode === 'replace' && canExport && (
          <button style={S.beforeBtn}
            onPointerDown={e=>{e.preventDefault();setShowBefore(true);}}
            onPointerUp={e=>{e.preventDefault();setShowBefore(false);}}
            onPointerLeave={e=>{e.preventDefault();setShowBefore(false);}}>
            <Icon name="eye" size={13}/>
            <span>BEFORE</span>
          </button>
        )}
      </div>

      {/* Bottom panel */}
      <div style={S.panel}>
        <div style={S.tabs}>
          {([
            ['draw', '形状', 'pen'],
            ['fabric', '生地', 'palette'],
            ['export', '出力', 'download'],
          ] as [string, string, string][]).map(([t, lbl, icon]) => (
            <button key={t} onClick={()=>setActiveTab(t as typeof activeTab)}
              style={{
                ...S.tab,
                ...(activeTab === t ? S.tabActive : {}),
              }}>
              <Icon name={icon} size={13}/>
              <span>{lbl}</span>
            </button>
          ))}
        </div>

        <div style={S.tabContent}>
          {/* 形状タブ */}
          {activeTab === 'draw' && (
            <div>
              {appMode === 'replace' && (
                <div>
                  <div style={S.helpBox}>
                    <div style={S.helpRow}><span style={S.helpDot}/><span>タップで頂点を追加</span></div>
                    <div style={S.helpRow}><span style={S.helpDot}/><span>ドラッグで頂点を移動</span></div>
                    <div style={S.helpRow}><span style={S.helpDot}/><span>長押しで頂点を削除</span></div>
                    <div style={S.helpRow}><span style={S.helpDot}/><span>辺をタップで頂点を挿入</span></div>
                  </div>
                  <div style={{display:'flex', gap: 8, marginTop: 12}}>
                    <button onClick={undoPoint} style={S.btnGhost}>
                      <Icon name="undo" size={13}/><span>戻す</span>
                    </button>
                    <button onClick={clearPoints} style={S.btnDanger}>
                      <Icon name="trash" size={13}/><span>消去</span>
                    </button>
                  </div>
                </div>
              )}

              {appMode === 'new' && (
                <div>
                  <div style={S.stepBox}>
                    <div style={S.step}>
                      <span style={S.stepLabel}>STEP 1</span>
                      <span style={S.stepDesc}>奥行き線の両端</span>
                      <span style={{...S.stepNum, background: '#f59e0b'}}>1</span>
                      <span style={{...S.stepNum, background: '#f59e0b'}}>2</span>
                    </div>
                    <div style={S.step}>
                      <span style={S.stepLabel}>STEP 2</span>
                      <span style={S.stepDesc}>テント間口の両端</span>
                      <span style={{...S.stepNum, background: '#fbbf24', color: '#1a1a1a'}}>3</span>
                      <span style={{...S.stepNum, background: '#3b82f6'}}>4</span>
                    </div>
                    <div style={S.step}>
                      <span style={S.stepLabel}>STEP 3</span>
                      <span style={S.stepDesc}>テント取付高さ</span>
                      <span style={{...S.stepNum, background: '#ef4444'}}>5</span>
                    </div>
                  </div>

                  {ntStep && <div style={S.ntStep}>{ntStep}</div>}

                  <div style={{display:'flex', gap: 8, marginBottom: 10}}>
                    <button onClick={()=>{
                      if(ntVertsRef.current){ntVertsRef.current=null;ntAppliedRef.current=false;setNtAdjustVis(false);setNtGenLabel('テントを自動生成');}
                      else if(ntPtsRef.current.length>0){ntPtsRef.current.pop();setNtGenDis(ntPtsRef.current.length<5);const msgs=['1: 奥行き線の一端をタップ','2: 奥行き線のもう一端をタップ','3: 間口の一端をタップ','4: 間口のもう一端をタップ','5: テント取付高さをタップ','5点完了'];setNtStep(msgs[Math.min(ntPtsRef.current.length,5)]);}
                      render();
                    }} style={S.btnGhost}>
                      <Icon name="undo" size={13}/><span>戻す</span>
                    </button>
                    <button onClick={()=>{ntPtsRef.current=[];ntVertsRef.current=null;ntAppliedRef.current=false;setNtAdjustVis(false);setNtGenDis(true);setNtGenLabel('テントを自動生成');setNtStep('');render();}} style={S.btnDanger}>
                      <Icon name="trash" size={13}/><span>消去</span>
                    </button>
                  </div>

                  <button disabled={ntGenDis} onClick={ntGenerate}
                    style={{...S.btnPrimary, width: '100%', opacity: ntGenDis ? 0.4 : 1, cursor: ntGenDis ? 'not-allowed' : 'pointer'}}>
                    <Icon name="sparkles" size={14}/>
                    <span>{ntGenLabel}</span>
                  </button>

                  {ntAdjustVis && (
                    <div style={S.sliderGrid}>
                      <Slider label="出幅" value={depthVal} min={5} max={60} display={`${depthVal}%`}
                        onChange={v=>{depthRef.current=v;setDepthVal(v);if(ntVertsRef.current)ntAdjustShape();else if(ntPtsRef.current.length===5)ntGenerate();}} />
                      <Slider label="前高さ" value={frontHVal} min={10} max={100} display={`${frontHVal}%`}
                        onChange={v=>{frontHRef.current=v;setFrontHVal(v);if(ntVertsRef.current)ntAdjustShape();else if(ntPtsRef.current.length===5)ntGenerate();}} />
                      <Slider label="地上高" value={groundVal} min={0} max={60} display={`${groundVal}%`}
                        onChange={v=>{groundRef.current=v;setGroundVal(v);if(ntVertsRef.current)ntAdjustShape();else if(ntPtsRef.current.length===5)ntGenerate();}} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 生地タブ */}
          {activeTab === 'fabric' && (
            <div>
              <div style={S.fabricRow}>
                <div style={{...S.swatch, background: swatchColor}} />
                <select value={fabIdx} onChange={e=>{setFabIdx(e.target.value);saveSettings();}}
                  style={S.select}>
                  <option value=''>生地を選択</option>
                  {fabricDB.map((f,i)=>(
                    <option key={i} value={i}>{f.maker} / {f.name} / {f.code} - {f.color}</option>
                  ))}
                </select>
              </div>

              {appMode === 'replace' && (
                <div style={S.sliderGrid}>
                  <Slider label="質感" value={blend} min={0} max={100} display={blendLabel}
                    onChange={v=>{blendRef.current=v/100;setBlend(v);const bl=v/100;setBlendLabel(bl<0.2?'自然':bl<0.5?'中間寄り':bl<0.8?'中間':'発色');if(appliedRef.current)render();saveSettings();}} />
                  <Slider label="影" value={contrast} min={-50} max={100} display={ctLabel}
                    onChange={v=>{contrastRef.current=v;setContrast(v);const ct=v;setCtLabel(ct<-20?'弱め':ct<20?'標準':ct<60?'強め':'強調');ccRef.current={cache:null,val:null};if(appliedRef.current)render();saveSettings();}} />
                </div>
              )}

              {appMode === 'new' && (
                <div>
                  <div style={S.sectionLabel}>面ごとの明るさ</div>
                  <div style={S.sliderGrid}>
                    <Slider label={ntLeftLabel} value={brightLeft} min={-80} max={80} display={`${brightLeft>0?'+':''}${brightLeft}`}
                      onChange={v=>{brightRef.current.left=v;setBrightLeft(v);if(ntAppliedRef.current)render();}} />
                    <Slider label={ntRightLabel} value={brightRight} min={-80} max={80} display={`${brightRight>0?'+':''}${brightRight}`}
                      onChange={v=>{brightRef.current.right=v;setBrightRight(v);if(ntAppliedRef.current)render();}} />
                    <Slider label="流れ面" value={brightNagare} min={-80} max={80} display={`${brightNagare>0?'+':''}${brightNagare}`}
                      onChange={v=>{brightRef.current.nagare=v;setBrightNagare(v);if(ntAppliedRef.current)render();}} />
                    <Slider label="前面" value={brightFront} min={-80} max={80} display={`${brightFront>0?'+':''}${brightFront}`}
                      onChange={v=>{brightRef.current.front=v;setBrightFront(v);if(ntAppliedRef.current)render();}} />
                  </div>
                </div>
              )}

              <button disabled={!canApply} onClick={applyFabric}
                style={{...S.btnPrimary, width: '100%', marginTop: 14, opacity: canApply ? 1 : 0.4, cursor: canApply ? 'pointer' : 'not-allowed'}}>
                <Icon name="palette" size={14}/>
                <span>生地を適用</span>
              </button>
            </div>
          )}

          {/* 出力タブ */}
          {activeTab === 'export' && (
            <div>
              <div style={{display:'flex', gap: 8, marginBottom: 8}}>
                <button disabled={!canExport} onClick={downloadImage}
                  style={{...S.btnPrimary, flex: 1, opacity: canExport ? 1 : 0.4, cursor: canExport ? 'pointer' : 'not-allowed'}}>
                  <Icon name="download" size={14}/>
                  <span>保存</span>
                </button>
                <button disabled={!canExport} onClick={shareImage}
                  style={{...S.btnSecondary, flex: 1, opacity: canExport ? 1 : 0.4, cursor: canExport ? 'pointer' : 'not-allowed'}}>
                  <Icon name="share" size={14}/>
                  <span>共有</span>
                </button>
              </div>
              <button onClick={resetAll} style={S.btnDangerOutline}>
                <Icon name="reset" size={14}/>
                <span>すべてリセット</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Icon
// ─────────────────────────────────────────
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'upload':   return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    case 'replace':  return <svg {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    case 'sparkles': return <svg {...p}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>
    case 'pen':      return <svg {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
    case 'palette':  return <svg {...p}><circle cx="13.5" cy="6.5" r=".7" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".7" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".7" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".7" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
    case 'download': return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    case 'share':    return <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    case 'eye':      return <svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'trash':    return <svg {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    case 'undo':     return <svg {...p}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
    case 'reset':    return <svg {...p}><path d="M21 12a9 9 0 1 1-3.51-7.13"/><path d="M21 4v6h-6"/></svg>
    case 'image':    return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    case 'check':    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>
    case 'info':     return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    default: return null
  }
}

// ─────────────────────────────────────────
// Slider
// ─────────────────────────────────────────
function Slider({ label, value, min, max, display, onChange }: {
  label: string; value: number; min: number; max: number; display?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 6}}>
        <span style={{fontSize: 11, color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.02em'}}>{label}</span>
        <span style={{fontSize: 11, color: '#E8342A', fontWeight: 600, fontFamily: 'var(--font-roboto-mono), monospace'}}>
          {display ?? String(value)}
        </span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e=>onChange(+e.target.value)}
        style={{width: '100%', accentColor: '#E8342A', cursor: 'pointer'}} />
    </div>
  )
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Noto Sans JP', sans-serif",
    background: '#0a0a0d',
    color: '#f5f5f7',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    userSelect: 'none',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 18px',
    background: '#0f0f12',
    borderBottom: '1px solid #1f1f24',
    flexShrink: 0,
    gap: 12,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 11 },
  brandLogo: {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg, #E8342A 0%, #c42820 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(232,52,42,0.25)',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "'Noto Serif JP', serif",
    fontSize: 15, fontWeight: 700, color: '#f5f5f7',
    lineHeight: 1, letterSpacing: '0.02em',
  },
  brandSub: {
    fontSize: 9, color: '#71717a',
    letterSpacing: '0.18em', marginTop: 4,
    fontWeight: 600,
  },
  headerActions: { display: 'flex', alignItems: 'center', gap: 8 },
  pointBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#16161b', border: '1px solid #2a2a31',
    padding: '6px 11px', borderRadius: 7,
  },
  uploadBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#16161b', border: '1px solid #2a2a31',
    color: '#f5f5f7', padding: '7px 12px', borderRadius: 7,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    transition: 'background 0.15s',
  },

  modeWrap: {
    padding: '10px 18px', background: '#0f0f12',
    borderBottom: '1px solid #1f1f24', flexShrink: 0,
  },
  modeToggle: {
    display: 'flex', background: '#16161b',
    border: '1px solid #2a2a31', borderRadius: 9, padding: 3, gap: 2,
  },
  modeBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, padding: '8px 12px', background: 'transparent',
    color: '#71717a', border: 'none', borderRadius: 7,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
    letterSpacing: '0.02em',
  },
  modeBtnActive: {
    background: '#E8342A', color: '#fff',
    boxShadow: '0 1px 3px rgba(232,52,42,0.35)',
  },

  canvasWrap: {
    flex: 1, position: 'relative', overflow: 'hidden',
    background: '#050507', touchAction: 'none',
  },
  emptyState: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 14, pointerEvents: 'none',
  },
  emptyIcon: {
    width: 64, height: 64,
    border: '1.5px dashed #2a2a31', borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#71717a',
  },
  emptyTitle: {
    color: '#a1a1aa', fontSize: 14, fontWeight: 600,
    marginTop: 4,
  },
  emptySub: {
    color: '#71717a', fontSize: 12,
    textAlign: 'center', lineHeight: 1.7,
  },
  toast: {
    position: 'absolute', top: 14, left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15,15,18,0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid', padding: '7px 14px',
    borderRadius: 999, fontSize: 12, fontWeight: 500,
    whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  beforeBadge: {
    position: 'absolute', top: 14, left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15,15,18,0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #3b82f6', color: '#3b82f6',
    padding: '5px 18px', borderRadius: 999,
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.18em',
    pointerEvents: 'none', zIndex: 10,
  },
  zoomBadge: {
    position: 'absolute', bottom: 14, right: 14,
    background: 'rgba(15,15,18,0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #2a2a31',
    color: '#a1a1aa', padding: '4px 10px', borderRadius: 999,
    fontFamily: 'var(--font-roboto-mono), monospace',
    fontSize: 11, pointerEvents: 'none', fontWeight: 500,
  },
  beforeBtn: {
    position: 'absolute', bottom: 14, left: 14,
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(15,15,18,0.92)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #3a3a42', color: '#f5f5f7',
    padding: '7px 14px', borderRadius: 999,
    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
    letterSpacing: '0.06em', cursor: 'pointer', zIndex: 10,
  },

  panel: {
    background: '#0f0f12', borderTop: '1px solid #1f1f24', flexShrink: 0,
  },
  tabs: { display: 'flex', borderBottom: '1px solid #1f1f24' },
  tab: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, padding: '12px 8px', background: 'transparent',
    color: '#71717a', border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
  },
  tabActive: {
    color: '#E8342A', borderBottomColor: '#E8342A',
  },
  tabContent: { padding: '14px 18px' },

  helpBox: {
    background: '#16161b', border: '1px solid #1f1f24',
    borderRadius: 9, padding: '10px 14px',
  },
  helpRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 12, color: '#a1a1aa',
    lineHeight: 2, fontWeight: 500,
  },
  helpDot: {
    width: 4, height: 4, borderRadius: '50%',
    background: '#E8342A', flexShrink: 0,
  },

  stepBox: {
    background: '#16161b', border: '1px solid #1f1f24',
    borderRadius: 9, padding: '11px 14px',
    display: 'flex', flexDirection: 'column', gap: 9,
    marginBottom: 10,
  },
  step: {
    display: 'flex', alignItems: 'center', gap: 8,
    flexWrap: 'wrap',
  },
  stepLabel: {
    fontSize: 9, fontWeight: 700, color: '#E8342A',
    letterSpacing: '0.14em', minWidth: 44,
  },
  stepDesc: {
    fontSize: 12, color: '#a1a1aa', flex: 1, minWidth: 0,
  },
  stepNum: {
    width: 18, height: 18, borderRadius: '50%',
    color: '#fff', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, flexShrink: 0,
  },
  ntStep: {
    fontSize: 12, color: '#3b82f6',
    marginBottom: 10, fontWeight: 500,
    padding: '7px 12px', background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.2)', borderRadius: 7,
  },
  sliderGrid: {
    display: 'flex', flexDirection: 'column', gap: 12,
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: '#71717a',
    letterSpacing: '0.14em', marginBottom: 4,
    textTransform: 'uppercase',
  },

  fabricRow: {
    display: 'flex', gap: 8, alignItems: 'center',
    marginBottom: 12,
  },
  swatch: {
    width: 32, height: 32, borderRadius: 7,
    border: '1px solid #2a2a31', flexShrink: 0,
  },
  select: {
    flex: 1, background: '#16161b', border: '1px solid #2a2a31',
    color: '#f5f5f7', padding: '9px 11px', borderRadius: 8,
    fontSize: 12, fontFamily: 'inherit', outline: 'none',
    minWidth: 0, cursor: 'pointer',
  },

  btnPrimary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, padding: '10px 14px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    border: 'none', background: '#E8342A', color: '#fff',
    transition: 'all 0.15s', letterSpacing: '0.02em',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(232,52,42,0.3)',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, padding: '10px 14px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    border: '1px solid #2a2a31', background: '#16161b',
    color: '#f5f5f7', transition: 'all 0.15s', cursor: 'pointer',
  },
  btnGhost: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '9px 12px', borderRadius: 7,
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer', border: '1px solid #2a2a31',
    background: '#16161b', color: '#a1a1aa',
    transition: 'all 0.15s',
  },
  btnDanger: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '9px 12px', borderRadius: 7,
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
    background: 'transparent', color: '#ef4444',
    transition: 'all 0.15s',
  },
  btnDangerOutline: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, padding: '10px 14px', borderRadius: 8,
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
    background: 'transparent', color: '#ef4444',
    transition: 'all 0.15s',
  },
}
