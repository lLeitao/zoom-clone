class SocketBuilder {
    constructor({ socketUrl }) {
        this.socketUrl = socketUrl;
        this.onUserConnected = () => {};
        this.onUserDisconnected = () => {};
        this.onScreenConnected = () => {};
    }

    setOnUserConnected(fn) {
        this.onUserConnected = fn;

        return this;
    }

    setOnUserDisconnected(fn) {
        this.onUserDisconnected = fn;
        
        return this;
    }
    
    setOnScreenConnected(fn) {
        this.onScreenConnected = fn;

        return this;
    }

    build() {
        const socket = io.connect(this.socketUrl, {
            withCredentitals: false
        });

        socket.on('user-connected', this.onUserConnected);
        socket.on('user-disconnected', this.onUserDisconnected);
        socket.on('screen-connected', this.onScreenConnected);

        return socket;
    }
}