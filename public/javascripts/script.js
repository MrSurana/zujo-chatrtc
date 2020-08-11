// fetch list of users
var app = new Vue({
    el: '#app',
    data: {
        message: '',
        users: [],
        messages: [],
        selUser: null,
        loggedInUser: null,
        peer: null
    },

    mounted: function () {
        let username = localStorage.getItem('username');
        if (username == null) username = prompt('Username');

        this.findOrCreateUser(username);
    },

    methods: {
        findOrCreateUser: function (username) {
            fetch(`/api/users/${username}`)
                .then(res => res.json())
                .then(json => {
                    localStorage.setItem('username', username);
                    this.loggedInUser = json;

                    this.fetchUsers();
                    this.initPeer();
                    this.initWebsocket();
                })
                .catch(err => console.error(err));

        },

        initPeer: function () {
            // init Peer and init websocket
            this.peer = new Peer(this.loggedInUser._id, { host: 'localhost', port: 9000, path: '/chatrtc' });

            this.peer.on('open', (id) => {
                // console.log('My peer ID is: ' + id);
            });

            this.peer.on('connection', (conn) => {
                console.log('Connected to: %s', conn.peer);

                const userIndex = this.users.findIndex(u => u._id == conn.peer);
                if (userIndex > -1) {
                    this.users[userIndex].conn = conn;
                }

                conn.on('data', (data) => {
                    if (this.selUser && data.data.senderId == this.selUser._id) {
                        this.messages.push(data.data)
                    }
                });
            });
        },

        initWebsocket: function () {
            const websocket = new WebSocket("ws://localhost:3000");
            websocket.onopen = (e) => {
                console.log("[open] Connection established");
                websocket.send(JSON.stringify({
                    type: 'login',
                    data: this.loggedInUser
                }));
            };

            websocket.onmessage = (event) => this.handleWebsocketMessage(event.data);

            websocket.onclose = (event) => {
                if (event.wasClean) {
                    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                } else {
                    console.log('[close] Connection died');
                }
            };

            websocket.onerror = (error) => {
                console.log(`[error] ${error.message}`);
            };

        },

        handleWebsocketMessage: function (message) {
            console.log('received: %s', message);

            try {
                const json = JSON.parse(message);
                switch (json.type) {
                    case 'users':
                        json.data.forEach(this.markOnline);
                        break;

                    case 'user-online':
                        this.markOnline(json.data);
                        break;

                    case 'user-offline':
                        this.markOffline(json.data);
                        break;

                    default:
                        break;
                }
            } catch (e) {
                console.error("Invalid JSON");
            }
        },

        markOnline: function (user) {
            // TODO: establish peer connection to user
        },

        markOffline: function (user) {
            // TODO: unestablish peer connection to user
        },

        chatWithUser: function (user) {
            this.selUser = user;

            // Fetch user messages
            this.fetchMessages(user._id);

            // Check if connection is active with user, if not then try connecting
            if (!user.conn || !user.conn.open) {
                user.conn = this.peer.connect(user._id);

                user.conn.on('data', (data) => {
                    if (this.selUser && data.data.senderId == this.selUser._id) {
                        this.messages.push(data.data)
                    }
                });
            }
        },

        sendMessage: function () {
            this.selUser.conn.send({
                type: 'message',
                data: { _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id }
            });
            this.messages.push({ _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id });
            this.message = '';
        },

        logout: function () {
            // TODO: Logout user
        },

        fetchUsers: function () {
            // Fetch users
            fetch('/api/users').then(res => res.json())
                .then(json => this.users = json.filter(u => u._id != this.loggedInUser._id))
                .catch(err => console.error(err));
        },

        fetchMessages: function (user) {
            // TODO: Fetch messages for user 

            fetch(`/api/users/${user.id}/messages`)
                .then(res => res.json())
                .then(json => this.messages = json)
                .catch(err => console.error(err));
        },
    }
});
