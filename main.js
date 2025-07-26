let web3, account, contract, usdt;

async function connectWallet() {
  if (window.ethereum || window.bitkeep?.ethereum) {
    web3 = new Web3(window.ethereum || window.bitkeep.ethereum);
    await web3.eth.requestAccounts();
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    contract = new web3.eth.Contract(contractABI, contractAddress);
    usdt = new web3.eth.Contract(usdtABI, usdtAddress);

    document.getElementById("walletAddress").innerText = "✅ " + account;
    document.getElementById("refLink").value = window.location.origin + window.location.pathname + "?ref=" + account;

    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref && ref.toLowerCase() !== account.toLowerCase()) {
      document.getElementById("refInput").value = ref;
    }
  } else {
    alert("Please install MetaMask or Bitget Wallet");
  }
}

function copyRefLink() {
  const refInput = document.getElementById("refLink");
  refInput.select();
  document.execCommand("copy");
  alert("Link copied!");
}

async function registerReferrer() {
  const ref = document.getElementById("refInput").value;
  if (!ref || ref.toLowerCase() === account.toLowerCase()) {
    document.getElementById("status").innerText = "❌ Invalid or self-referral";
    return;
  }
  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    document.getElementById("status").innerText = "✅ Referrer registered";
  } catch (e) {
    document.getElementById("status").innerText = "❌ Error: " + e.message;
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  if (!amount || amount <= 0) return alert("Enter USDT amount");

  const usdtAmount = web3.utils.toWei(amount, "mwei");
  try {
    const balance = await usdt.methods.balanceOf(account).call();
    if (Number(balance) < Number(usdtAmount)) {
      document.getElementById("status").innerText = "❌ Insufficient USDT";
      return;
    }

    document.getElementById("status").innerText = "⏳ Approving...";
    await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "⏳ Purchasing...";
    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "✅ Purchased and auto-staked!";
  } catch (e) {
    document.getElementById("status").innerText = "❌ Error: " + e.message;
  }
}

async function claimReferralReward() {
  try {
    await contract.methods.claimReferralReward().send({ from: account });
    document.getElementById("status").innerText = "✅ Referral reward claimed";
  } catch (e) {
    document.getElementById("status").innerText = "❌ Claim error: " + e.message;
  }
}