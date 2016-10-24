//pragma solidity ^0.4.2;

contract TestBtxToToken
{
    address addrOwner;      // TODO: hardcode?
    address addrBTCRelay;
    
    uint256 constant P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    
    struct txInfo { uint8 state; }
    mapping(uint256 => txInfo) processedTransactions;
    
    uint256 destScript;
    uint256 lenDestScript;
    uint256 maskDestScript;
    
    function TestBtxToToken() // constructor
    {
        addrOwner = msg.sender;
    }
    
    function getInt64(bytes txn, uint i) internal constant returns (int64 rv)
    {
        rv = int64(txn[i++]);
        rv += int64(txn[i++]) * 256;
        rv += int64(txn[i++]) * 65536;
        rv += int64(txn[i++]) * 2**24;
        rv += int64(txn[i++]) * 2**32;
        rv += int64(txn[i++]) * 2**40;
        rv += int64(txn[i++]) * 2**48;
        rv +=int64(txn[i]) * 2**56;
        return rv;
    }
    
    function setDestScript(bytes newDest) returns (uint8 output)
    {
        // TODO: hardcode destination script values instead?
        // script is stored in uint256 so must be 32 bytes or less
        
        // Verify caller owns contract
        if (msg.sender != addrOwner)
            throw;
        
        //destinationScript = newDest;
        //log0("New destination script set");
        
        if (newDest.length > 32)
            throw;
        
        lenDestScript = newDest.length;
        
        maskDestScript = ~(2 ** ((32-newDest.length) * 8) - 1);
        //log1("maskDestScript", bytes32(maskDestScript));
        
        uint256 x;
        uint256 m = maskDestScript; // assembly won't use global vars
        assembly {
            x := mload(add(newDest, 32))
            x := and(x, m)
        }
        
        destScript = x;
        log1("destScript", bytes32(destScript));
        
        return 0;
    }
    
    function getDestScript() constant returns (uint256 output)
    {
        return destScript;
    }
    
    function matchDest(bytes memory v, uint o) internal constant returns (bool)
    {
        uint256 x;
        uint256 m = maskDestScript; // assembly won't use global vars
        assembly {
            x := mload(add(v, add(o, 32)))
            x := and(x, m)
        }
        
        //log1("x", bytes32(x));
        //log1("destScript", bytes32(destScript));
        
        return x == destScript;
        /*
        for (uint i = 0; i < destinationScript.length; i++)
            if (destinationScript[i] != v[o+i])
                return false;
        return true;
        */
    }
    
    function expmodUnroll(uint x, uint m) internal constant returns (uint r)
    {
        // 13120 gas
        //log1("gas1", bytes32(msg.gas));
        // Constant variables not yet implemented for inline assembly.
        r = 1;
        
        assembly {
            // 2 0
            x := mulmod(x, x, m)
            x := mulmod(x, x, m)
            
            // 2 1
            r := mulmod(r, x, m)
            x := mulmod(x, x, m)
            r := mulmod(r, x, m)
            x := mulmod(x, x, m)
            
            // 4 0
            x := mulmod(x, x, m)
            x := mulmod(x, x, m)
            x := mulmod(x, x, m)
            x := mulmod(x, x, m)
            
            // 22 1
            let k := 11
            loop1:
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                k := sub(k, 1)
                // jump to label if cond is nonzero
                jumpi(loop1, k)
            
            // 1 0
            x := mulmod(x, x, m)
            
            // 223 1
            k := 37
            loop2:
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                r := mulmod(r, x, m)
                x := mulmod(x, x, m)
                
                k := sub(k, 1)
                jumpi(loop2, k)
            
            r := mulmod(r, x, m)
            x := mulmod(x, x, m)
        }
        
        //log1("gas2", bytes32(msg.gas));
        
        //gas1 2d2b42 2960194
        //gas2 2cf802 2947074
    }
    
    
    function CPKToEthAddress(uint8 prefix, uint256 x) internal constant returns (address output)
    {
        uint256 a = addmod(mulmod(x, mulmod(x, x, P), P), 7, P);
        a = expmodUnroll(a, P);
        if (uint8(a & 1) != prefix - 0x02)
            a = P - a;
        
        output = address(sha3(x, a));
        return output;
    }
    
    function extractAddress(uint i, bytes txn) internal constant returns (address output)
    {
        uint8 prefix;
        uint256 x;
        
        prefix = uint8(txn[i++]);
        
        i += 32; // add 32 bytes to the offset, byte length is stored in the first 256bit word of bytes by memory offset
        assembly {
            x := mload(add(txn, i))
        }
        
        //log1("prefix", bytes32(prefix));
        //log1("x", bytes32(x));
        
        output = CPKToEthAddress(prefix, x);
        return output;
    }
    
    
    function processTransaction(bytes txn, uint256 txHash) returns (int256)
    {
        //Verify caller is btx-relay relaytx
        //if (msg.sender != addrBTCRelay)
        //    throw;
        
        if (processedTransactions[txHash].state == 1)
            throw;
        
        address addrOut = 0;
        
        uint i = 4;
        uint16 k;
        uint16 j;
        uint16 lenScript;
        int64 nValue;
        uint16 nCount;
        
        // number of inputs
        nCount = uint16(txn[i++]); // max txinputs seen in bitcoin live chain as of block 434312: 20k
        
        if (nCount > 253)
            throw;
        if (nCount == 253)
            nCount = uint16(txn[i++]) + uint16(txn[i++]) * 256;
        
        for (k = 0; k < nCount; k++)
        {
            i += 36; // skip prevout
            
            lenScript = uint16(txn[i++]);
            
            if (lenScript > 253)
                throw; // max scriptSigLen is set as 10k in bitcoincore code
            if (lenScript == 253)
                lenScript = uint16(txn[i++]) + uint16(txn[i++]) * 256;
            
            // Only process first input script
            if (k == 0)
            {
                uint opCode = uint8(txn[i++]);
                
                if (opCode < 0x01 || opCode > 0x4b) // PUSHDATA: 0x01-0x4b
                    throw;
                
                i += opCode; // skip over signature
                
                opCode = uint8(txn[i++]);
                // compressed public key takes 33 bytes
                // TODO: support uncompressed pubkeys? (65 bytes)
                if (opCode != 33)
                    throw;
                
                addrOut = extractAddress(i, txn);
                i += opCode;
            } else
            {
                i += lenScript;
            }
            
            i += 4; // sequence
        }
        
        // fail if no address found
        if (addrOut == 0)
            throw;
        
        log1("address:", bytes32(addrOut));
        
        
        nCount = uint16(txn[i++]); // max txoutputs seen in bitcoin live chain as of block 434312: 13107
        if (nCount > 253)
            throw; // max scriptSigLen is set as 10k in bitcoincore code
        if (nCount == 253)
            nCount = uint16(txn[i++]) + uint16(txn[i++]) * 256;
        
        uint iValue; 
        for (k = 0; k < nCount; k++)
        {
            iValue = i;
            i += 8; // step over value until script matched
            
            lenScript = uint16(txn[i++]);
            if (lenScript > 253)
                throw; // max scriptLen is set as 10k in bitcoincore code
            if (lenScript == 253)
                lenScript = uint16(txn[i++]) + uint16(txn[i++]) * 256;
            
            if (lenDestScript == lenScript
                && matchDest(txn, i))
                nValue += getInt64(txn, iValue);
            // TODO: break when first match is found? Could there ever be > 1 to same script?
            
            i += lenScript;
        }
        
        log1("nValue:", bytes32(nValue));
        
        //processedTransactions[txHash].state = 1;
        
    }
    
}
