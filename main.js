let web3;
let contract;
let account;
let usdt;
let kjc;

const contractAddress = "0xBaeF58FC0Eb20334b2fDEC4882e2AB972C1242DE";
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const kjcAddress = "0xd479ae350dc24168e8db863c5413c35fb2044ecd";
const chainId = 56;

window.addEventListener("load", async () => {
  if (window.bitkeep && window.bitkeep.ethereum) {
    web3 = new Web3(window.bitkeep.ethereum);
  } else if (window.ethereum) {
    web3 = new Web3(window.ethereum);
  } else {
    alert("Please install MetaMask or Bitget Wallet");
    return;
  }

  try {
    const accounts = await web3.eth.requestAccounts();
    account = accounts[0];
    document.getElementById("wallet").innerText = `✅ ${account}`;
    initContract();
    loadStakes();
  } catch (error) {
    console.error(error);
  }
});

async function initContract() {
  contract = new web3.eth.Contract(abi, contractAddress);
  usdt = new web3.eth.Contract(erc20ABI, usdtAddress);
  kjc = new web3.eth.Contract(erc20ABI, kjcAddress);
}

async function registerReferrer() {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (!ref || !web3.utils.isAddress(ref) || ref.toLowerCase() === account.toLowerCase()) {
    alert("Invalid or missing referrer address.");
    return;
  }

  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    alert("Registered successfully");
  } catch (e) {
    alert("Failed to register: " + e.message);
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  const usdtAmount = web3.utils.toWei(amount, "mwei");

  try {
    await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });
    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });
    alert("Purchase and Stake successful!");
    loadStakes();
  } catch (e) {
    alert("Transaction failed: " + e.message);
  }
}

async function claimReferralReward() {
  try {
    await contract.methods.claimReferralReward().send({ from: account });
    alert("Referral reward claimed!");
  } catch (e) {
    alert("Failed to claim referral reward: " + e.message);
  }
}

async function claimStakeReward(index) {
  try {
    await contract.methods.claimStakeReward(index).send({ from: account });
    alert("Stake reward claimed!");
  } catch (e) {
    alert("Failed to claim stake reward: " + e.message);
  }
}

async function unstake(index) {
  try {
    await contract.methods.unstake(index).send({ from: account });
    alert("Unstaked successfully!");
    loadStakes();
  } catch (e) {
    alert("Unstake failed: " + e.message);
  }
}

async function loadStakes() {
  const stakeCount = await contract.methods.getStakeCount(account).call();
  const stakeList = document.getElementById("stakeList");
  stakeList.innerHTML = "";

  for (let i = 0; i < stakeCount; i++) {
    const stake = await contract.methods.getStake(account, i).call();
    const claimed = stake.claimed ? "✅" : "❌";
    const stakeElem = document.createElement("div");
    stakeElem.innerHTML = `
      <p><b>Index:</b> ${i}</p>
      <p>Amount: ${web3.utils.fromWei(stake.amount)} KJC</p>
      <p>Start: ${new Date(stake.startTime * 1000).toLocaleString()}</p>
      <p>Last Claim: ${new Date(stake.lastClaimTime * 1000).toLocaleString()}</p>
      <p>Claimed: ${claimed}</p>
      <button onclick="claimStakeReward(${i})">Claim Reward</button>
      <button onclick="unstake(${i})">Unstake</button>
      <hr/>
    `;
    stakeList.appendChild(stakeElem);
  }
}
