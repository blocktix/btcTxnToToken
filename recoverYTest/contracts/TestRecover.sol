//pragma solidity ^0.4.2;

contract TestRecover
{
    uint256 constant P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    uint256 constant E = 0x3FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFFF0C;
    
    event TestEvent(uint test); 
    
    function powMod2(uint256 a, uint256 e) internal constant returns (uint256 output)
    {
        // E follows a set pattern, unrollable?
        output = 1;
        while (e != 0)
        {
            if (e & 1 == 1)
                output = mulmod(output, a, P);
            e /= 2;
            a = mulmod(a, a, P);
        }
        return output;
    }
    
    function expmod(uint b, uint e, uint m) internal constant returns (uint r)
    {
        // Constant variables not yet implemented for inline assembly.
        r = 1;
        uint bit = 2 ** 255;
        
        assembly {
            loop:
                jumpi(end, iszero(bit))
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, bit)))), m)
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, div(bit, 2))))), m)
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, div(bit, 4))))), m)
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, div(bit, 8))))), m)
                bit := div(bit, 16)
                jump(loop)
            end:
        }
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
    
    //function recoverY(uint8 prefix, uint256 x) constant returns (uint256 output)
    function recoverY(uint8 prefix, uint256 x) returns (uint256 output)
    {
        output = addmod(mulmod(x, mulmod(x, x, P), P), 7, P);
        //output = powMod2(output, E);
        //output = expmod(output, E, P);
        output = expmodUnroll(output, P);
        
        if (uint8(output & 1) != prefix - 0x02)
            output = P - output;
        
        //TestEvent(output);
        
        return output;
    }
    
    //function CPKToEthAddress(uint8 prefix, uint256 x) constant returns (address output)
    function CPKToEthAddress(uint8 prefix, uint256 x) returns (address output)
    {
        uint256 a = addmod(mulmod(x, mulmod(x, x, P), P), 7, P);
        //a = powMod2(a, E);
        //a = expmod(a, E, P);
        a = expmodUnroll(a, P);
        
        if (uint8(a & 1) != prefix - 0x02)
            a = P - a;
        
        output = address(sha3(x, a));
        
        //TestEvent(bytes32(output));
        
        return output;
    }
    
}
