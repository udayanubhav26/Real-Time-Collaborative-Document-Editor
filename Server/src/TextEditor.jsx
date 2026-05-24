import React, { useCallback, useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import {io} from 'socket.io-client'  //to connect to server
import { useParams } from 'react-router-dom'

const TOOLBAR_OPTIONS = [
  // Text Style
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],

  // Headers
  [{ header: 1 }, { header: 2 }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  // Font & Size
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],

  // Colors
  [{ color: [] }, { background: [] }],

  // Script
  [{ script: "sub" }, { script: "super" }],

  // Lists
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],

  // Indent
  [{ indent: "-1" }, { indent: "+1" }],

  // Direction (RTL support)
  [{ direction: "rtl" }],

  // Alignment
  [{ align: [] }],

  // Media
  ["link", "image", "video", "formula"],

  // Clear Formatting
  ["clean"]
]

export default function TextEditor() {
  const {id: documentId} = useParams()
  const [socket, setSocket] = useState()     //for connecting
  const [quill , setQuill] = useState()      //for connecting

  useEffect(() => {
    const s = io("http://localhost:3001")  //to connect to server
    setSocket(s)

    return () => {
      s.disconnect()
    }
  },[])

  useEffect(()=>{
    
    if(socket == null || quill == null) return

    socket.once('load-document', document => {  //this
      quill.setContents(document)
      quill.enable()
    })

    socket.emit('get-document', documentId)  //seperating both document
  }, [socket, quill, documentId])

  useEffect(()=>{
    if(socket == null || quill == null) return

    const interval = setInterval(() => {

    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }

  }, [socket, quill])

  useEffect(()=>{
    if (socket==null || quill == null) return
    const handler = (delta, oldDelta, source)=> {
      if(source !== 'user') return
      socket.emit("send-changes", delta)
    }
    quill.on('text-change', handler)
  
  return () =>{
    quill.off('text-change', handler)
  }
  
  },[socket, quill])
  useEffect(()=>{
    if (socket==null || quill == null) return
    const handler = (delta)=> {
      quill.updateContents(delta)
    }
    socket.on('receive-changes', handler)
  
  return () =>{
    socket.off('receive-changes', handler)
  }
  
  },[socket, quill])

  const wrapperRef = useCallback((wrapper)=>{
    if (wrapper == null) return
    wrapper.innerHTML = ""

    const editor = document.createElement('div')
    wrapper.append(editor)
    const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS }})
    q.enable(false)  //this 
    q.setText('Loading...')  //this
    setQuill(q)
     
  },[])
  return <div className='container' ref= { wrapperRef }></div>
}
