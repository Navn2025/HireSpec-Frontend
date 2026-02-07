import socketService from './socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class LiveInterviewService {
    constructor() {
        this.sessionId = null;
        this.participantId = null;
        this.role = null;
        this.callbacks = {};
        this.peers = new Map(); // socketId -> { primary: Peer, secondary: Peer, screen: Peer }
        this.localStreams = {
            primary: null,
            secondary: null,
            screen: null
        };
        this.remoteStreams = new Map(); // socketId -> { primary, secondary, screen }
    }

    // Create a new live interview session
    async createSession(sessionData) {
        const response = await fetch(`${API_URL}/api/live-interview/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });
        return response.json();
    }

    // Get session details
    async getSession(sessionId, accessCode) {
        const response = await fetch(
            `${API_URL}/api/live-interview/session/${sessionId}?code=${accessCode}`
        );
        return response.json();
    }

    // Join the session via API and socket
    async joinSession(sessionId, name, role, accessCode) {
        // Join via API
        const response = await fetch(`${API_URL}/api/live-interview/join/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role, code: accessCode })
        });
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to join session');
        }
        
        this.sessionId = sessionId;
        this.participantId = data.participant.id;
        this.role = role;
        
        // Connect socket
        const socket = socketService.connect();
        this.setupSocketListeners(socket);
        
        // Join socket room
        socket.emit('join-live-interview', {
            sessionId,
            participantId: this.participantId,
            userName: name,
            role,
            cameras: { primary: true, secondary: false }
        });
        
        return data;
    }

    // Setup socket event listeners
    setupSocketListeners(socket) {
        // Participant events
        socket.on('participant-joined', (data) => {
            console.log('Participant joined:', data);
            this.callbacks.onParticipantJoined?.(data);
            
            // Initiate WebRTC connection if we're the recruiter
            if (this.role === 'recruiter') {
                this.initiateCall(data.socketId, 'primary');
            }
        });

        socket.on('participant-left', (data) => {
            console.log('Participant left:', data);
            this.callbacks.onParticipantLeft?.(data);
            this.cleanupPeer(data.socketId);
        });

        socket.on('participant-camera-update', (data) => {
            console.log('Camera update:', data);
            this.callbacks.onCameraUpdate?.(data);
        });

        // Room state
        socket.on('room-state', (data) => {
            console.log('Room state received:', data);
            this.callbacks.onRoomState?.(data);
        });

        // Screen share events
        socket.on('screen-share-started', (data) => {
            console.log('Screen share started:', data);
            this.callbacks.onScreenShareStarted?.(data);
        });

        socket.on('screen-share-stopped', (data) => {
            console.log('Screen share stopped:', data);
            this.callbacks.onScreenShareStopped?.(data);
        });

        // Code collaboration
        socket.on('live-code-update', (data) => {
            this.callbacks.onCodeUpdate?.(data);
        });

        socket.on('cursor-position', (data) => {
            this.callbacks.onCursorPosition?.(data);
        });

        socket.on('code-executing', (data) => {
            this.callbacks.onCodeExecuting?.(data);
        });

        socket.on('code-execution-result', (data) => {
            this.callbacks.onCodeExecutionResult?.(data);
        });

        // Question events
        socket.on('question-selected', (data) => {
            this.callbacks.onQuestionSelected?.(data);
        });

        // Timer events
        socket.on('timer-update', (data) => {
            this.callbacks.onTimerUpdate?.(data);
        });

        // Whiteboard events
        socket.on('whiteboard-draw', (data) => {
            this.callbacks.onWhiteboardDraw?.(data);
        });

        socket.on('whiteboard-cleared', () => {
            this.callbacks.onWhiteboardCleared?.();
        });

        // Interview end
        socket.on('interview-ended', (data) => {
            this.callbacks.onInterviewEnded?.(data);
        });

        // Multi-stream WebRTC signaling
        socket.on('webrtc-offer-multi', async (data) => {
            await this.handleOffer(data.from, data.offer, data.streamType);
        });

        socket.on('webrtc-answer-multi', async (data) => {
            const peerGroup = this.peers.get(data.from);
            if (peerGroup && peerGroup[data.streamType]) {
                peerGroup[data.streamType].signal(data.answer);
            }
        });

        socket.on('webrtc-ice-candidate-multi', (data) => {
            const peerGroup = this.peers.get(data.from);
            if (peerGroup && peerGroup[data.streamType]) {
                peerGroup[data.streamType].signal(data.candidate);
            }
        });
    }

    // Register event callbacks
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    // Initialize primary camera
    async initPrimaryCamera() {
        try {
            this.localStreams.primary = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });
            return this.localStreams.primary;
        } catch (error) {
            console.error('Failed to init primary camera:', error);
            throw error;
        }
    }

    // Initialize secondary camera (environment facing for mobile or second webcam)
    async initSecondaryCamera() {
        try {
            // Try to get a different camera
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            let constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: { ideal: 'environment' }
                },
                audio: false
            };
            
            // If we have multiple cameras, use the second one
            if (videoDevices.length > 1) {
                const secondCameraId = videoDevices[1].deviceId;
                constraints.video = {
                    deviceId: { exact: secondCameraId },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                };
            }
            
            this.localStreams.secondary = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Notify others about secondary camera
            socketService.socket?.emit('camera-status-update', {
                sessionId: this.sessionId,
                cameraType: 'secondary',
                enabled: true
            });
            
            return this.localStreams.secondary;
        } catch (error) {
            console.error('Failed to init secondary camera:', error);
            throw error;
        }
    }

    // Start screen sharing
    async startScreenShare() {
        try {
            this.localStreams.screen = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                },
                audio: true
            });
            
            // Handle when user stops sharing via browser UI
            this.localStreams.screen.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };
            
            socketService.socket?.emit('start-screen-share', {
                sessionId: this.sessionId,
                streamType: 'screen'
            });
            
            // Share with all participants
            for (const [socketId] of this.peers) {
                this.initiateCall(socketId, 'screen');
            }
            
            return this.localStreams.screen;
        } catch (error) {
            console.error('Failed to start screen share:', error);
            throw error;
        }
    }

    // Stop screen sharing
    stopScreenShare() {
        if (this.localStreams.screen) {
            this.localStreams.screen.getTracks().forEach(track => track.stop());
            this.localStreams.screen = null;
        }
        
        socketService.socket?.emit('stop-screen-share', {
            sessionId: this.sessionId
        });
    }

    // Initiate WebRTC call for specific stream type
    async initiateCall(remotePeerId, streamType) {
        const Peer = (await import('simple-peer')).default;
        
        const stream = this.localStreams[streamType];
        if (!stream) return;
        
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream
        });
        
        peer.on('signal', (signal) => {
            socketService.socket?.emit('webrtc-offer-multi', {
                offer: signal,
                to: remotePeerId,
                streamType,
                sessionId: this.sessionId
            });
        });
        
        peer.on('stream', (remoteStream) => {
            console.log(`Received ${streamType} stream from ${remotePeerId}`);
            
            if (!this.remoteStreams.has(remotePeerId)) {
                this.remoteStreams.set(remotePeerId, {});
            }
            this.remoteStreams.get(remotePeerId)[streamType] = remoteStream;
            
            this.callbacks.onRemoteStream?.(remotePeerId, streamType, remoteStream);
        });
        
        peer.on('error', (err) => {
            console.error(`Peer error (${streamType}):`, err);
        });
        
        // Store peer
        if (!this.peers.has(remotePeerId)) {
            this.peers.set(remotePeerId, {});
        }
        this.peers.get(remotePeerId)[streamType] = peer;
    }

    // Handle incoming WebRTC offer
    async handleOffer(fromPeerId, offer, streamType) {
        const Peer = (await import('simple-peer')).default;
        
        const stream = this.localStreams[streamType];
        
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream: stream || undefined
        });
        
        peer.on('signal', (signal) => {
            socketService.socket?.emit('webrtc-answer-multi', {
                answer: signal,
                to: fromPeerId,
                streamType
            });
        });
        
        peer.on('stream', (remoteStream) => {
            console.log(`Received ${streamType} stream from ${fromPeerId}`);
            
            if (!this.remoteStreams.has(fromPeerId)) {
                this.remoteStreams.set(fromPeerId, {});
            }
            this.remoteStreams.get(fromPeerId)[streamType] = remoteStream;
            
            this.callbacks.onRemoteStream?.(fromPeerId, streamType, remoteStream);
        });
        
        peer.signal(offer);
        
        // Store peer
        if (!this.peers.has(fromPeerId)) {
            this.peers.set(fromPeerId, {});
        }
        this.peers.get(fromPeerId)[streamType] = peer;
    }

    // Send code update
    sendCodeUpdate(code, language, cursorPosition, selection) {
        socketService.socket?.emit('live-code-update', {
            sessionId: this.sessionId,
            code,
            language,
            cursorPosition,
            selection
        });
    }

    // Send cursor position
    sendCursorPosition(cursorPosition, selection, userName) {
        socketService.socket?.emit('cursor-position', {
            sessionId: this.sessionId,
            cursorPosition,
            selection,
            userName
        });
    }

    // Select question (recruiter)
    selectQuestion(question) {
        socketService.socket?.emit('select-question', {
            sessionId: this.sessionId,
            question
        });
    }

    // Timer controls
    controlTimer(action, duration) {
        socketService.socket?.emit('timer-control', {
            sessionId: this.sessionId,
            action,
            duration
        });
    }

    // Whiteboard draw
    sendWhiteboardDraw(drawData) {
        socketService.socket?.emit('whiteboard-draw', {
            sessionId: this.sessionId,
            drawData
        });
    }

    // Clear whiteboard
    clearWhiteboard() {
        socketService.socket?.emit('whiteboard-clear', {
            sessionId: this.sessionId
        });
    }

    // End interview
    endInterview(reason = 'completed') {
        socketService.socket?.emit('end-live-interview', {
            sessionId: this.sessionId,
            reason
        });
        this.cleanup();
    }

    // Toggle audio
    toggleAudio(enabled) {
        if (this.localStreams.primary) {
            this.localStreams.primary.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    // Toggle video
    toggleVideo(enabled) {
        if (this.localStreams.primary) {
            this.localStreams.primary.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    // Cleanup peer connection
    cleanupPeer(socketId) {
        const peerGroup = this.peers.get(socketId);
        if (peerGroup) {
            Object.values(peerGroup).forEach(peer => peer?.destroy());
            this.peers.delete(socketId);
        }
        this.remoteStreams.delete(socketId);
    }

    // Full cleanup
    cleanup() {
        // Stop all local streams
        Object.values(this.localStreams).forEach(stream => {
            stream?.getTracks().forEach(track => track.stop());
        });
        this.localStreams = { primary: null, secondary: null, screen: null };
        
        // Destroy all peers
        for (const [socketId] of this.peers) {
            this.cleanupPeer(socketId);
        }
        
        // Leave socket room
        socketService.socket?.emit('leave-live-interview', {
            sessionId: this.sessionId
        });
        
        this.sessionId = null;
        this.participantId = null;
        this.role = null;
        this.callbacks = {};
    }
}

export default new LiveInterviewService();
