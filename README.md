# CCXT Mock Exchange

Quick and dirty mock exchange for [CCXT](https://github.com/ccxt/ccxt/) sufficient for my own needs but perhaps useful for others.

## My design considerations

- No need for external libs except for ccxt itself
- Stay as close to the ccxt exchange classes as possible

## What does it offer

- Order creation and cancelling including stop orders, use the following parameters for createOrder
````JavaScript
{
        symbol: "RCC/BTC",
        type: 'market',
        side: "buy",
        amount: 5,
        price: undefined,
        params: {
            type: 'stopMarket',
            stopPrice: '0.00011'
        }
    }
````
- One market (RCC/BTC) with the currency: RollerCoasterCoin (RCC) where its exchange rate goes up and down really fast