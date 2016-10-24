
var btcproof = require('bitcoin-proof');

var accounts;
var account;

function appendText(msg) {
    $('#taResults').val($('#taResults').val() + msg);
};

function getDestScript() {
    console.log("getDestScript");
    
    var contract = TestBtxToToken.deployed();
    
    console.log("getDestScript");
    appendText("\ngetDestScript:\n");
    contract.getDestScript.call({from: account}).then(function(value) {
        var hexVal = value.toString(16)
        
        appendText("data: " + hexVal + "\n");
        
    }).catch(function(e) {
        console.log(e);
        appendText("Error, see log.\n");
    });
    
};

function setDestScript() {
    console.log("setDestScript");
    
    var contract = TestBtxToToken.deployed();
    
    var destScript = '0x' + $('#destScript').val();
    
    
    console.log("setDestScript: " + destScript);
    appendText("\nsetDestScript: " + destScript + "\n");
    contract.setDestScript(destScript, {from: account, gas: 3000000 }).then(function(value) {
        var hexVal = value.toString(16)

        appendText("\tTxn id:"+ hexVal + "\n");

        web3.eth.getTransactionReceipt(hexVal, function(error, event) {
            if (error) {
                console.log("Error: " + error);
                appendText("Error: " + error + "\n");
            } else {
                console.log(event.event + ": " + JSON.stringify(event));
                var receipt = JSON.stringify(event, null, 2);
                appendText("TransactionReceipt\n: " + receipt + "\n");
            }
        });
    }).catch(function(e) {
        console.log(e);
        appendText("Error, see log.\n");
    });
};

function lookupTxn() {
    console.log("lookupTxn");
    var txid = $('#txnHash').val();
    
    var urlJsonTx = ($('#sbTest').val() == 'test'
        ? "https://tbtc.blockr.io/api/v1/tx/raw/"
        : "https://btc.blockr.io/api/v1/tx/raw/")  + txid;
    
    
    // btc-relay: relayTx(rawTransaction, transactionIndex, merkleSibling, blockHash, contractAddress)
    
    //console.log(urlJsonTx);
    appendText("\n"+urlJsonTx+"\n");
    $.getJSON(urlJsonTx, function(data) {
        $('#txnRaw').val(data.data.tx.hex);
        appendText("Result: "+data.data.tx.hex+"\n");
        
        /*
        var blockNum = data.data.tx.blockhash;
        //var blockInfoUrl = "http://btc.blockr.io/api/v1/block/raw/"+blockNum;
        var blockInfoUrl = "http://tbtc.blockr.io/api/v1/block/raw/"+blockNum;
        
        $.getJSON(blockInfoUrl, function(res) {
            gBlockHashOfTx = res.data.hash;
            $('#txnBlockHash').val(gBlockHashOfTx)

            var txIndex;
            for (var key in res.data.tx) {
                if (res.data.tx[key] == txid) {
                    txIndex = key;
                    break;
                }
            }

            // Proof can now be computed from the raw transaction and
            // transaction index
            gMerkleProof = btcproof.getProof(res.data.tx, txIndex);
            //console.log('merkle proof: ', gMerkleProof)
            $('#mProof').val(JSON.stringify(gMerkleProof));

            //gFeeVerifyFinney = web3.fromWei(gRelayContract.getFeeAmount.call('0x'+gBlockHashOfTx), 'finney');
            //$('#feeVerifyTx').text(gFeeVerifyFinney);
        })
        */
    })
}

function processTxn() {
    console.log("processTxn");
    
    var contract = TestBtxToToken.deployed();
    
    var txnHash = '0x' + $('#txnHash').val();
    var txnBytes = '0x' + $('#txnRaw').val();
    
    console.log(txnHash);
    
    appendText("\nprocessTxn: "+txnHash+"\n");
    
    contract.processTransaction(txnBytes, txnHash, {from: account, gas: 3000000 }).then(function(value) {
        var hexVal = value.toString(16)

        appendText("\tTxn id:"+ hexVal + "\n");

        web3.eth.getTransactionReceipt(hexVal, function(error, event) {
            if (error) {
                console.log("Error: " + error);
                appendText("Error: " + error + "\n");
            } else {
                console.log(event.event + ": " + JSON.stringify(event));
                var receipt = JSON.stringify(event, null, 2);
                appendText("TransactionReceipt\n: " + receipt + "\n");
            }
        });
    }).catch(function(e) {
        console.log(e);
        appendText("Error, see log.\n");
    });
}



window.onload = function() {
    
    //$('#relayAddr').text(gRelayAddr);
    
    $('#destScript').val('76a9149cd4d10ef95ba0b12de96178df25a12b4a2f63fe88ac')
    
    $('#txnHash').val('8b20b8927b0b5f7cf5a461a42661cac24263e478eef8c271016392112fe1e2bb');
    
    $('#txnRaw').val('0100000001448bb7e8d9bb0a1917c3b1d72f6ac2ee6e201a531b4ef27c506a7d7271ccc02a010000006a473044022070c33aae3772b60569517227227131f2a64b6a95261b7f3ff7233e94c7d992770220356d10b312882442de0899f784f783147a6550c2aa1be135201930c0f2da72f0012103c4ff14c57405712bc8bed1d5e4c96805d5e35712f0749b2510eba53c0bb02567feffffff0258863a00000000001976a914049269203c918945276bd140e88811d1db1ea7f688aca0860100000000001976a9149cd4d10ef95ba0b12de96178df25a12b4a2f63fe88acdd190f00');
    
    
    
    web3.eth.getAccounts(function(err, accs) {
        if (err != null) {
            alert("There was an error fetching your accounts.");
            return;
        }
        
        if (accs.length == 0) {
            alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
            return;
        }
        
        accounts = accs;
        account = accounts[0];
        
        //refreshBalance();
    });
}
