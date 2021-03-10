
import { 
    myVideoArea, 
    otherVideoArea, 
    startStream, 
    displayStream 
} from './video.js';
import { 
    displayElement, 
    displayMessage, 
    hideElement, 
    logError
} from './functions.js';

const connectPage= document.querySelector('#connectPage');
const disconnectBtn = document.querySelector('#disconnect');
const name = "Franck";
const recipientName = "Joe";
const message = document.querySelector('#message');
const messagepage = document.querySelector('#messagepage');
const sendMessage = document.querySelector('#sendMessage');
const sendMessagepage = document.querySelector('#sendMessagepage');
const chatArea = document.querySelector('#chatArea');
const visio = document.querySelector('#visio');
const JoinConv = document.querySelector('#JoinConv');


let room;
let socket;

let signalingChannel;
const signalingMsgQueue = [];
const candidatesQueue = [];
const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
let rtcPeerConn;

let isNegotiating = false;
let isConnected = false;

const TYPES = {
    NEW_USER: 'newUser',
    SIGNAL_MESSAGE_FROM_CLIENT: 'signal_message_from_client',
    DISCONNECTING: 'disconnecting',
    JOINED_ROOM: 'joined_room',
    SIGNAL_MESSAGE_TO_CLIENT: 'signal_message_to_client'
  }

const SIGNAL_TYPES = {
    USER_HERE: 'userHere',
    ICE_CANDIDATE: 'ice_candidate',
    SDP: 'SDP'
}

connectPage.addEventListener('click', (e) => {
    e.preventDefault();
    
    connect(name, recipientName);
    
    displayElement('chat-section');
    messagepage.focus();
});

/**
 * @brief connect two users via webRTC
 * @param {string} userFrom
 * @param {string} userTo 
 */
function connect(userFrom, userTo) {
    const hostName = location.hostname === 'localhost' ? '127.0.0.1' : location.hostname;
    const protocol = hostName === '127.0.0.1' ? 'ws' : 'wss';
    const port = location.port;
    const wsUrl = `${protocol}://${hostName}:${port}`;

    socket = new WebSocket(wsUrl);
    socket.onopen = () => {
        onConnect(userFrom, userTo);

        // If the rtcPeerConnection is not set, we set it
        if (!rtcPeerConn) {
            startSignaling();
        }
    }

    socket.onmessage = (msg) => {
        handleMessage(parseMsg(msg.data));
    }

}

function onConnect(userFrom, userTo) {
    socket.send(prepareMsg({type: TYPES.NEW_USER, content: {userFrom, userTo}}));
}

function prepareMsg(msg) {
    return JSON.stringify(msg);
}

function parseMsg(msg) {
    return JSON.parse(msg);
}

function handleMessage({type, content}) {
    switch (type) {
        case TYPES.JOINED_ROOM:
            room = content.room;
            break;
        case TYPES.SIGNAL_MESSAGE_TO_CLIENT: 
            onSignalingMessage(content);
            break;
        default:
            break;
      };
}

function onSignalingMessage({signalType, message}) {
    switch (signalType) {
        case SIGNAL_TYPES.ICE_CANDIDATE: {
            //it's an ICE Candidate we just received
            onSignalingMessageICECandidate(message);
            break;
        }
        case SIGNAL_TYPES.SDP: {
            // the remote peer just made us an offer
            onSignalingMessageSDP(message);
            break;
        }
        case SIGNAL_TYPES.USER_HERE: {
            onSignalingMessageUserHere(message);
            break;
        }
        default:
            break;
    }
}

function onSignalingMessageUserHere(message) {
    const id = message;
    // We create a new dataChannel with the same name as the WebSocket room
    if (!signalingChannel) {
        initiateSignalingChannel(id);
    }
}

function initiateSignalingChannel(id) {
    signalingChannel = rtcPeerConn.createDataChannel(room, { negotiated: true, id });

    signalingChannel.onmessage = function ({ data }) { displayMessage(chatArea, data) };

    // at opening, just send every queued message
    signalingChannel.onopen = onOpenSignalingChannel;
}

function onOpenSignalingChannel() {
    signalingMsgQueue.forEach(msg => signalingChannel.send(msg));
    // and then clear the queue
    signalingMsgQueue.length = 0;
}

function onSignalingMessageICECandidate(message) {
    const { candidate } = JSON.parse(message);
    if (!candidate) {
        return;
    }

    if(!(rtcPeerConn?.remoteDescription?.type)){
        candidatesQueue.push(candidate);
    } else {
        rtcPeerConn.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('error!!', err));
    }
    
}

sendMessage.addEventListener('click', (e) => {
    e.preventDefault();
    if (!message.value) {
        return;
    }

    // if it's open we send, else we queue
    if (signalingChannel.readyState === 'open') {
        signalingChannel.send(message.value);
    } else {
        signalingMsgQueue.push(message.value);
    }
    displayMessage(chatArea, message.value);
    message.value = '';
});
sendMessagepage.addEventListener('click', (e) => {
    e.preventDefault();
    if (!messagepage.value) {
        return;
    }

    // if it's open we send, else we queue
    if (signalingChannel.readyState === 'open') {
        signalingChannel.send(messagepage.value);
    } else {
        signalingMsgQueue.push(messagepage.value);
    }
    displayMessage(chatArea, messagepage.value);
    messagepage.value = '';
});
const drive = document.querySelector('#drive');
        drive.addEventListener('click', (e) =>{
                window.location.href = "./drive";
        })



function startSignaling() {
    // initializing the RTCPeerConnection
    rtcPeerConn = new RTCPeerConnection(configuration);

    // when the RTCPeerConnection received ICE Candidates from the STUN Server (in the "configuration" variable)
    rtcPeerConn.onicecandidate = onIceCandidate;

    // when we receive an offer, and we need to send back our own offer
    rtcPeerConn.onnegotiationneeded = onNegotiationNeeded;

    // Workaround for Chrome: skip nested negotiations
    rtcPeerConn.onsignalingstatechange = onSignalingStateChange;

    rtcPeerConn.onConnectionStateChange = onConnectionStateChange;

    // once remote stream arrives, show it in the remote video element
    rtcPeerConn.ontrack = onTrack

}
function onStream(){
        // get a local stream, show it in our video tag and add it to be sent
        startStream()
        .then(stream => displayStream(stream, myVideoArea))
        .then(stream => {
            stream.getTracks().forEach(track => {
                // send tracks to peer
                rtcPeerConn.addTrack(track, stream);
            });
        })
        .catch((e) => logError(e, `Could not start stream`));
}
JoinConv.addEventListener('click', (e)=>{
    onStream();
    userpage.classList.remove('userPage');
    displayElement('visio');
    hideElement('userpage');
});
disconnectBtn.addEventListener('click', (e)=>{
    userpage.classList.add('userPage');
    hideElement('visio');
    displayElement('userpage');
});
function onTrack(e) {
    displayStream(e.streams[0], otherVideoArea);
}

function onSignalingStateChange() {
    console.log('signalingstate', rtcPeerConn.signalingState);
    isNegotiating = (rtcPeerConn.signalingState !== 'stable');
}

function onConnectionStateChange() {
    console.log('connectionstate', rtcPeerConn.connectionState);
    isConnected = rtcPeerConn.connectionState === 'connected';
}

function onNegotiationNeeded() {
    if (isNegotiating) {
        return;
    }
    isNegotiating = true;
    rtcPeerConn.createOffer()
        .then(sendLocalDesc)
        .catch(logError);
}

function onIceCandidate(e) {
    if (e.candidate) {
        // send any ice candidates to the other peer
        socket.send(prepareMsg({type: TYPES.SIGNAL_MESSAGE_FROM_CLIENT, content: {signalType: SIGNAL_TYPES.ICE_CANDIDATE, message: JSON.stringify({ candidate: e.candidate })}}));
    }
}


function onSignalingMessageSDP(message) {
    const {sdp} = JSON.parse(message);
    if (rtcPeerConn.signalingState === 'stable') {
        return;
    }

    rtcPeerConn.setRemoteDescription(sdp).then(() => {
        console.log('offer received');
        // if we received an offer, we need to answer
        if (rtcPeerConn.remoteDescription.type === 'offer') {
            console.log('creating answer');
            rtcPeerConn.createAnswer(sendLocalDesc, logError);
        }
        sendQueuedCandidates();
    }).catch(logError);
}

function sendLocalDesc(descriptor) {
    rtcPeerConn.setLocalDescription(descriptor, function() {
        socket.send(prepareMsg({type: TYPES.SIGNAL_MESSAGE_FROM_CLIENT, content: {signalType: SIGNAL_TYPES.SDP, message: JSON.stringify({sdp: rtcPeerConn.localDescription})}}));
    }, logError);
}    

function sendQueuedCandidates() {
    candidatesQueue.forEach(candidate => {
        rtcPeerConn.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('error!!', err));
    });
}