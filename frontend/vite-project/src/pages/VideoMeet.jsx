import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import styles from "../Styles/videoComponent.module.css";
import server from "../environment";

const server_url = server;
const connections = {};
const pendingCandidates = {};
const pendingOffers = {};

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState();
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState();
    const [showModal, setModal] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        getPermissions();
    }, []);

    const isInitiator = (peerId) => {
        if (!socketIdRef.current || !peerId) return false;
        return socketIdRef.current < peerId;
    };

    const addLocalStream = (peerId) => {
        const pc = connections[peerId];
        const stream = window.localStream;

        if (!pc || !stream) return;

        stream.getTracks().forEach((track) => {
            const sender = pc.getSenders().find(
                (item) => item.track && item.track.kind === track.kind
            );

            if (sender) {
                sender.replaceTrack(track).catch((e) => {
                    console.log("Track replace error:", e);
                });
            } else {
                try {
                    pc.addTrack(track, stream);
                } catch (e) {
                    console.log("Track add error:", e);
                }
            }
        });
    };

    const sendOffer = async (peerId) => {
        const pc = connections[peerId];

        if (!pc || !socketRef.current || !window.localStream) return;
        if (pc.signalingState !== "stable") return;

        try {
            addLocalStream(peerId);

            const description = await pc.createOffer();
            await pc.setLocalDescription(description);

            socketRef.current.emit(
                "signal",
                peerId,
                JSON.stringify({ sdp: pc.localDescription })
            );
        } catch (e) {
            console.log("Offer error:", e);
        }
    };

    const createPeerConnection = (peerId) => {
        if (!peerId || peerId === socketIdRef.current) return null;

        if (connections[peerId]) {
            addLocalStream(peerId);
            return connections[peerId];
        }

        const pc = new RTCPeerConnection(peerConfigConnections);
        connections[peerId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit(
                    "signal",
                    peerId,
                    JSON.stringify({ ice: event.candidate })
                );
            }
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];

            if (!stream) return;

            setVideos((current) => {
                const exists = current.some(
                    (item) => item.socketId === peerId
                );

                const updated = exists
                    ? current.map((item) =>
                          item.socketId === peerId
                              ? { ...item, stream }
                              : item
                      )
                    : [
                          ...current,
                          {
                              socketId: peerId,
                              stream,
                              autoplay: true,
                              playsinline: true
                          }
                      ];

                videoRef.current = updated;
                return updated;
            });
        };

        addLocalStream(peerId);
        return pc;
    };

    const getDisplayMedia = () => {
        if (!screen || !navigator.mediaDevices?.getDisplayMedia) return;

        navigator.mediaDevices
            .getDisplayMedia({ video: true, audio: true })
            .then(getDisplayMediaSuccess)
            .catch((e) => console.log(e));
    };

    const processPendingOffer = async (peerId) => {
        const offer = pendingOffers[peerId];

        if (!offer || !window.localStream) return;

        const pc = createPeerConnection(peerId);
        if (!pc) return;

        try {
            delete pendingOffers[peerId];

            await pc.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            if (pendingCandidates[peerId]) {
                for (const candidate of pendingCandidates[peerId]) {
                    await pc.addIceCandidate(candidate);
                }
                delete pendingCandidates[peerId];
            }

            addLocalStream(peerId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current?.emit(
                "signal",
                peerId,
                JSON.stringify({ sdp: pc.localDescription })
            );
        } catch (e) {
            console.log("Pending offer error:", e);
        }
    };

    const getPermissions = async () => {
        try {
            const videoPermission =
                await navigator.mediaDevices.getUserMedia({ video: true });

            setVideoAvailable(!!videoPermission);

            const audioPermission =
                await navigator.mediaDevices.getUserMedia({ audio: true });

            setAudioAvailable(!!audioPermission);

            setScreenAvailable(
                !!navigator.mediaDevices?.getDisplayMedia
            );

            if (
                (videoPermission && videoAvailable) ||
                (audioPermission && audioAvailable)
            ) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: !!videoAvailable,
                    audio: !!audioAvailable
                });

                window.localStream = stream;

                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getUserMediaSuccess = (stream) => {
        try {
            window.localStream?.getTracks().forEach((track) => track.stop());
        } catch (e) {}

        window.localStream = stream;

        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        Object.keys(connections).forEach((peerId) => {
            addLocalStream(peerId);

            if (pendingOffers[peerId]) {
                processPendingOffer(peerId);
            } else if (isInitiator(peerId)) {
                sendOffer(peerId);
            }
        });

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);

                try {
                    localVideoref.current?.srcObject
                        ?.getTracks()
                        .forEach((t) => t.stop());
                } catch (e) {}

                window.localStream = null;

                Object.keys(connections).forEach((peerId) => {
                    if (isInitiator(peerId)) {
                        sendOffer(peerId);
                    }
                });
            };
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices
                .getUserMedia({
                    video: !!video,
                    audio: !!audio
                })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                localVideoref.current?.srcObject
                    ?.getTracks()
                    .forEach((track) => track.stop());
            } catch (e) {}
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio]);

    const getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream?.getTracks().forEach((track) => track.stop());
        } catch (e) {}

        window.localStream = stream;

        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        Object.keys(connections).forEach((peerId) => {
            addLocalStream(peerId);

            if (isInitiator(peerId)) {
                sendOffer(peerId);
            }
        });

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setScreen(false);
                getUserMedia();
            };
        });
    };

    const gotMessageFromServer = async (fromId, message) => {
        if (fromId === socketIdRef.current) return;

        const signal = JSON.parse(message);
        const pc = createPeerConnection(fromId);

        if (!pc) return;

        try {
            if (signal.sdp) {
                if (signal.sdp.type === "offer" && !window.localStream) {
                    pendingOffers[fromId] = signal.sdp;
                    return;
                }

                await pc.setRemoteDescription(
                    new RTCSessionDescription(signal.sdp)
                );

                if (pendingCandidates[fromId]) {
                    for (const candidate of pendingCandidates[fromId]) {
                        await pc.addIceCandidate(candidate);
                    }
                    delete pendingCandidates[fromId];
                }

                if (signal.sdp.type === "offer") {
                    addLocalStream(fromId);

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    socketRef.current?.emit(
                        "signal",
                        fromId,
                        JSON.stringify({ sdp: pc.localDescription })
                    );
                }
            }

            if (signal.ice) {
                const candidate = new RTCIceCandidate(signal.ice);

                if (pc.remoteDescription) {
                    await pc.addIceCandidate(candidate);
                } else {
                    if (!pendingCandidates[fromId]) {
                        pendingCandidates[fromId] = [];
                    }

                    pendingCandidates[fromId].push(candidate);
                }
            }
        } catch (e) {
            console.log("Signal error:", e);
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prev) => [...prev, { sender, data }]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const connectToSocketServer = () => {
        if (socketRef.current) return;

        socketRef.current = io.connect(server_url, {
            secure: false
        });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }

                delete pendingCandidates[id];
                delete pendingOffers[id];

                setVideos((current) => {
                    const updated = current.filter(
                        (video) => video.socketId !== id
                    );

                    videoRef.current = updated;
                    return updated;
                });
            });

            socketRef.current.on("user-joined", (id, clients) => {
                if (!Array.isArray(clients)) return;

                clients.forEach((peerId) => {
                    if (peerId === socketIdRef.current) return;

                    createPeerConnection(peerId);

                    if (
                        isInitiator(peerId) &&
                        window.localStream
                    ) {
                        sendOffer(peerId);
                    }
                });
            });

            socketRef.current.emit(
                "join-call",
                window.location.href
            );
        });
    };

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const handleVideo = () => setVideo((value) => !value);
    const handleAudio = () => setAudio((value) => !value);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen]);

    const handleScreen = () => setScreen((value) => !value);

    const handleEndCall = () => {
        try {
            localVideoref.current?.srcObject
                ?.getTracks()
                .forEach((track) => track.stop());
        } catch (e) {}

        Object.values(connections).forEach((pc) => pc.close());

        Object.keys(connections).forEach((peerId) => {
            delete connections[peerId];
            delete pendingCandidates[peerId];
            delete pendingOffers[peerId];
        });

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        window.localStream = null;
        window.location.href = "/";
    };

    const sendMessage = () => {
        if (!message.trim() || !socketRef.current) return;

        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    };

    const connect = () => {
        setAskForUsername(false);
        getMedia();
    };

    return (
        <div>
            {askForUsername ? (
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyBrand}>Vertexa</div>
                    <p className={styles.lobbyEyebrow}>WELCOME BACK</p>

                    <h2>
                        Enter into{" "}
                        <span style={{ color: "#c084fc" }}>Lobby</span>
                    </h2>

                    <div className={styles.lobbyForm}>
                        <TextField
                            id="outlined-basic"
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            variant="outlined"
                        />

                        <Button variant="contained" onClick={connect}>
                            Connect
                        </Button>
                    </div>

                    <video
                        className={styles.lobbyVideoPreview}
                        ref={localVideoref}
                        autoPlay
                        muted
                        playsInline
                    />
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>

                                <div className={styles.chattingDisplay}>
                                    {messages.length ? (
                                        messages.map((item, index) => (
                                            <div
                                                style={{ marginBottom: "20px" }}
                                                key={index}
                                            >
                                                <p style={{ fontWeight: "bold" }}>
                                                    {item.sender}
                                                </p>
                                                <p>{item.data}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No Messages Yet</p>
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        id="chat-input"
                                        label="Enter Your chat"
                                        variant="outlined"
                                    />

                                    <Button
                                        variant="contained"
                                        onClick={sendMessage}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton
                            onClick={handleVideo}
                            style={{ color: "white" }}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleEndCall}
                            style={{ color: "red" }}
                        >
                            <CallEndIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleAudio}
                            style={{ color: "white" }}
                        >
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton
                                onClick={handleScreen}
                                style={{ color: "white" }}
                            >
                                {screen ? (
                                    <ScreenShareIcon />
                                ) : (
                                    <StopScreenShareIcon />
                                )}
                            </IconButton>
                        )}

                        <Badge
                            badgeContent={newMessages}
                            max={999}
                            color="orange"
                        >
                            <IconButton
                                onClick={() => {
                                    setModal((value) => !value);
                                    setNewMessages(0);
                                }}
                                style={{ color: "white" }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video
                        className={styles.meetUserVideo}
                        ref={localVideoref}
                        autoPlay
                        muted
                        playsInline
                    />

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div
                                className={styles.remoteVideo}
                                key={video.socketId}
                            >
                                <video
                                    data-socket={video.socketId}
                                    ref={(ref) => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                            ref.play().catch((e) => {
                                                console.log(
                                                    "Remote video play error:",
                                                    e
                                                );
                                            });
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
