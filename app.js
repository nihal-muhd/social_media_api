const express = require('express')
const dotenv = require('dotenv').config({ path: './.env' })
const { errorHandler } = require('./middleware/errorMiddleware')
const connectDB = require('./config/db')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const colors = require('colors')

const port = process.env.PORT || 5000
const app = express()
// const options = {
//   Access-Control-Allow-Origin: '*'
// }
// app.options('*', cors())
connectDB()

/* routes */
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: '*'
}))
app.use(errorHandler)

app.use('/', userRouter)
app.use('/admin', adminRouter)

app.listen(port, () => console.log(`server started to port ${port}`.brightBlue))

const io = require('socket.io')(8900, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

let users = []

const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId)
  users.push({ userId, socketId })
}

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId)
}

const getUser = (userId) => {
  return users.find(user => user.userId === userId)
}

io.on('connection', (socket) => {
  // when connect
  console.log('a user connected..')

  // take userId and socket from user
  socket.on('addUser', userId => {
    addUser(userId, socket.id)
    io.emit('getUsers', users)
  })

  // send and get message
  socket.on('sendMessage', ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId)
    io.to(user?.socketId).emit('getMessage', {
      senderId,
      text
    })
  })

  // when disconnect
  socket.on('disconnect', () => {
    console.log('a user disconnected')
    removeUser(socket.id)
    io.emit('getUsers', users)
  })
})
