import { Exchange, Market, Order, Balances, Ticker, Trade, Currency, Dictionary } from "ccxt";


export class mock extends Exchange {
    mockMarkets = [
        { base: 'RCC', quote: 'BTC' }, // rollercoastercoin, which goes up and down very fast
    ]

    mockCurrencies: Dictionary<Currency> = {
        RCC: {
            id: 'RCC',
            code: 'RCC',
            precision: 8
        }
    }

    orders: Order[] = new Array<Order>();
    trades: Trade[] = new Array<Trade>();

    rccPrice: number = 0.00015;
    rccPriceDirection: 'up' | 'down' = 'up';

    balances = {
        'RCC': {
            free: 10000,
            used: 0,
            total: 10000
        },
        'BTC': {
            free: 0.05,
            used: 0,
            total: 0.05
        }
    }

    constructor() {
        super();

        this.currencies = this.mockCurrencies;
        this.startRollercoaster();
    }

    private startRollercoaster() {
        // make the price go up and down
        setInterval(() => {
            if (this.rccPrice >= 0.0003) this.rccPriceDirection = 'down';
            if (this.rccPrice <= 0.0001) this.rccPriceDirection = 'up';

            this.rccPrice = Number((this.rccPriceDirection == 'up' ? this.rccPrice + 0.00001 : this.rccPrice - 0.00001).toFixed(5));

            // trigger orders
            this.triggerRccOrders(this.rccPrice);
        }, 100);

    }

    private createMatchingTradeForOrder(o: Order) {
        let date = new Date();

        let t: Trade = {
            amount: o.amount,
            timestamp: date.getTime() / 1000,
            datetime: date.toISOString(),
            id: this.createOrderId(),
            price: o.price,
            type: o.type,
            side: o.side,
            symbol: o.symbol,
            takerOrMaker: 'maker',
            cost: 0,
            fee: null,
            info: {}
        }

        this.trades.push(t);

        return t;
    }

    private triggerRccOrders(rccPrice) {
        let matchingOrders = this.orders.filter((o) => o.price == rccPrice && o.status == 'open' && o.type == 'limit');

        for (let o of matchingOrders) {
            this.processMatchingOrder(o);
        }

        let stopOrders = this.orders.filter((o) => { 
            if (o.status == 'open' && o['info'] && o.info['type'] === 'stopMarket') {
                if ((o.side == 'sell' ? rccPrice > Number(o.info['stopPrice']) : rccPrice < Number(o.info['stopPrice']) )) {
                    return true;
                }
            }
            return false;
        });


        for (let o of stopOrders) {
            this.processMatchingOrder(o);
        }
    }

    private processMatchingOrder(o: Order) {
        let date = new Date();
        let trade = this.createMatchingTradeForOrder(o);

        o.trades.push(trade);
        o.remaining = 0;
        o.filled = o.amount;
        o.lastTradeTimestamp = trade.timestamp;

        this.processBalanceForOrder(o);

        o.status = 'closed';
    }

    private createMockMarkets() {
        let markets = [];
        for (let m in this.mockMarkets) {
            let market = {
                id: `${this.mockMarkets[m].base}${this.mockMarkets[m].quote}`,
                symbol: `${this.mockMarkets[m].base}/${this.mockMarkets[m].quote}`,
                active: true,
                base: this.mockMarkets[m].base,
                quote: this.mockMarkets[m].quote,
                precision: { "base": 8, "quote": 8, "amount": 3, "price": 6 },
                limits: { "amount": { "min": 0.001, "max": 100000 }, "price": { "min": 0.000001, "max": 100000 }, "cost": { "min": 0.0001 }, "market": { "min": 0, "max": 10010.61492249 } }
            }


            markets.push(market);
        }

        return markets;
    }

    private createOrderId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'mock',
            'name': 'MockExchange',
            'comment': 'Mock Exchange for testing',
            'has': {
                'fetchMarkets': true,
                'fetchBalance': true,
                'fetchOrder': true,
                'fetchOrders': true,
                'createOrder': true,
                'cancelOrder': true,
                'cancelAllOrders': true,
            }
        })
    }

    async fetchCurrencies(params = {}) {
        return new Promise<Dictionary<Currency>>((resolve, reject) => {
            resolve(this.mockCurrencies);
        })
    }

    async fetchMarkets(params = {}) {
        return new Promise<Market[]>((resolve, reject) => {
            let markets = this.createMockMarkets();

            resolve(markets);
        })
    }

    async fetchBalance(params = {}) {
        return new Promise<Balances>((resolve, reject) => {
            resolve(this.parseBalance(this.balances));
        })
    }

    async fetchTicker(symbol, params = {}) {
        return new Promise<Ticker>((resolve, reject) => {
            let date = new Date();

            let tick: Ticker = {
                symbol: 'RCC/BTC',
                timestamp: date.getTime() / 1000,
                datetime: date.toISOString(),
                high: 0.05,
                low: 0.01,
                bid: this.rccPrice,
                ask: this.rccPrice,
                info: {}
            }

            resolve(tick);
        })
    }

    async fetchTrades(symbol, since = undefined, limit = undefined, params = {}) {
        return new Promise<Trade[]>((resolve, reject) => {
            resolve(this.trades);
        })
    }

    async fetchOrder(id, symbol = undefined, params = {}) {
        return new Promise<Order>((resolve, reject) => {
            resolve(this.orders.find((o) => o.id == id))
        })
    }

    async fetchOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return new Promise<Order[]>((resolve, reject) => {
            resolve(this.orders)
        })
    }

    async fetchOpenOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return new Promise<Order[]>((resolve, reject) => {
            resolve(this.orders.filter((o) => o.status == 'open'))
        })
    }

    async createOrder(symbol, type, side, amount, price = undefined, params = {}) {
        return new Promise<Order>((resolve, reject) => {
            let date = new Date();

            let o: Order = {
                id: this.createOrderId(),
                symbol: symbol,
                type: type,
                side: side,
                amount: amount,
                price: price,
                timestamp: date.getTime() / 1000,
                datetime: date.toISOString(),
                info: {},
                status: 'open',
                remaining: amount,
                cost: 0,
                fee: null,
                filled: 0,
                lastTradeTimestamp: 0,
                trades: []
            }

            this.reserveBalanceForOrder(o);

            if (params && params['type']) {
                o['type'] = params['type'];
                o.info['type'] = params['type'];
                o.info['stopPrice'] = params['stopPrice'];
            } else if (type == 'market') {
                // direct process market orders
                this.processMatchingOrder(o);
            }

            this.orders.push(o);
            resolve(o);
        })
    }

    private reserveBalanceForOrder(o: Order) {
        let market = this.markets[o.symbol];

        if (o.side == 'buy') {
            this.balances[market.quote]['free'] -= o.amount * o.price;
            this.balances[market.quote]['used'] += o.amount * o.price;
        } else {
            this.balances[market.base]['free'] -= o.amount;
            this.balances[market.base]['used'] += o.amount;
        }
    }

    private processBalanceForOrder(o: Order) {
        let market = this.markets[o.symbol];

        if (o.side == 'buy') {
            this.balances[market.quote]['used'] -= o.amount * o.price;
            this.balances[market.quote]['total'] -= o.amount * o.price;
            this.balances[market.base]['free'] += o.amount;
            this.balances[market.base]['total'] += o.amount;
        } else {
            this.balances[market.base]['used'] -= o.amount;
            this.balances[market.base]['total'] -= o.amount;
            this.balances[market.quote]['free'] += o.amount * o.price;
            this.balances[market.quote]['total'] += o.amount * o.price;
        }
    }

    async cancelOrder(id, symbol = undefined, params = {}) {
        return new Promise<Order>((resolve, reject) => {
            let o = this.orders.find((o) => o.id == id);

            o.status = 'canceled';

            resolve(o)
        })
    }
}