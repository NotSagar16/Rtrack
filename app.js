const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const activeUsers=[]

io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    const userAgent = socket.handshake.headers['user-agent'];
    activeUsers.push({
        id: socket.id,
        userAgent: userAgent,
        // Add more user-related data as needed
    });

    socket.on('send-location', (data) => {
        const index = activeUsers.findIndex(user => user.id === socket.id);
        if (index !== -1) {
            // Update existing user's location
            activeUsers[index] = { ...activeUsers[index], ...data };
        } else {
            // Add new user to activeUsers array
            activeUsers.push({ id: socket.id, ...data });
        }
        io.emit('receive-location', { id: socket.id, ...data });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const index = activeUsers.findIndex(user => user.id === socket.id);
        if (index !== -1) {
            activeUsers.splice(index, 1);
        }
        io.emit('user-disconnected', socket.id);
    });

    socket.on('request-active-users', () => {
        // Emit active users to the requester
        socket.emit('active-users', activeUsers);
    });

});

app.get('/', (req, res) => {
    res.render('index');
});
app.get('/users',function(req,res){
    res.render("users", { activeUsers })
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
