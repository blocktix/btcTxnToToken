var accounts;
var account;

function appendText(msg) {
    $('#taResults').val($('#taResults').val() + msg);
};

function decompress(doTxn) {
    var contract = TestRecover.deployed();
    
    var cpk = $('#cPubkey').val();
    var prefix = cpk.slice(0,2);
    cpk = cpk.slice(2);
    
    prefix = '0x' + prefix;
    cpk = '0x' + cpk;
    
    console.log(prefix);
    console.log(cpk);
    
    if (doTxn) {
        contract.recoverY(prefix, cpk, {from: account, gas: 3000000 }).then(function(value) {
            var hexVal = value.toString(16)
            
            appendText("recoverY Txn: " + cpk + "\n id:"+ hexVal + "\n");
            
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
    } else {
        contract.recoverY.call(prefix, cpk, {from: account}).then(function(value) {
            var hexVal = value.toString(16)
            
            appendText("Call recoverY: " + cpk + "\n -> "+ hexVal + "\n");
            
        }).catch(function(e) {
            console.log(e);
            appendText("Error, see log.\n");
        });
    };
};

function toAddress(doTxn) {
    var contract = TestRecover.deployed();
    
    var cpk = $('#cPubkey').val();
    var prefix = cpk.slice(0,2);
    cpk = cpk.slice(2);
    
    prefix = '0x'+prefix;
    cpk = '0x'+cpk;
    
    console.log(prefix);
    console.log(cpk);
    
    if (doTxn) {
        contract.CPKToEthAddress(prefix, cpk, {from: account, gas: 3000000 }).then(function(value) {
            var hexVal = value.toString(16)
            
            appendText("CPKToEthAddress Txn: " + cpk + "\n id:"+ hexVal + "\n");
            
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
    } else {
        contract.CPKToEthAddress.call(prefix, cpk, {from: account}).then(function(value) {
            var hexVal = value.toString(16)
            
            appendText("Call CPKToEthAddress: " + cpk + "\n -> "+ hexVal + "\n");
            
        }).catch(function(e) {
            console.log(e);
            appendText("Error, see log.\n");
        });
    };
};

function processFile() {
    console.log("processFile");
    
    /*
    Test data format:
        dataid,privkey,compressed pubkey,pubkey,ethereum key
        0,ec83e4d6ea786f27507673e65212b6b6f48b9a5bc49dd74c7029fbb4087cb0b4,03b2868f0c2837721fd60edc9a2571ecd3fb8f6e80b061a6fd8191d32cd0c60c17,04b2868f0c2837721fd60edc9a2571ecd3fb8f6e80b061a6fd8191d32cd0c60c1747f50698e1d8572f4d786ac589742a950f135a87ff6c2f1d1116d43448b1b8bb,1ac4ebd74a90a03f6b3e0b7963bca48627f18a81
    */
    
    var contract = TestRecover.deployed();
    
    var files = document.getElementById('files').files;
    if (!files.length) {
        alert('Please select a file!');
        return;
    }

    var file = files[0];
    
    var lr = new LineReader({chunkSize: 2048});
    
    var lineCount = 0;
    var nTestsRun = 0;
    var nTestsDone = 0;
    var nTestsPassed = 0;
    
    var startLine = parseInt($('#lStart').val());
    var nTests = parseInt($('#tCount').val());
    var maxLine = startLine + nTests;
    
    appendText("Testing " + nTests + ", from " + startLine + "\n");
    
    lr.on('line', function (line, next) {
        lineCount++;
        
        if (lineCount < startLine) {
            next();
            return;
        };
        //console.log(line);
        
        var arr = line.split(",");
        if (arr.length != 5) {
            console.log("invalid line: " + line);
            if (lineCount < maxLine) {
                next();
                return;
            };
        };
        
        var errText = '';
        var compressed_pubkey = arr[2];
        
        if ((compressed_pubkey.slice(0, 2) != "02"
                && compressed_pubkey.slice(0, 2) != "03")
            || compressed_pubkey.length != 33 * 2)
            errText += 'Invalid cpubkey ';
        
        var pubkey = arr[3];
        if (pubkey.slice(0, 2) != '04'
            || pubkey.length != 65 * 2)
            errText += 'Invalid pubkey ';
        
        //console.log("cpubkey.length " + compressed_pubkey.length + "cpubkey: " +compressed_pubkey);
        //console.log("pubkey.length " + pubkey.length + " pubkey: " +pubkey);
        //console.log("pubkey.slice(0, 2) " + pubkey.slice(0, 2) + " - " + pubkey.slice(0, 2) != "04");
        
        if (errText != '') {
            console.log("invalid line: " +errText +" - "+ line);
            if (lineCount < maxLine) {
                next();
                return;
            };
        };
        
        var address = arr[4];
        
        var prefix = compressed_pubkey.slice(0, 2);
        var cpk = compressed_pubkey.slice(2);
        
        prefix = '0x' + prefix;
        cpk = '0x' + cpk;
        
        //console.log("prefix: " + prefix);
        //console.log("cpk: " + cpk);
        
        var testResult = (function (pPubkey) {
            return function(value) {
                nTestsDone++;
                
                var decompY = value.toString(16)
                
                // toString drops leading 0s
                var pad = 64 - decompY.length;
                for (i = 0; i < pad; ++i)
                    decompY = '0' + decompY;
                
                //console.log("decompY: " + decompY);
                //console.log("pubkey.slice: " + pPubkey.slice(33*2));
                
                if (decompY == pPubkey.slice(33*2))
                {
                    nTestsPassed++;
                    if (nTestsPassed % 10 == 0)
                    {
                        appendText("nTestsPassed: " + nTestsPassed + "\n");
                        appendText("cpk: " + cpk + "\n");
                    }
                } else
                {
                    console.log("Test1 failed, line: " + line);
                    appendText("Test1 failed, line: " + line + "\n");
                    appendText("decompY:      " + decompY + "\n");
                    appendText("pubkey.slice: " + pPubkey.slice(33*2) + "\n");
                }
                
                if (nTestsDone == nTestsRun)
                    appendText("Done.\n");
            };
        })(pubkey);
        
        nTestsRun++;
        contract.recoverY.call(prefix, cpk, {from: account}).then(testResult).catch(function(e)
        {
            console.log(e);
        });
        
        var testResult2 = (function (pAddress) {
          return function(value) {
            
            nTestsDone++;
            
            var computedAddress = value.toString(16)
            
            // toString drops leading 0s
            var pad = 40 - computedAddress.length;
            for (var i = 0; i < pad; ++i)
                computedAddress = '0' + computedAddress;
            
            // - strangely value is prefixed with 0x here, and not in recoverY
            pAddress = '0x' + pAddress;
            
            //console.log("computedAddress: " + computedAddress);
            //console.log("pAddress: " + pAddress);
            
            if (computedAddress == pAddress)
            {
                nTestsPassed++;
                if (nTestsPassed % 10 == 0)
                {
                    appendText("nTestsPassed: " + nTestsPassed + "\n");
                    appendText("cpk: " + cpk + "\n");
                }
            } else
            {
                console.log("Test2 failed, line: " + line);
                appendText("Test2 failed, line: " + line + "\n");
                appendText("out address:  " + computedAddress + "\n");
                appendText("pAddress:     " + pAddress + "\n");
            }
            
            if (nTestsDone == nTestsRun)
                appendText("Done.\n");
          }
        })(address);
        
        nTestsRun++;
        contract.CPKToEthAddress.call(prefix, cpk, {from: account}).then(testResult2).catch(function(e)
        {
            console.log(e);
        });
        
        if (lineCount < maxLine)
            next();
    });

    lr.on('error', function (err) {
        console.log(err);
        waitVar = 0;
    });

    lr.on('end', function () {
        console.log('Read complete!');
        waitVar = 0;
    });
    
    lr.read(file);
    
};

function setStatus(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
};

window.onload = function() {
    
    $('#cPubkey').val('03c4ff14c57405712bc8bed1d5e4c96805d5e35712f0749b2510eba53c0bb02567');
    
    $('#lStart').val('1');
    $('#tCount').val('200');
    
    web3.eth.getAccounts(function(err, accs) {
        if (err != null) {
            alert("There was an error fetching your accounts.");
            return;
        };
        
        if (accs.length == 0) {
            alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
            return;
        };
        
        accounts = accs;
        account = accounts[0];
    });
};
