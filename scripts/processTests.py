#!/usr/bin/env python
# -*- coding: utf-8 -*-

# sudo pip3 install python-bitcoinlib
from bitcoin.wallet import CBitcoinSecret, P2PKHBitcoinAddress
import codecs
import os
import requests
import json


"""
Get functionAddress:
    truffle(default)> console.log(TestRecover.deployed());
    0x71f4dc38d9372841de964ed3399044d62fe6005a
    

Test data format:
0,ec83e4d6ea786f27507673e65212b6b6f48b9a5bc49dd74c7029fbb4087cb0b4,03b2868f0c2837721fd60edc9a2571ecd3fb8f6e80b061a6fd8191d32cd0c60c17,04b2868f0c2837721fd60edc9a2571ecd3fb8f6e80b061a6fd8191d32cd0c60c1747f50698e1d8572f4d786ac589742a950f135a87ff6c2f1d1116d43448b1b8bb,1ac4ebd74a90a03f6b3e0b7963bca48627f18a81

truffle(default)> web3.sha3('recoverY(uint8,uint256)')
    '0xbc2047a5c1b3a75ecefa9bcfe797801a987a6688e91fc48ab15a9b3320626512'
    And take the first 4 bytest to create the data parameter
    0xbc2047a5
"""


Order = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

def getSecretBytes():
    while True:
        s = os.urandom(32)
        
        s_test = int.from_bytes(s, byteorder='big')
        if s_test > 1 and s_test < Order:
            return s

def main():
    
    functionAddress = '0x71f4dc38d9372841de964ed3399044d62fe6005a'
    recoverYPrefix = '0xbc2047a5'
    CPKToEthPrefix = '0x978cd1a6'
    
    url = 'http://localhost:8545';
    headers = {'content-type': 'application/json'};
    
    rpcId = 1
    
    with open('testData.csv') as fp, requests.Session() as session:
        for ln, line in enumerate(fp):
            #if ln > 10: break
            
            arr = line.strip().split(',')
            
            if len(arr) != 5:
                print('Invalid line: ' + line)
                continue
            
            cpubkey = arr[2]
            
            if len(cpubkey) != 66:
                print('Invalid cpubkey, line: ' + line)
                continue
            
            prefix = cpubkey[:2]
            pubkeyData = cpubkey[2:]
            
            prefix = "0"*62 + prefix
            
            data = recoverYPrefix + prefix + pubkeyData
            
            #print(data)
            #03b2868f0c2837721fd60edc9a2571ecd3fb8f6e80b061a6fd8191d32cd0c60c17
            
            #curl localhost:8545 -X POST --data '{"jsonrpc":"2.0", "method":"eth_call", "params":[{"from": "eth.accounts[0]", "to": "0x71f4dc38d9372841de964ed3399044d62fe6005a", "data": "0xbc2047a50000000000000000000000000000000000000000000000000000000000000003c4ff14c57405712bc8bed1d5e4c96805d5e35712f0749b2510eba53c0bb02567"}], "id":1}'
            
            payload = '{"jsonrpc":"2.0",\
               "method": "eth_call",\
               "params": [{"from": "eth.accounts[0]", "to": "'+functionAddress+'",\
               "data": "'+data+'"}],\
               "id": '+str(rpcId)+'}';
            
            r = session.post(url, data=payload, headers=headers)
            rpcId+=1
            resultData = r.json()['result']
            
            #print(resultData)
            # resultData
            #  0x47f50698e1d8572f4d786ac589742a950f135a87ff6c2f1d1116d43448b1b8bb
            
            pubkey = arr[3]
            
            if len(pubkey) != 130:
                print('Invalid pubkey, line: ' + line)
                continue
            
            #print(pubkey[-64:])
            if resultData[2:] != pubkey[-64:]:
                print('ERROR: recoverY failed! line: ' + line)
                continue
            
            data = CPKToEthPrefix + prefix + pubkeyData
            payload = '{"jsonrpc":"2.0",\
               "method": "eth_call",\
               "params": [{"from": "eth.accounts[0]", "to": "'+functionAddress+'",\
               "data": "'+data+'"}],\
               "id": '+str(rpcId)+'}';
            
            r = session.post(url, data=payload, headers=headers)
            rpcId+=1
            resultData = r.json()['result']
            #print(resultData)
            
            address = arr[4]
            
            if len(address) != 40:
                print('Invalid address, line: ' + line)
                continue
            
            
            #print(address)
            #0x000000000000000000000000ce5ad2b07eb198772e54df85d00849fa4af95a66
            
            # results are always packed to 32 bytes
            if resultData[-40:] != address:
                print('ERROR: recoverY failed! line: ' + line)
                continue
            
            if ln % 100 == 0:
                print('line %d' % (ln))
            
            
            
    
    print("Done.")

if __name__ == '__main__':
    main()

