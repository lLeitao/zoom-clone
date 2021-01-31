const server = require('http').createServer((req, res) => {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    });

    res.end('hey');
})

const socketIo = require('socket.io');
const io = socketIo(server, {
    cors: {
        origin: '*',
        credentials: false
    }
});

io.on('connection', socket => {
    console.log("connection", socket.id);

    socket.on('join-room', (roomId, userId) => {

        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId);

        socket.on('disconnect', () => {
            console.log('logout');
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });
    });

    socket.on('screen-shared', (roomId, userId) => {

        console.log("screeeen", roomId, userId)

        const screenId = `screen:${userId}`;

        socket.join(roomId);
        socket.to(roomId).broadcast.emit('screen-connected', screenId);

        socket.on('screen-disconnect', () => {
            socket.to(roomId).broadcast.emit('screen-disconnected', screenId);
        });
    });
});

const startServer = () => {
    const { address, port } = server.address();
    console.info(`app running at ${address}:${port}`);

}

server.listen(process.env.PORT || 3000, startServer);