"use client";
import {useRef,useState} from "react";
export default function MobileQA() {
 const frame=useRef(null),[result,setResult]=useState("");
 return <main style={{padding:15}}><h1>Mobile elements acceptance</h1><button onClick={()=>{const w=frame.current.contentWindow,d=w.document;setResult(JSON.stringify({viewport:w.innerWidth,documentWidth:d.documentElement.scrollWidth,libraryButtons:d.querySelectorAll(".element-library-grid button").length,gridColumns:d.querySelector(".element-library-grid")?w.getComputedStyle(d.querySelector(".element-library-grid")).gridTemplateColumns:null}));}}>Measure</button><p>{result}</p><iframe ref={frame} title="Phone width editor" src="/editor/new" style={{width:390,height:850,maxWidth:"100%",border:"1px solid #777"}}/></main>;
}
