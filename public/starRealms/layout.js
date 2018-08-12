layout = {
    counters: {
        createText: counters => {
            return "<p>Authority: " + counters.authority + "</p>" +
                "<p>Trade: " + counters.trade + "</p>" +
                "<p>Combat: " + counters.combat + "</p>"
        },
        x: 36,
        y: 22,
        width: 15,
        height: 11
    },
    piles: {
        explorers: {
            x: -40,
            y: 0
        }
    },
    rows: {
        tradeRow: {
            row: {
                x: 0,
                y: 0
            },
            deck: {
                x: 40,
                y: 0,
                target: "tradeDeck"
            }
        }
    },
    textures: {
        cards: {
            small: {
                back: "../starRealms/cards/small/back.png",
                empty: "../starRealms/cards/small/empty.png",
                undef: "../starRealms/cards/small/undef.png",

                scout: "../starRealms/cards/small/scout.png",
                viper: "../starRealms/cards/small/viper.png",
                explorer: "../starRealms/cards/small/explorer.png",

                blobfighter: "../starRealms/cards/small/blobfighter.png",
                battlepod: "../starRealms/cards/small/battlepod.png",
                tradepod: "../starRealms/cards/small/tradepod.png",
                blobwheel: "../starRealms/cards/small/blobwheel.png",
                ram: "../starRealms/cards/small/ram.png",
                blobdestroyer: "../starRealms/cards/small/blobdestroyer.png",
                thehive: "../starRealms/cards/small/thehive.png",
                battleblob: "../starRealms/cards/small/battleblob.png",
                blobcarrier: "../starRealms/cards/small/blobcarrier.png",
                mothership: "../starRealms/cards/small/mothership.png",
                blobworld: "../starRealms/cards/small/blobworld.png",

                barterworld: "../starRealms/cards/small/barterworld.png",
                centraloffice: "../starRealms/cards/small/centraloffice.png",
                defensecenter: "../starRealms/cards/small/defensecenter.png",
                portofcall: "../starRealms/cards/small/portofcall.png",
                tradingpost: "../starRealms/cards/small/tradingpost.png",
                commandship: "../starRealms/cards/small/commandship.png",
                cutter: "../starRealms/cards/small/cutter.png",
                embassyyacht: "../starRealms/cards/small/embassyyacht.png",
                federationshuttle: "../starRealms/cards/small/federationshuttle.png",
                flagship: "../starRealms/cards/small/flagship.png",
                freighter: "../starRealms/cards/small/freighter.png",
                tradeescort: "../starRealms/cards/small/tradeescort.png",

                battlestation: "../starRealms/cards/small/battlestation.png",
                brainworld: "../starRealms/cards/small/brainworld.png",
                junkyard: "../starRealms/cards/small/junkyard.png",
                machinebase: "../starRealms/cards/small/machinebase.png",
                mechworld: "../starRealms/cards/small/mechworld.png",
                battlemech: "../starRealms/cards/small/battlemech.png",
                missilebot: "../starRealms/cards/small/missilebot.png",
                missilemech: "../starRealms/cards/small/missilemech.png",
                patrolmech: "../starRealms/cards/small/patrolmech.png",
                stealthneedle: "../starRealms/cards/small/stealthneedle.png",
                supplybot: "../starRealms/cards/small/supplybot.png",
                tradebot: "../starRealms/cards/small/tradebot.png",

                imperialfighter: "../starRealms/cards/small/imperialfighter.png",
                corvette: "../starRealms/cards/small/corvette.png",
                imperialfrigate: "../starRealms/cards/small/imperialfrigate.png",
                surveyship: "../starRealms/cards/small/surveyship.png",
                recyclingstation: "../starRealms/cards/small/recyclingstation.png",
                spacestation: "../starRealms/cards/small/spacestation.png",
                warworld: "../starRealms/cards/small/warworld.png",
                battlecruiser: "../starRealms/cards/small/battlecruiser.png",
                royalredoubt: "../starRealms/cards/small/royalredoubt.png",
                dreadnaught: "../starRealms/cards/small/dreadnaught.png",
                fleethq: "../starRealms/cards/small/fleethq.png",
            },
            large: {

            }
        },
        actions: {
            undef: "../starRealms/actions/undef.png",

            combat: "../starRealms/actions/combat.png",
            play: "../starRealms/actions/play.png",
            end: "../starRealms/actions/end.png",
            buy: "../starRealms/actions/buy.png",
            buyTopDeck: "../starRealms/actions/buyTopDeck.png",

            scrap: "../starRealms/actions/scrap.png",
            ally: "../starRealms/actions/ally.png",
            primary: "../starRealms/actions/primary.png"
        },
        displays: {
            yourturn: "../starRealms/displays/yourturn.png",
            oppturn: "../starRealms/displays/oppturn.png",
            youwon: "../starRealms/displays/youwon.png",
            youlost: "../starRealms/displays/youlost.png",
            wait: "../starRealms/displays/wait.png",

        }
    }
};