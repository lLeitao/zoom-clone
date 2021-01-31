class PeerBuilder {
    constructor({ peerConfig }) {
        this.peerConfig = peerConfig;

        const defaultFunction = () => {};
        this.onError = defaultFunction;
        this.onCallReceived = defaultFunction;
        this.onCallError = defaultFunction;
        this.onCallClose = defaultFunction;
        this.onConnectionOpened = defaultFunction;
        this.onPeerStreamReceived = defaultFunction;
    }

    setOnError(fn) {
        this.onError = fn;
        
        return this;
    }

    setOnCallReceived(fn) {
        this.onCallReceived = fn;
        
        return this;
    }

    setOnCallError(fn) {
        this.onCallError = fn;
        
        return this;
    }

    setOnCallClose(fn) {
        this.onCallClose = fn;
        
        return this;
    }

    setOnConnectionOpened(fn) {
        this.onConnectionOpened = fn;
        
        return this;
    }

    setOnPeerStreamReceived(fn) {
        this.onPeerStreamReceived = fn;

        return this;
    }

    _prepareCallEvent(call) {
        call.on('stream', stream => this.onPeerStreamReceived(call, stream));
        call.on('error', error => this.onCallError(call, error));
        call.on('close', _ => this.onCallClose(call));

        this.onCallReceived(call);
    }

    _preparePeerInstanceFunction(peerModule) {
        class PeerCustomModule extends peerModule {}

        const peerCall = PeerCustomModule.prototype.call;
        const context = this;

        PeerCustomModule.prototype.call = function(id, stream) {
            const call = peerCall.apply(this, [ id, stream ]);

            // interceptando o call adicionando todos os eventos da chamada pra quem liga
            context._prepareCallEvent(call);

            return call;
        }

        return PeerCustomModule;
    }

    build() {
        const PeerCustomInstance = this._preparePeerInstanceFunction(Peer);
        const peer = new PeerCustomInstance(...this.peerConfig);
        // const peer = new Peer(...this.peerConfig);

        peer.on('error', this.onError);
        peer.on('call', this._prepareCallEvent.bind(this));

        return new Promise( resolve => peer.on('open', id => {
            this.onConnectionOpened(peer);

            return resolve(peer);
        }))
    }

}