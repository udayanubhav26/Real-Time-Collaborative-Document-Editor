require('dotenv').config()
const mongoose = require('mongoose')
const Document = require('./document')

const PORT = process.env.PORT || 3001

// CONNECT TO MONGODB
mongoose.connect(
  process.env.MONGO_URI
)
.then(() => {
    console.log("✅ MongoDB Atlas connected")

    // START SOCKET SERVER ONLY AFTER DB CONNECTS
    startServer()
})
.catch(err => console.error("❌ MongoDB connection error:", err))


function startServer() {

    const io = require('socket.io')(PORT, {
        cors: {
            origin: 'https://real-time-collaborative-document-ed.vercel.app/',
            methods: ['GET', 'POST'],
        },
    })

    const defaultValue = ""

    console.log("🚀 Socket server running on port 3001")

    io.on('connection', socket => {
        console.log("User connected:", socket.id)

        socket.on('get-document', async documentId => {
            const document = await findOrCreateDocument(documentId)

            socket.join(documentId)
            socket.emit('load-document', document.data)

            socket.on('send-changes', delta => {
                socket.broadcast.to(documentId).emit("receive-changes", delta)
            })

            socket.on("save-document", async data => {
                await Document.findByIdAndUpdate(documentId, { data })
            })
        })
    })

    async function findOrCreateDocument(id){
        if(id == null) return

        const document = await Document.findById(id)
        if(document) return document

        return await Document.create({
            _id: id,
            data: defaultValue
        })
    }
}