class View {
    constructor() {
        this.recorderBtn = document.getElementById('record');
        this.leaveBtn = document.getElementById('leave');
        this.shareBtn = document.getElementById('shareScreen');
    }

    createVideoElement({ muted = true, src, srcObject }) {
        const video = document.createElement('video');
        video.muted = muted;
        video.src = src;
        video.srcObject = srcObject;

        if(src) {
            video.controls = true;
            video.loop = true;
            Util.sleep(200).then(_ => video.play());
        }

        if(srcObject) {
            video.addEventListener("loadedmetadata", _ => video.play());
        }

        return video;
    }

    renderVideo({ userId, stream = null, url = null, isCurrentId = false, isDisplayScreen = false }) {
        const video = this.createVideoElement({ 
            muted: isCurrentId,
            src: url, 
            srcObject: stream 
        });

        if(isDisplayScreen) {
            this.appendScreenSharingToHtmlTree(userId, video, isCurrentId);
            return;
        }

        this.appendToHTMLTree(userId, video, isCurrentId);
    }

    appendToHTMLTree(userId, video, isCurrentId) {
        const div = document.createElement('div');
        div.id = userId;
        div.classList.add('wrapper');
        div.append(video);

        const div2 = document.createElement('div');
        div2.innerText = isCurrentId ? '' : userId;
        div.append(div2);

        const videoGrid = document.getElementById('video-grid');
        videoGrid.append(div);

    }

    appendScreenSharingToHtmlTree(userId, video, isCurrentId) {
        video.style.width = '100%';
        video.style.height = '100%';

        const div = document.createElement('div');
        div.id = `screen:${userId}`;
        div.classList.add('wrapper');
        div.append(video);

        const div2 = document.createElement('div');
        div2.innerText = `Compartilhamento de tela de ${userId}`;
        div.append(div2);

        const videoGrid = document.getElementById('main-screen-sharing');
        videoGrid.append(div);
        
        videoGrid.style.display = 'block';

        this.hiddenParticipantsVideo(new String(userId).replace('screen:', ''));

    }

    hiddenParticipantsVideo(exceptUser) {
        const users = document.getElementById("video-grid").childNodes;
        const grid = document.getElementById("video-grid");

        grid.style.width = '15%';

        for( const user of users ) {
            user.childNodes[0].style.width = '100%';
            user.childNodes[0].style.height = 'auto';

            if(user.id == exceptUser) continue;

            user.style.display = 'none';
            
        }
    }

    setParticipants(count) {
        const myself = 1;
        const participants = document.getElementById('participants');

        participants.innerHTML = (count + myself);
    }

    removeVideoElement(id) {
        const element = document.getElementById(id);

        element.remove();
    }

    toggleRecordingButtonColor(isActive = true) {
        this.recorderBtn.style.color = isActive ? 'red' : 'white';
    }

    onRecordClick(command) {
        this.recordingEnabled = false;
        return () => {
            const isActive = this.recordingEnabled = !this.recordingEnabled;

            command(this.recordingEnabled);
            this.toggleRecordingButtonColor(isActive);
            
        }
    }

    onLeaveclick(command) {
        return async() => {
            command();

            await Util.sleep(2000);

            window.location = '/pages/home';
        }
    }

    configureRecordButton(command) {
        this.recorderBtn.addEventListener('click', this.onRecordClick(command));
    }

    configureLeaveButton(command) {
        this.leaveBtn.addEventListener('click', this.onLeaveclick(command));
    }

    configureShareButton(command) {
        this.shareBtn.addEventListener('click', this.onScreenClick(command));
    }

    toggleScreenButtonColor(isActive = true) {
        this.shareBtn.style.color = isActive ? 'green' : 'white';
    }

    onScreenClick(command) {
        this.sharingScreen = false;
        return () => {
            const isActive = this.sharingScreen = !this.sharingScreen;

            command(this.sharingScreen);
            this.toggleScreenButtonColor(isActive);
            
        }
    }
}