import React, { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const SAVE_INTERVAL_MS = 2000

const TOOLBAR_OPTIONS = [

  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],

  [{ color: [] }, { background: [] }],

  [{ script: "sub" }, { script: "super" }],

  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],

  [{ indent: "-1" }, { indent: "+1" }],

  [{ direction: "rtl" }],

  [{ align: [] }],

  ["link", "image", "video", "formula"],

  ["clean"]
]

export default function TextEditor() {

  const { id: documentId } = useParams()

  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  // SOCKET CONNECTION
  useEffect(() => {

    const s = io(
      "https://real-time-collaborative-document-editor-6gy9.onrender.com",
      {
        transports: ["websocket", "polling"]
      }
    )

    s.on("connect", () => {
      console.log("✅ Connected:", s.id)
    })

    s.on("connect_error", (err) => {
      console.log("❌ Socket Error:", err.message)
    })

    setSocket(s)

    return () => {
      s.disconnect()
    }

  }, [])

  // LOAD DOCUMENT
  useEffect(() => {

    if (socket == null || quill == null) return

    socket.once("load-document", document => {
      quill.setContents(document)
      quill.enable()
    })

    socket.emit("get-document", documentId)

  }, [socket, quill, documentId])

  // SAVE DOCUMENT
  useEffect(() => {

    if (socket == null || quill == null) return

    const interval = setInterval(() => {

      socket.emit("save-document", quill.getContents())

    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }

  }, [socket, quill])

  // SEND CHANGES
  useEffect(() => {

    if (socket == null || quill == null) return

    const handler = (delta, oldDelta, source) => {

      if (source !== "user") return

      socket.emit("send-changes", delta)

    }

    quill.on("text-change", handler)

    return () => {
      quill.off("text-change", handler)
    }

  }, [socket, quill])

  // RECEIVE CHANGES
  useEffect(() => {

    if (socket == null || quill == null) return

    const handler = delta => {
      quill.updateContents(delta)
    }

    socket.on("receive-changes", handler)

    return () => {
      socket.off("receive-changes", handler)
    }

  }, [socket, quill])

  // QUILL INITIALIZATION
  const wrapperRef = useCallback(wrapper => {

    if (wrapper == null) return

    wrapper.innerHTML = ""

    const editor = document.createElement("div")

    wrapper.append(editor)

    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS
      }
    })

    q.disable()
    q.setText("Loading document...")

    setQuill(q)

  }, [])

  return (
    <div className="editor-page">
      
      <div className="editor-navbar">
        <h1>Editra</h1>
        <p>Real-Time Collaborative Document Editor</p>
      </div>

      <div className="container" ref={wrapperRef}></div>

    </div>
  )
}