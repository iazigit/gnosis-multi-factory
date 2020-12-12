const { ethers } = require('ethers')
const safeProxyDetails = require('./build/contracts/Safe_1_1_1_Factory.json')
require('dotenv').config()


const log = x => console.log(x)
const projectId = process.env.INFURA_TOKEN || ''
const threshold = process.env.THRESHOLD || 1
let owners = process.env.OWNERS.split(',')
let mnemonic = process.env.MNEMONIC

//provider = new ethers.providers.InfuraProvider("homestead", projectId);
provider = new ethers.providers.JsonRpcProvider();
//provider = new ethers.providers.InfuraProvider("rinkeby", projectId);

provider.getBlockNumber().then((n) => {
    console.log("Block number " + n)
})

//const wallet = ethers.Wallet.createRandom().connect(provider)
const wallet = ethers.Wallet.fromMnemonic(mnemonic)
w = wallet.connect(provider) 

console.log(`Wallet address: ${w.address}`)

w.getBalance().then((bal => {
    log("Balance: " + ethers.utils.formatEther(bal))
}))



let abi = [
        "function double(uint256 n) pure returns (uint256)",
        "function createMultiSig(address[] memory owners, uint256 threshold) payable public"
]

const deployProxy = async () => {

    let bytecode = safeProxyDetails.bytecode
    let safeProxyFactory = new ethers.ContractFactory(abi, bytecode, w)
    let safeProxy = await safeProxyFactory.deploy()
    log(`Safe proxy address: ${safeProxy.address}`)

    let deployTx = await safeProxy.deployTransaction
    deployTx = await deployTx.wait()

    return safeProxy.address 

}


const getMultisigSafe = async (owners, threshold) => {

    log(`Getting safe for ${owners} with thresh ${threshold}`)
    return
    log("DONT GO HERE")

    const safeProxyAddress = await deployProxy()
    //const safeProxyAddress = "0x72b19A4d22dC7B4bC461be99332CC2417Bd46AbC"

    
    safeProxy = new ethers.Contract(safeProxyAddress, abi, w)
    let options =    {
      gasPrice: ethers.utils.parseUnits('18.1', 'gwei'),
      gasLimit: 800000
    }
    let gas = await safeProxy.estimateGas.createMultiSig(owners, threshold)
    log(`Estimated gas: ${gas}`)
    //let tx = await safeProxy.populateTransaction.createMultiSig(owners, threshold)
    
    let tx = await safeProxy.createMultiSig(owners, threshold, options)
     
    tx = await tx.wait()
    
    let safeAddress = "0x" + tx.logs[0].data.slice(26)
    log(`Your safe address is: ${safeAddress}`)

   // await wallet.signTransaction(tx)
   /* w.populateTransaction(tx)
        .then((tx) => {
            log(" gasPrice: " + ethers.utils.formatEther(tx.gasPrice))
            log(" gasLimit: " + ethers.utils.formatUnits(tx.gasLimit, "gwei"))
        })

    tx = await w.sendTransaction(tx)
    tx.wait(1).then((receipt) => {
        log("Receipt")
        log(receipt)
    })
*/
}


getMultisigSafe(owners, threshold).then( () => console.log("done"))
                 .catch((e) => console.log(e))
