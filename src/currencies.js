var ETHValidator = require("./ethereum_validator");
var BTCValidator = require("./bitcoin_validator");
var BCHValidator = require("./bch_validator");

// defines P2PKH and P2SH address types for standard (prod) and testnet networks
var CURRENCIES = [
    {
        name: "Bitcoin",
        symbol: "btc",
        addressTypes: { prod: ["00", "05"], testnet: ["6f", "c4", "3c", "26"] },
        validator: BTCValidator,
    },
    {
        name: "BitcoinCash",
        symbol: "bch",
        regexp: "^[qQpP]{1}[0-9a-zA-Z]{41}$",
        addressTypes: { prod: ["00", "05"], testnet: ["6f", "c4"] },
        validator: BCHValidator,
    },
    {
        name: "LiteCoin",
        symbol: "ltc",
        addressTypes: { prod: ["30", "05", "32"], testnet: ["6f", "c4", "3a"] },
        validator: BTCValidator,
    },
    {
        name: "DogeCoin",
        symbol: "doge",
        addressTypes: { prod: ["1e", "16"], testnet: ["71", "c4"] },
        validator: BTCValidator,
    },
    {
        name: "Ripple",
        symbol: "xrp",
        validator: XRPValidator,
    },
    {
        name: "Dash",
        symbol: "dash",
        addressTypes: { prod: ["4c", "10"], testnet: ["8c", "13"] },
        validator: BTCValidator,
    },
    {
        name: "Ethereum",
        symbol: "eth",
        validator: ETHValidator,
    },
];

module.exports = {
    getByNameOrSymbol: function (currencyNameOrSymbol) {
        var nameOrSymbol = currencyNameOrSymbol.toLowerCase();
        return CURRENCIES.find(function (currency) {
            return (
                currency.name.toLowerCase() === nameOrSymbol ||
                currency.symbol.toLowerCase() === nameOrSymbol
            );
        });
    },
    getAll: function () {
        return CURRENCIES;
    },
};

//spit out details for readme.md
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`* ${c.name}/${c.symbol} \`'${c.name}'\` or \`'${c.symbol}'\` `));

//spit out keywords for package.json
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`"${c.name}","${c.symbol}",`));
