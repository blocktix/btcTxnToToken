module.exports = {
    build: {
        "index.html": "index.html",
        "app.js": [
            "javascripts/app.js"
        ],
        "jquery-3.1.1.min.js": [
            "javascripts/jquery-3.1.1.min.js"
        ],
        "LineReader.js": [
            "javascripts/LineReader.js"
        ],
        "app.css": [
            "stylesheets/app.css"
        ],
        "images/": "images/"
        },
        rpc: {
        host: "localhost",
        port: 8545
    }
};
