import { forEachInOrder } from "./util.js";

export const webConnect = (function (thisPeerName, thisPeerId, otherPeerId) {
    if (thisPeerName && thisPeerId && otherPeerId) {
        console.log(`--Start: ${thisPeerName}`);

        const peerConnections = {};
        const allConnections = {};
        const allCommunications = {};
        const allDataSent = {};
        const allDataReceived = {};

        const createData = function (message) {
            return (message) ? {
                id: Date.now().toString(),
                message: message,
                sender: thisPeerId
            } : null;
        };

        const isDataValid = function (data) {
            return !!(data && data.id && data.message && data.sender);
        };

        const addDataSent = function (data) {
            let ret = null;
            if (isDataValid(data)) {
                ret = allCommunications[data.id] = data;
                allDataSent[data.id] = true;
            }
            return ret;
        };

        const addDataReceived = function (data) {
            let ret = null;
            if (isDataValid(data) && !allDataReceived[data.id]) {
                ret = allCommunications[data.id] = data;
                allDataReceived[data.id] = true;
            }
            return ret;
        };

        const isConnectionValid = function (conn) {
            return !!(conn && conn.connectionId && conn.peer);
        };
        const isConnectionOpen = function (conn) {
            return (isConnectionValid(conn) && conn["_open"]);
        };
        const addConnection = function (conn) {
            let ret = null;
            if (isConnectionValid(conn)) {
                peerConnections[conn.peer] = peerConnections[conn.peer] || {};
                peerConnections[conn.peer][conn.connectionId] = conn.connectionId;
                ret = allConnections[conn.connectionId] = conn;
            }
            return ret;
        };
        const getConnectionForPeers = function (peerIds) {
            let ret = null;
            if (Array.isArray(peerIds)) {
                forEachInOrder(peerIds, (peerId) => {
                    if (peerId) {
                        forEachInOrder(peerConnections[peerId], (connectionId) => {
                            if (connectionId) {
                                const conn = getConnection(connectionId);
                                if (isConnectionValid(conn)) {
                                    ret = ret || {};
                                    ret[conn.connectionId] = conn;
                                }
                            }
                        });
                    }
                });
            } else {
                ret = allConnections;
            }
            return ret;
        };
        const getConnection = function (connectionId) {
            return allConnections[connectionId];
        };
        const removeConnection = function (connectionId) {
            const conn = allConnections[connectionId];
            if (isConnectionValid(conn)) {
                delete peerConnections[conn.peer][conn.connectionId];
            }
            delete allConnections[connectionId];
            return true;
        };

        const peer = new Peer(thisPeerId);
        console.log(`${thisPeerName}: created`);

        peer.on('open', function (id) {
            console.log(`${thisPeerName}: opened: Peer ID is: ${id}`);
            app.peerId = id;
            if (autoConnectToOther) {
                connectToOtherPeer(otherPeerId);
            }
        });
        console.log(`${thisPeerName}: open`);

        const dataReceivedFromPeer = function (data) {
            if (addDataReceived(data)) {
                console.log(`${thisPeerName}: Received: ${JSON.stringify(data)}`);
            }
        };

        const sendDataToConn = function (conn, data) {
            let ret = false;
            if (isConnectionOpen(conn)) {
                console.log(`${thisPeerName}: sendDataToConn:`, data);

                if (addDataSent(data)) {
                    conn.send(data);
                }
                ret = true;
            }
            return ret;
        };

        const sendMessageToPeers = function (message, peerIds) {
            const ret = {
                sentToAll: false,
                sentToAny: false
            };
            let sentToAll = true;
            let sentToAny = false;
            const data = createData(message);
            forEachInOrder(getConnectionForPeers(peerIds), (conn) => {
                const sent = sendDataToConn(conn, data);
                sentToAll = sentToAll && sent;
                sentToAny = sentToAny || sent;
            });
            ret.sentToAll = sentToAll;
            ret.sentToAny = sentToAny;
            return ret;
        };

        const registerPeerConnection = function (conn) {
            let ret = false;
            if (isConnectionValid(conn)) {
                console.log(`${thisPeerName}: connection registered: ${conn.connectionId}, peer: ${conn.peer}`);
                addConnection(conn);
                conn.on('open', function () {
                    //pg/todo: connection is opened and past messages can be sent now

                    console.log(`${thisPeerName}: connection opened`);
                    // Receive messages
                    conn.on('data', dataReceivedFromPeer);

                    // Send messages
                    const msg = 'I am connected to ' + conn.peer + ' at ' + new Date().toISOString();
                    sendDataToConn(conn, msg);
                });
                ret = true;
            }
            return ret;
        };

        /**
         * This function is to connect with other peers
         * @param {*} peerId 
         * @returns 
         */
        const connectToOtherPeer = function (peerId) {
            const ret = {
                error: "Other Peer Id is invalid"
            };
            if (peerId && thisPeerId !== peerId) {
                const conn = peer.connect(peerId);
                if (registerPeerConnection(conn)) {
                    delete ret.error;
                    ret.conn = conn;
                }
            }
            return ret;
        };

        /**
         * This listener will be called when other peer connect to you
         */
        peer.on('connection', registerPeerConnection);
        console.log(`${thisPeerName}: connection`);

        console.log(`--End: ${thisPeerName}`);

        return {
            sendMessageToPeers,
            connectToOtherPeer,
        };
    }
})(thisPeerName, thisPeerId, otherPeerId);