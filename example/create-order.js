const ccxt = require ('ccxt')

const mockExchange = require('../dist');

;(async () => {
    const exchange = new mockExchange.mock ({
    })

    // try to load markets first, retry on request timeouts until it succeeds:

    while (true) {

        try {

            await exchange.loadMarkets ();
            break;

        } catch (e) {

            if (e instanceof ccxt.RequestTimeout)
                console.log (exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
        }
    }

    const symbol = 'RCC/BTC'
    const orderType = 'limit'
    const side = 'sell'
    const amount = 5;
    const price = 0.00015;

    // try just one attempt to create an order

    try {

        const response = await exchange.createOrder (symbol, orderType, side, amount, price);
        console.log (response);
        console.log ('Succeeded');

    } catch (e) {

        console.log (Date.now (), e.constructor.name, e.message)
        console.log ('Failed');

    }

}) ()