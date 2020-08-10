// fetch list of users
var app = new Vue({
    el: '#app',
    data: {
        message: '',
        users: [],
        messages: [],
        selUser: null,
        loggedInUser: {
            _id: '1',
            name: 'johndoe',
        }
    },

    mounted: function () {
        // Fetch users
        this.fetchUsers();

        // TODO: Ask for username if not logged in
    },

    methods: {
        chatWithUser: function (user) {
            this.selUser = user;

            // Fetch user messages
            this.fetchMessages(user._id);

            // TODO: Check if connection is active with user, if not then try connecting
        },

        sendMessage: function () {
            this.messages.push({ _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id });
            this.message = '';
        },

        logout: function () {
            // TODO: Logout user
        },

        fetchUsers: function () {
            // Fetch users
            fetch('/api/users').then(res => res.json()).then(json => this.users = json).catch(err => console.error(err));
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
