import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react'
import './styles.css'
import './motion.css'

const PRESETS = {
  LL: [30, 20, 10, 25, 5],
  RR: [10, 20, 30, 15, 35],
  LR: [30, 10, 20, 5, 25],
  RL: [10, 30, 20, 5, 35],
  MIX: [7, 8, 9, 2, 1, 5, 6, 4]
}

const clone = n => n ? ({ value:n.value, height:n.height, displayBalance:n.displayBalance, left:clone(n.left), right:clone(n.right) }) : null
const h = n => n?.height || 0
const update = n => { n.height = Math.max(h(n.left), h(n.right)) + 1 }
const balance = n => h(n.left) - h(n.right)
const rightRotate = y => { const x=y.left, t=x.right; x.right=y; y.left=t; update(y); update(x); return x }
const leftRotate = x => { const y=x.right, t=y.left; y.left=x; x.right=t; update(x); update(y); return y }

function buildTimeline(values) {
  let root = null
  const frames = [{ tree:null, kind:'idle', queueIndex:0 }]
  const push = data => frames.push({ tree:clone(root), ...data })
  values.forEach((value, queueIndex) => {
    push({ kind:'launch', activeValue:value, queueIndex })
    if (!root) {
      root = { value, height:1, displayBalance:0, left:null, right:null }
      push({ kind:'insert', activeValue:value, focus:value, queueIndex })
      push({ kind:'settle', focus:value, queueIndex:queueIndex+1 })
      return
    }
    let current=root, parent=null
    const path=[]
    while(current) {
      path.push(current); parent=current
      const direction=value < current.value ? 'left' : 'right'
      const next=direction==='left' ? current.left : current.right
      push({ kind:'compare', activeValue:value, focus:current.value, direction, queueIndex })
      push({ kind:'slide', activeValue:value, focus:current.value, target:next?.value, direction, queueIndex })
      current = next
    }
    const node={ value, height:1, displayBalance:null, left:null, right:null }
    if(value < parent.value) parent.left=node; else parent.right=node
    path.push(node)
    push({ kind:'insert', activeValue:value, focus:value, queueIndex })
    // The white forest sprite begins at the newly created leaf, then climbs
    // toward the root while recomputing height and balance at each stop.
    push({ kind:'visit', focus:value, activeValue:value, queueIndex, leafCheck:true })
    node.displayBalance=balance(node)
    push({ kind:'check', focus:value, activeValue:value, balance:node.displayBalance, queueIndex, leafCheck:true })
    let rotationRoot=null
    const rotationChecks=new Set()
    let child=node
    for(let i=path.length-2; i>=0; i--) {
      const n=path[i]
      push({ kind:'visit', focus:n.value, activeValue:value, queueIndex })
      update(n)
      n.displayBalance=balance(n)
      push({ kind:'check', focus:n.value, activeValue:value, balance:n.displayBalance, queueIndex })
      const b=balance(n)
      if(Math.abs(b)>1) {
        let type, rotated
        const attach=subtree=>{
          if(i===0) root=subtree
          else if(path[i-1].left===n) path[i-1].left=subtree
          else path[i-1].right=subtree
        }
        if(b>1 && value<n.left.value) {
          type='LL'; push({kind:'unbalanced',focus:n.value,rotation:type,queueIndex})
          const pivot=n.value; rotated=rightRotate(n); attach(rotated)
          rotationRoot=rotated
          rotationChecks.add(pivot); rotationChecks.add(rotated.value)
          push({kind:'rotate',focus:rotated.value,pivot,promoted:rotated.value,turn:'right',rotation:type,phase:1,totalPhases:1,queueIndex})
        } else if(b<-1 && value>n.right.value) {
          type='RR'; push({kind:'unbalanced',focus:n.value,rotation:type,queueIndex})
          const pivot=n.value; rotated=leftRotate(n); attach(rotated)
          rotationRoot=rotated
          rotationChecks.add(pivot); rotationChecks.add(rotated.value)
          push({kind:'rotate',focus:rotated.value,pivot,promoted:rotated.value,turn:'left',rotation:type,phase:1,totalPhases:1,queueIndex})
        } else if(b>1) {
          type='LR'; push({kind:'unbalanced',focus:n.value,rotation:type,queueIndex})
          const firstPivot=n.left.value; n.left=leftRotate(n.left)
          rotationChecks.add(firstPivot); rotationChecks.add(n.left.value)
          push({kind:'rotate',focus:n.left.value,pivot:firstPivot,promoted:n.left.value,turn:'left',rotation:type,phase:1,totalPhases:2,queueIndex})
          const pivot=n.value; rotated=rightRotate(n); attach(rotated)
          rotationRoot=rotated
          rotationChecks.add(pivot); rotationChecks.add(rotated.value)
          push({kind:'rotate',focus:rotated.value,pivot,promoted:rotated.value,turn:'right',rotation:type,phase:2,totalPhases:2,queueIndex})
        } else {
          type='RL'; push({kind:'unbalanced',focus:n.value,rotation:type,queueIndex})
          const firstPivot=n.right.value; n.right=rightRotate(n.right)
          rotationChecks.add(firstPivot); rotationChecks.add(n.right.value)
          push({kind:'rotate',focus:n.right.value,pivot:firstPivot,promoted:n.right.value,turn:'right',rotation:type,phase:1,totalPhases:2,queueIndex})
          const pivot=n.value; rotated=leftRotate(n); attach(rotated)
          rotationRoot=rotated
          rotationChecks.add(pivot); rotationChecks.add(rotated.value)
          push({kind:'rotate',focus:rotated.value,pivot,promoted:rotated.value,turn:'left',rotation:type,phase:2,totalPhases:2,queueIndex})
        }
        break
      }
      child=n
    }
    // Heights above a rotated subtree can change.
    const fix=n => { if(!n)return 0; n.height=Math.max(fix(n.left),fix(n.right))+1; return n.height }; fix(root)
    if(rotationRoot) {
      const routeToRoot=[]
      const findRoute=(n,target)=>{
        if(!n)return false
        routeToRoot.push(n)
        if(n.value===target)return true
        if(findRoute(n.left,target)||findRoute(n.right,target))return true
        routeToRoot.pop(); return false
      }
      findRoute(root,rotationRoot.value)
      const visited=new Set()
      const orderedChecks=[]
      const collectAffected=(n)=>{
        if(!n)return
        collectAffected(n.left)
        collectAffected(n.right)
        if(rotationChecks.has(n.value))orderedChecks.push(n)
      }
      collectAffected(rotationRoot)
      for(const n of orderedChecks) {
        push({kind:'visit',focus:n.value,queueIndex,verified:true})
        n.displayBalance=balance(n)
        push({kind:'check',focus:n.value,queueIndex,verified:true})
        visited.add(n.value)
      }
      for(let j=routeToRoot.length-1;j>=0;j--) {
        const n=routeToRoot[j]
        if(visited.has(n.value))continue
        push({kind:'visit',focus:n.value,queueIndex,verified:true})
        n.displayBalance=balance(n)
        push({kind:'check',focus:n.value,queueIndex,verified:true})
      }
    }
    push({ kind:'settle', focus:value, queueIndex:queueIndex+1 })
  })
  return frames
}

function layoutTree(root) {
  const nodes=[], edges=[]
  const depthOf=n=>n ? Math.max(depthOf(n.left),depthOf(n.right))+1 : 0
  const maxDepth=Math.max(0,depthOf(root)-1)
  // Reserve clear space above the ground even for deep, data-heavy AVL trees.
  const verticalGap=Math.min(21,72/Math.max(1,maxDepth))
  // Keep the root pinned to the centre from the very first insertion. Each
  // generation receives half of its parent's horizontal space, so branches
  // grow down and outward instead of shifting the whole tree sideways.
  const walk=(n, depth, min=10, max=90) => {
    if(!n)return
    const y=11+depth*verticalGap
    const x=(min+max)/2
    const leftX=(min+x)/2
    const rightX=(x+max)/2
    const childY=y+verticalGap
    nodes.push({...n,x,y,depth,balance:balance(n),leftSlot:{x:leftX,y:childY},rightSlot:{x:rightX,y:childY}})
    if(n.left){ edges.push({from:n.value,to:n.left.value,x1:x,y1:y,x2:leftX,y2:childY}); walk(n.left,depth+1,min,x) }
    if(n.right){ edges.push({from:n.value,to:n.right.value,x1:x,y1:y,x2:rightX,y2:childY}); walk(n.right,depth+1,x,max) }
  }
  walk(root,0); return {nodes,edges}
}

function useSound(enabled) {
  const ctx=useRef(null)
  return (kind) => {
    if(!enabled)return
    ctx.current ||= new (window.AudioContext||window.webkitAudioContext)()
    const c=ctx.current, o=c.createOscillator(), g=c.createGain(); o.connect(g); g.connect(c.destination)
    const map={compare:[420,.04],insert:[620,.12],unbalanced:[155,.22],rotate:[780,.18],settle:[520,.08]}
    const [freq,dur]=map[kind]||[350,.04]; o.frequency.setValueAtTime(freq,c.currentTime)
    if(kind==='rotate') o.frequency.exponentialRampToValueAtTime(1100,c.currentTime+dur)
    g.gain.setValueAtTime(.0001,c.currentTime); g.gain.exponentialRampToValueAtTime(.08,c.currentTime+.01); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur)
    o.start(); o.stop(c.currentTime+dur)
  }
}

function TreeNode({node, current, previous, stageRef, rotationWaveMaxDepth, treeScale, playbackSpeed}) {
  const ref=useRef(null)
  const movement=useRef(null)
  // A node that did not exist in the preceding frame is genuinely being
  // created now. Give that one crate its own birth sequence instead of
  // making it appear as an already-filled box.
  const isBorn=current.kind==='insert' && current.focus===node.value && !previous
  useLayoutEffect(()=>{
    if(current.kind!=='rotate'||!previous||!ref.current||!stageRef.current)return
    const dx=(previous.x-node.x)*stageRef.current.clientWidth/100
    const dy=(previous.y-node.y)*stageRef.current.clientHeight/100
    if(Math.abs(dx)<2&&Math.abs(dy)<2)return
    const role=current.promoted===node.value?'promoted':current.pivot===node.value?'pivot':'branch'
    const sourceDepth=previous?.depth ?? node.depth
    const waveDelay=Math.max(0,rotationWaveMaxDepth-sourceDepth)*1300
    const delay=(waveDelay+(role==='pivot'?100:role==='promoted'?50:0))/playbackSpeed
    const duration=1250/playbackSpeed
    const turnDirection=current.turn==='right'?1:-1
    const swingX=turnDirection*Math.min(34,Math.max(14,Math.abs(dx)*.12))
    const lift=Math.min(70,Math.max(26,Math.abs(dy)*.2))
    const keyframes=role==='promoted'
      ? [
          {transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(0deg)`,offset:0},
          {transform:`translate(-50%,-50%) translate(${dx*.72+swingX}px,${dy*.72-lift}px) rotate(${turnDirection*38}deg)`,offset:.34},
          {transform:`translate(-50%,-50%) translate(${dx*.2-swingX*.3}px,${dy*.2-lift*.25}px) rotate(${turnDirection*-13}deg)`,offset:.72},
          {transform:'translate(-50%,-50%)',offset:1}
        ]
      : role==='pivot'
        ? [
            {transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(0deg)`,offset:0},
            {transform:`translate(-50%,-50%) translate(${dx*.58}px,${dy*.58+lift*.65}px) rotate(${turnDirection*-25}deg)`,offset:.4},
            {transform:`translate(-50%,-50%) translate(${dx*.18}px,${dy*.18+lift*.2}px) rotate(${turnDirection*9}deg)`,offset:.74},
            {transform:'translate(-50%,-50%)',offset:1}
          ]
        : [
            {transform:`translate(-50%,-50%) translate(${dx}px,${dy}px)`,offset:0},
            {transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.5-lift*.18}px)`,offset:.55},
            {transform:'translate(-50%,-50%)',offset:1}
          ]
    movement.current?.cancel()
    movement.current=ref.current.animate(keyframes,{delay,duration,easing:'cubic-bezier(.2,.75,.25,1)',fill:'both'})
  },[current.kind,current.rotation,current.phase,current.turn,node.x,node.y,previous,stageRef,rotationWaveMaxDepth,playbackSpeed])
  const moved=previous&&(Math.abs(previous.x-node.x)>0.1||Math.abs(previous.y-node.y)>0.1)
  const isFocused=current.kind!=='settle'&&current.focus===node.value
  return <div ref={ref} className={`node ${isBorn?'born':''} ${isFocused?'focus':''} ${Math.abs(node.displayBalance??0)>1?'danger':''} ${current.kind==='rotate'&&moved?'rotated':''} ${current.promoted===node.value?'promoted':''} ${current.pivot===node.value?'pivot':''}`} style={{left:`${node.x}%`,top:`${node.y}%`,'--node-scale':treeScale}}>
    <div className="leaf l"/><div className="leaf r"/><div className="crate"><span>{node.value}</span>{isBorn&&<span className="data-ball" aria-hidden="true">{node.value}</span>}{node.displayBalance!=null&&<small className="balance">{node.displayBalance>0?`+${node.displayBalance}`:node.displayBalance}</small>}</div>
  </div>
}

function App(){
  const [values,setValues]=useState(PRESETS.MIX)
  const [input,setInput]=useState(PRESETS.MIX.join(', '))
  const [frame,setFrame]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [speed,setSpeed]=useState(1)
  const [sound,setSound]=useState(true)
  const stageRef=useRef(null)
  const previousPositions=useRef(new Map())
  const previousEdges=useRef([])
  const timeline=useMemo(()=>buildTimeline(values),[values])
  const current=timeline[Math.min(frame,timeline.length-1)]
  const {nodes,edges}=useMemo(()=>layoutTree(current.tree),[current.tree])
  const ping=useSound(sound)
  const changedRotationDepths=current.kind==='rotate'
    ? nodes.flatMap(node=>{
      const old=previousPositions.current.get(node.value)
      return old&&(Math.abs(old.x-node.x)>0.1||Math.abs(old.y-node.y)>0.1)?[old.depth]:[]
    })
    : []
  const rotationWaveMaxDepth=Math.max(0,...changedRotationDepths)
  const rotationWaveSpan=changedRotationDepths.length
    ? rotationWaveMaxDepth-Math.min(...changedRotationDepths)
    : 0
  const treeDepth=Math.max(0,...nodes.map(node=>node.depth))
  const treeScale=Math.max(.2,Math.min(1,1-Math.max(0,treeDepth-2)*.11-Math.max(0,nodes.length-8)*.012))

  useEffect(()=>{
    if(!playing)return
    if(frame>=timeline.length-1){ setPlaying(false); return }
    const rotationDelay=Math.max(1900,rotationWaveSpan*1300+1700)
    const delay=(current.kind==='insert'?1450:current.kind==='unbalanced'?1100:current.kind==='rotate'?rotationDelay:current.kind==='compare'?950:current.kind==='slide'?1200:current.kind==='visit'?750:current.kind==='check'?500:current.kind==='settle'?500:750)/speed
    const id=setTimeout(()=>setFrame(f=>f+1),delay); return()=>clearTimeout(id)
  },[playing,frame,timeline.length,speed,current.kind])
  useEffect(()=>{ if(frame>0&&current.kind!=='visit') ping(current.kind) },[frame])
  useEffect(()=>{
    previousPositions.current=new Map(nodes.map(n=>[n.value,{x:n.x,y:n.y,depth:n.depth}]))
    previousEdges.current=edges
  },[frame,nodes,edges])

  const choose=(key)=>{const v=PRESETS[key];setValues(v);setInput(v.join(', '));setFrame(0);setPlaying(false)}
  const apply=()=>{const parsed=input.split(/[\s,]+/).map(Number).filter(Number.isFinite).filter((v,i,a)=>a.indexOf(v)===i);if(parsed.length){setValues(parsed);setFrame(0);setPlaying(false)}}
  const progress=timeline.length>1?frame/(timeline.length-1)*100:0
  const route=(()=>{
    if(current.kind!=='compare'&&current.kind!=='slide')return null
    const from=nodes.find(n=>n.value===current.focus)
    if(!from)return null
    const target=nodes.find(n=>n.value===current.target) || (current.direction==='left'?from.leftSlot:from.rightSlot)
    return {from,target}
  })()
  const rotationGuide=(()=>{
    if(current.kind!=='rotate')return null
    const pivot=previousPositions.current.get(current.pivot)
    const promoted=previousPositions.current.get(current.promoted)
    return pivot&&promoted?{pivot,promoted}:null
  })()
  const sameEdge=(a,b)=>a.from===b.from&&a.to===b.to&&Math.abs(a.x1-b.x1)<0.01&&Math.abs(a.y1-b.y1)<0.01&&Math.abs(a.x2-b.x2)<0.01&&Math.abs(a.y2-b.y2)<0.01
  const oldRotationEdges=current.kind==='rotate'
    ? previousEdges.current.filter(old=>!edges.some(next=>sameEdge(old,next)))
    : []
  const newRotationEdges=current.kind==='rotate'
    ? edges.filter(next=>!previousEdges.current.some(old=>sameEdge(old,next)))
    : []
  return <main className="app">
    <div className="ambient a1"/><div className="ambient a2"/>
    <header>
      <div className="brand"><div className="brandmark"><Sparkles size={18}/></div><div><strong>AVL FOREST</strong><span>balanced by nature</span></div></div>
      <div className="header-actions">
        <button className="iconbtn" onClick={()=>setSound(!sound)} aria-label="소리 켜기/끄기">{sound?<Volume2/>:<VolumeX/>}</button>
        <div className="speed">{[.75,1,1.5,2].map(s=><button key={s} className={speed===s?'on':''} onClick={()=>setSpeed(s)}>{s}×</button>)}</div>
      </div>
    </header>

    <section className="queue-wrap">
      <div className="queue">
        {values.map((v,i)=><div key={`${v}-${i}`} className={`seed ${i<current.queueIndex?'done':''} ${i===current.queueIndex&&current.activeValue!=null?'active':''}`}><i/>{v}</div>)}
      </div>
    </section>

    <section ref={stageRef} className={`stage ${current.kind==='unbalanced'?'quake':''} ${current.kind==='rotate'?'rotating':''}`} style={{'--playback-speed':speed}}>
      {current.kind==='rotate'&&<svg className="old-ropes" viewBox="0 0 100 100" preserveAspectRatio="none">
        {oldRotationEdges.map(e=><path key={`old-${e.from}-${e.to}`} style={{animationDelay:`${Math.max(0,rotationWaveMaxDepth-(previousPositions.current.get(e.to)?.depth??0))*1300/speed}ms`}} d={`M ${e.x1} ${e.y1+3} C ${e.x1} ${e.y1+12}, ${e.x2} ${e.y2-10}, ${e.x2} ${e.y2-3}`} />)}
      </svg>}
      {rotationGuide&&<svg className={`rotation-rope ${current.turn}`} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><marker id="rotation-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7 z"/></marker></defs>
        <path d={`M ${rotationGuide.pivot.x} ${rotationGuide.pivot.y} Q ${(rotationGuide.pivot.x+rotationGuide.promoted.x)/2} ${(rotationGuide.pivot.y+rotationGuide.promoted.y)/2-7} ${rotationGuide.promoted.x} ${rotationGuide.promoted.y}`} markerEnd="url(#rotation-arrow)" />
      </svg>}
      <svg className="ropes" viewBox="0 0 100 100" preserveAspectRatio="none">
        {(current.kind==='rotate'?newRotationEdges:edges).map(e=><path key={`${e.from}-${e.to}`} className={current.kind==='rotate'?'branch-growing':''} style={current.kind==='rotate'?{animationDelay:`${Math.max(0,rotationWaveMaxDepth-(previousPositions.current.get(e.to)?.depth??nodes.find(n=>n.value===e.to)?.depth??0))*1300/speed}ms`}:undefined} d={`M ${e.x1} ${e.y1+3} C ${e.x1} ${e.y1+12}, ${e.x2} ${e.y2-10}, ${e.x2} ${e.y2-3}`} />)}
      </svg>
      {route&&<svg className={`slide-rail ${current.kind}`} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={`M ${route.from.x} ${route.from.y-3} C ${route.from.x} ${route.from.y+8}, ${route.target.x} ${route.target.y-11}, ${route.target.x} ${route.target.y-4}`} />
      </svg>}
      {nodes.map(n=><TreeNode key={n.value} node={n} current={current} previous={previousPositions.current.get(n.value)} stageRef={stageRef} rotationWaveMaxDepth={rotationWaveMaxDepth} treeScale={treeScale} playbackSpeed={speed}/>)}
      {route&&<div className={`node-scale ${current.direction}`} style={{left:`${route.from.x}%`,top:`${route.from.y}%`}} aria-hidden="true"><i/><b/><em/><span/></div>}
      {current.activeValue!=null && (current.kind==='launch'||current.kind==='compare'||current.kind==='slide') && <div className={`traveler ${current.kind==='slide'?'sliding':''}`} style={(()=>{
        if(current.kind==='slide'&&route)return {left:`${route.target.x}%`,top:`${route.target.y-7}%`}
        const f=nodes.find(n=>n.value===current.focus);return f?{left:`${f.x}%`,top:`${Math.max(2,f.y-12)}%`}:{left:'50%',top:'2%'}
      })()}>{current.activeValue}</div>}
      {(current.kind==='visit'||current.kind==='check') && <div className="balance-spark" style={(()=>{const f=nodes.find(n=>n.value===current.focus);return f?{left:`${f.x}%`,top:`${f.y}%`}:{}})()}><i/><b/></div>}
      {current.kind==='rotate'&&<div className={`rotation-axis ${current.turn}`} style={(()=>{const f=nodes.find(n=>n.value===current.promoted);return f?{left:`${f.x}%`,top:`${f.y}%`}:{left:'50%',top:'30%'}})()}><i/></div>}
      {!current.tree&&<div className="empty-tree"><div className="soil"/><div className="sprout">♧</div></div>}
      {current.rotation&&<div className={`rotation-badge ${current.kind}`}>{current.rotation}</div>}
      <div className="ground"><span/><span/><span/></div>
    </section>

    <section className="controls">
      <div className="transport">
        <button className="ghost" onClick={()=>{setFrame(0);setPlaying(false)}} aria-label="다시 시작"><RotateCcw/></button>
        <button className="play" onClick={()=>{if(frame>=timeline.length-1)setFrame(0);setPlaying(!playing)}}>{playing?<Pause/>:<Play fill="currentColor"/>}</button>
        <input
          className="progress"
          type="range"
          min="0"
          max={Math.max(1,timeline.length-1)}
          step="1"
          value={frame}
          onChange={e=>{setPlaying(false);setFrame(Number(e.target.value))}}
          style={{'--progress':`${progress}%`}}
          aria-label="재생 위치"
          aria-valuetext={`${frame+1} / ${timeline.length}`}
        />
        <span className="counter">{current.kind==='idle'?0:Math.min(current.queueIndex+(current.kind==='settle'?0:1),values.length)} / {values.length}</span>
      </div>
      <div className="setup">
        <div className="presets">{Object.keys(PRESETS).map(k=><button key={k} onClick={()=>choose(k)}>{k}</button>)}</div>
        <div className="entry"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&apply()} aria-label="삽입할 숫자"/><button onClick={apply}>적용</button></div>
      </div>
    </section>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>)
