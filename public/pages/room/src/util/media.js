class Media {
    async getCamera(audio = true, video = true) {
        return navigator.mediaDevices.getUserMedia({
            video,
            audio
        });
    }

    async getDisplayScreen(audio = true) {
        return navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio
        })
    }
}