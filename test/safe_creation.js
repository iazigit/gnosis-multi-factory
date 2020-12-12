var abi = require('ethereumjs-abi')

const safeDetails = require('@gnosis.pm/safe-contracts/build/contracts/GnosisSafe.json')
const GnosisSafe = new web3.eth.Contract(safeDetails.abi)
GnosisSafe.options.data = safeDetails.bytecode;

const factoryDetails = require('@gnosis.pm/safe-contracts/build/contracts/GnosisSafeProxyFactory.json')
const ProxyFactory = new web3.eth.Contract(factoryDetails.abi)
ProxyFactory.options.data = factoryDetails.bytecode;

const proxyDetails = require('@gnosis.pm/safe-contracts/build/contracts/IProxy.json')
const Proxy = new web3.eth.Contract(proxyDetails.abi)

const SecureFactory = artifacts.require('Safe_1_1_1_Factory')

contract('Safe 1.1.1 Factory', function(accounts) {
    let gnosisSafe
    let proxyFactory
    let safeFactory

    before(async function() {
        // Create Master Copies
        gnosisSafe = await GnosisSafe.deploy().send({ "from": accounts[0], "gas": 10000000 })
        proxyFactory = await ProxyFactory.deploy().send({ "from": accounts[0], "gas": 10000000 })
        // Adjust addresses for testing
        SecureFactory.bytecode = SecureFactory.bytecode
            .replace("34CfAC646f301356fAa8B21e94227e3583Fe3F5F".toLowerCase(), gnosisSafe.options.address.toLowerCase().slice(2))
            .replace("76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B".toLowerCase(), proxyFactory.options.address.toLowerCase().slice(2))
        safeFactory = await SecureFactory.new()
        console.log(accounts)
    })

    it('can use double', async () => {
        res = await safeFactory.double.call(21, {from: accounts[0]})
        res = await res.toString()
        assert.equal(res, 42)
        
    })
    
    it('can create a multisig', async () => {
        let threshold = 2
        owners = [accounts[0], accounts[1], accounts[2]]
        tx = await safeFactory.createMultiSig(owners, threshold, {from: accounts[0]})
       
        const safe = GnosisSafe.clone()
        safe.options.address = "0x" + tx.receipt.rawLogs[0].data.slice(26)
        const mastercopy = await web3.eth.getStorageAt(safe.options.address, 0)
        assert.equal(mastercopy, gnosisSafe.options.address.toLowerCase())
        const fallbackHandler = await web3.eth.getStorageAt(safe.options.address, "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5")
        assert.equal(fallbackHandler, "0x0")
        assert.equal(await safe.methods.getThreshold().call(), 2)
        assert.deepEqual(await safe.methods.getOwners().call(), owners)
        assert.deepEqual(await safe.methods.getModules().call(), [])
   
    
    })
/*
    it('deploy with funding', async () => {
        const tx = await web3.eth.sendTransaction({from: accounts[8], to: safeFactory.address, value: web3.utils.toWei("0.7331"), gas: 300000})
        const safe = GnosisSafe.clone()
        safe.options.address = "0x" + tx.logs[0].data.slice(26)
        const mastercopy = await web3.eth.getStorageAt(safe.options.address, 0)
        assert.equal(mastercopy, gnosisSafe.options.address.toLowerCase())
        const fallbackHandler = await web3.eth.getStorageAt(safe.options.address, "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5")
        assert.equal(fallbackHandler, "0x0")
        assert.equal(await safe.methods.getThreshold().call(), 1)
        assert.deepEqual(await safe.methods.getOwners().call(), [ accounts[8] ])
        assert.deepEqual(await safe.methods.getModules().call(), [])
        assert.equal(web3.utils.toWei("0.7331"), await web3.eth.getBalance(safe.options.address))
    })
   */ 
})
