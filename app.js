import { webConnect } from './peer.js';
import { game } from './game-seep.js';

var app = Vue.createApp({// Vue 3.0
    data() {
        return {
            peerId: "",
            message: 'Please wait for your Peer Id:',
            otherPeerId: otherPeerId,
            messageForPeer: "",
            totalPlayers: 4,
            testing: null,

            players: [],
            teams: {},
            table: null,
            biddingCard: null,
            createChoices: null,
            pickChoices: null,
            playingDeckArray: [],
            selectedCardsFromDeck: [],
        };
    },
    methods: {
        connectToOtherPeer: function () {
            const ret = webConnect.connectToOtherPeer(this.otherPeerId);
            if (ret && ret.error) {
                this.message = ret.error;
            }
        },
        sendMessageToPeers: function () {
            const ret = webConnect.sendMessageToPeers(this.messageForPeer);
        },
        init() {
            this.players = [];
            this.teams = {};
            this.biddingCard = null;
            this.playingDeckArray = [];
            this.selectedCardsFromDeck = [];
            game.init(this.totalPlayers);

            for (let id = 1; id <= this.totalPlayers; id++) {
                const player = { id };
                this.players.push(player);
                game.addPlayer(player);
            }

            this.table = game._table;
        },
        test() {
            this.biddingCard = null;
            this.selectedCardsFromDeck = [];
            this.testing = game.test();
            this.next();
        },
        next(choice) {
            this.createChoices = null;
            this.pickChoices = null;
            if (this.testing) {
                const { done, value } = this.testing.next(choice);
                if (done) {
                    this.testing.done = done;
                }
                if (value) {
                    const { createChoices, pickChoices, bid } = value;
                    this.createChoices = createChoices;
                    this.pickChoices = pickChoices;
                    if (bid) {
                        this.biddingCard = bid;
                    }
                }
                this.updateData();
            }
        },
        updateData() {
            this.players = Object.values(game._players);
            this.teams = Object.assign({}, game._teams);
            this.table = Object.assign({}, game._table);
            this.playingDeckArray = [...game._playingDeckArray];
            this.selectedCardsFromDeck = [];
        },
        sortCards(playerId) {
            const players = playerId ? [game._players[playerId]] : Object.values(game._players);
            players.forEach(player => {
                game.sortCards(player.cards);
            });
            this.updateData();
        },
        pickedCardGroups(team) {
            return this.teams?.[team]?.pickedCardGroups;
        },
        selectCreate() {
            this.next('create');
        },
        selectPick() {
            this.next('pick');
        },
        selectPut() {
            this.next('put');
        },
        shuffleDeck() {
            game.shuffleDeck();
            this.updateData();
        },
        dealSelectedCardsFromDeckOnTable() {
            if (this.selectedCardsFromDeck && 4 === this.selectedCardsFromDeck.length) {
                const dealt = game.dealCardsSourceToTarget(
                    game._playingDeckArray, this.selectedCardsFromDeck, game._table
                );
                this.next();
            }
        },
        dealSelectedCardsFromDeckToPlayer(player) {
            if (this.selectedCardsFromDeck && 4 === this.selectedCardsFromDeck.length) {
                const dealt = game.dealCardsSourceToTarget(
                    game._playingDeckArray, this.selectedCardsFromDeck, player
                );
                this.next();
            }
        },
    },
    computed: {
        looseCardsOnTable() {
            return this.table && this.table.cards;
        },
        housesOnTable() {
            return this.table && this.table.houses;
        },
    },
});
app.use(Quasar);
app.mount('#app');