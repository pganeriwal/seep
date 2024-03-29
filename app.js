import { webConnect } from './peer.js';
import { game } from './game-seep.js';
import { forEachInOrder } from './util.js';

var app = Vue.createApp({// Vue 3.0
    data() {
        return {
            tab: "game",
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
            selectedCardsOrHousesOnTable: [],
            biddingPlayer: null,
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
            this.biddingPlayer = null;
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
            this.biddingPlayer = null;
            this.selectedCardsFromDeck = [];
            game.end();
            this.next();
        },
        next(input) {
            const ouput = game.nextStep(input);
            if (!ouput.success) {
                alert("Invalid turn");
            }
            this.updateData();
        },
        // test() {
        //     this.biddingCard = null;
        //     this.biddingPlayer = null;
        //     this.selectedCardsFromDeck = [];
        //     this.testing = game.test();
        //     this.next();
        // },
        // next(input) {
        //     this.createChoices = null;
        //     this.pickChoices = null;
        //     if (this.testing) {
        //         const { done, value } = this.testing.next(input);
        //         if (done) {
        //             this.testing.done = done;
        //         }
        //         if (value) {
        //             const { createChoices, pickChoices, bid } = value;
        //             this.createChoices = createChoices;
        //             this.pickChoices = pickChoices;
        //             if (bid) {
        //                 this.biddingCard = bid;
        //             }
        //         }
        //         this.updateData();
        //     }
        // },
        updateData() {
            this.players = Object.values(game._players);
            this.teams = Object.assign({}, game._teams);
            this.table = Object.assign({}, game._table);
            this.playingDeckArray = [...game._playingDeckArray];
            this.selectedCardsFromDeck = [];
            this.selectedCardsOrHousesOnTable = [];
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
            this.next({ choice: 'create' });
        },
        selectPick() {
            this.next({ choice: 'pick' });
        },
        selectPut() {
            this.next({ choice: 'put' });
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
                if (dealt) {
                    this.next();
                }
            }
        },
        dealRandomCardsFromDeckOnTable() {
            const dealt = game.dealCardsFromDeck(4, game._table);
            if (dealt) {
                this.next();
            }
        },
        dealSelectedCardsFromDeckToPlayer(player) {
            if (this.selectedCardsFromDeck && 4 === this.selectedCardsFromDeck.length) {
                const dealt = game.dealCardsSourceToTarget(
                    game._playingDeckArray, this.selectedCardsFromDeck, player
                );
                if (dealt) {
                    this.next();
                }
            }
        },
        dealRandomCardsFromDeckToPlayer(player) {
            const dealt = game.dealCardsFromDeck(4, player, game.isAnyHouseCard);
            if (dealt) {
                this.next();
            }
        },
        getColorClass(colour) {
            return `text-${'black' === colour ? 'dark' : 'negative'}`;
        },
        isBidDisabled(player) {
            return !(player.selectedCard && game.isHouseCard(player.selectedCard) && player.hasTurn);
        },
        bid(player) {
            if (player.hasBid && player.selectedCard && game.isHouseCard(player.selectedCard)) {
                this.biddingCard = player.selectedCard;
                this.next({ bid: player.selectedCard });
                player.selectedCard = null;
            }
        },
        makeMeBidder(player) {
            if (!this.biddingPlayer) {
                this.biddingPlayer = player;
                this.next({ biddingPlayer: player });
            }
        },
        createHouse(player) {
            if (player.hasTurn && player.selectedCard && player.selectedHouse
                && this.selectedCardsOrHousesOnTable.length) {
                this.next({
                    player,
                    playingCard: player.selectedCard,
                    selectedCardsOrHousesOnTable: this.selectedCardsOrHousesOnTable,
                    turn: "create",
                    houseNumber: player.selectedHouse,
                });
                player.selectedCard = null;
                player.selectedHouse = null;
            }
        },
        pickCards(player) {
            if (player.hasTurn && player.selectedCard && this.selectedCardsOrHousesOnTable.length) {
                this.next({
                    player,
                    playingCard: player.selectedCard,
                    selectedCardsOrHousesOnTable: this.selectedCardsOrHousesOnTable,
                    turn: "pick",
                });
                player.selectedCard = null;
                player.selectedHouse = null;
            }
        },
        putCard(player) {
            if (player.hasTurn && player.selectedCard && !this.selectedCardsOrHousesOnTable.length) {
                this.next({
                    player,
                    playingCard: player.selectedCard,
                    turn: "put",
                });
                player.selectedCard = null;
                player.selectedHouse = null;
            }
        },
        getCreateOptions(player) {
            const set = player.cards.reduce((acc, card) => {
                if (game.isValidHouseNumber(card.number)) {
                    acc.add(card.number);
                }
                return acc;
            }, new Set());
            forEachInOrder(this.housesOnTable, house => {
                game.isPlayersTeamHouseOwner(house, player) && set.add(house.number);
            });
            return Array.from(set).sort((a, b) => b - a);
        },
        isBidDone() {
            return game.SUB_STATES.BID === game._sub_state || game.SUB_STATES.FIRST_TURN === game._sub_state;
        },
    },
    computed: {
        looseCardsOnTable() {
            return this.table && this.table.cards;
        },
        housesOnTable() {
            return this.table && this.table.houses;
        },
        sortedPlayingDeckArray() {
            const cards = [...this.playingDeckArray];
            game.sortCards(cards);
            return cards;
        },
    },
});
app.use(Quasar);
app.mount('#app');