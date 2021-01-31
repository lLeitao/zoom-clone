class Business {
    constructor({ room, media, view, socketBuilder, peerBuilder }) {
        this.media = media;
        this.room = room;
        this.view = view;

        this.socketBuilder = socketBuilder;
        this.peerBuilder = peerBuilder;

        this.currentStream = {};
        this.currentPeer = {};
        this.socket = {};

        this.peers = new Map();
        this.usersRecordings = new Map();
    }

    static initialize(deps) {
        const instance = new Business(deps);
        return instance._init();
    }

    async _init() {

        // Record button
        this.view.configureRecordButton(this.onRecordPressed.bind(this));
        this.view.configureLeaveButton(this.onLeavePressed.bind(this));

        // Capturar camera
        this.currentStream = await this.media.getCamera();

        // Inicializar socket
        this.socket = this.socketBuilder
            .setOnUserConnected( this.onUserConnected() )
            .setOnUserDisconnected(this.onUserDisconnected())
            .build();
        
        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnCallError(this.onPeerCallError())
            .setOnCallClose(this.onPeerCallClose())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .build()
        
        this.addVideoStream(this.currentPeer.id);

        // console.log('init', this.currentStream);
    }

    addVideoStream(userId, stream = this.currentStream) {
        const recorderInstance = new Recorder(userId, stream);
        this.usersRecordings.set(recorderInstance.filename, recorderInstance);
        
        if(this.recordingEnabled) {
            recorderInstance.startRecording();
        }
        
        const isCurrentId = userId === this.currentPeer.id;
        this.view.renderVideo({
            userId,
            stream,
            isCurrentId,
            muted: true
        })
    }

    onUserConnected() {
        return userId => {
            console.log('user connected!', userId);
            this.currentPeer.call(userId, this.currentStream);
        }
    }

    onUserDisconnected() {
        return userId => {
            console.log('user disconnected!', userId);

            if( this.peers.has(userId) ) {
                this.peers.get(userId).call.close();
                this.peers.delete(userId);
                
            }

            console.log(this.peers.size)
            this.view.setParticipants(this.peers.size);
            this.view.removeVideoElement(userId);
            this.stopRecording(userId);

        }
    }

    onPeerError() {
        return error => {
            console.error('error on peer!', error);
        }
    }

    onPeerConnectionOpened() {
        return (peer) => {
            const id = peer.id
            this.socket.emit('join-room', this.room, id);
        }
    }

    onPeerCallReceived() {
        return call => {
            console.log('answering call', call);
            call.answer(this.currentStream);
        }
    }

    onPeerStreamReceived() {
        return (call, stream ) => {
            const callerId = call.peer;

            if( this.peers.has(callerId) ) return;

            console.log('render User', callerId)

            this.addVideoStream(callerId, stream);
            this.peers.set(callerId, { call });
            this.view.setParticipants(this.peers.size);
        }
    }

    onPeerCallError() {
        return (call, error) => {
            console.log('on call error ocurrend!', error);

            this.view.removeVideoElement(call.peer);
        }
    }

    onPeerCallClose() {
        return (call) => {
            console.log('on call close ocurrend!', call.peer);
        }
    }

    onRecordPressed(recordingEnabled) {
        this.recordingEnabled = recordingEnabled;
        console.log('press', recordingEnabled)

        for( const [key, value] of this.usersRecordings ) {
            if(this.recordingEnabled) {
                value.startRecording();
                continue;
            }

            this.stopRecording(key);
        }

    }

    // se um usuário entrar ou sair da call temos que parar todas as gravações dele
    async stopRecording(userId) {
        const usersRecordings = this.usersRecordings;

        for( const [key, value] of usersRecordings ){
            const isContextUser = key.includes(userId);

            if(!isContextUser) continue;

            const rec = value;
            const isRecordingActive = rec.recordingActive;

            if(!isRecordingActive) continue;

            await rec.stopRecording();
            this.playRecordings(key);
        } 
    }

    playRecordings(userId) {
        const user = this.usersRecordings.get(userId);
        const videoURLs = user.getAllVideoURLs();

        videoURLs.map(url => {
            this.view.renderVideo({ url, userId });
        })
    }

    onLeavePressed() {
        this.usersRecordings.forEach( (value, key) => value.download() );
    }
}