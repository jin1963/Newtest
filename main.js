let web3;
let account;
let contract;
let usdt;

window.addEventListener('load', async () => {
  if (window.ethereum || window.bitkeep?.ethereum) {
    web3 = new Web3(window.ethereum || window.bitkeep.ethereum);
    contract = new web3.eth.Contract(contractABI, contractAddress);
    usdt = new web3.eth.Contract(erc20ABI, usdtAddress);
  } else {
    alert("Please install MetaMask or Bitget Wallet");
  }

  document.getElementById('connectWallet').onclick = connectWallet;
  document.getElementById('registerReferrer').onclick = registerReferrer;
  document.getElementById('buyKJC').onclick = buyAndStake;
  document.getElementById('copyLink').onclick = () => {
    navigator.clipboard.writeText(document.getElementById("referralLink").value);
    alert("Copied!");
  };
});

async function connectWallet() {
  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    const chainId = await web3.eth.getChainId();

    document.getElementById("walletStatus").innerText = `✅ ${account}`;
    document.getElementById("chainId").innerText = chainId;

    // Check for wrong chain
    if (chainId !== 56) {
      alert("Please switch to BNB Chain (Chain ID 56)");
    }

    // Load referral link
    document.getElementById("referralLink").value = `${window.location.origin}${window.location.pathname}?ref=${account}`;
  } catch (err) {
    alert("Failed to connect wallet.");
    console.error(err);
  }
}

async function registerReferrer() {
  const ref = document.getElementById("referrerInput").value;
  if (!web3.utils.isAddress(ref)) return alert("Invalid referrer address");
  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    alert("Registered successfully!");
  } catch (e) {
    alert("Register failed.");
    console.error(e);
  }
}

async function buyAndStake() {
  const amount = document.getElementById("usdtAmount").value;
  const ref = new URLSearchParams(window.location.search).get("ref") || "0x0000000000000000000000000000000000000000";
  const usdtAmount = web3.utils.toWei(amount, 'mwei'); // USDT 6 decimals

  try {
    const allowance = await usdt.methods.allowance(account, contractAddress).call();
    if (parseInt(allowance) < usdtAmount) {
      await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });
    }

    await contract.methods.buyWithReferralAndStake(usdtAmount, ref).send({ from: account });
    alert("Purchase & Stake successful!");
  } catch (e) {
    alert("Transaction failed.");
    console.error(e);
  }
}
