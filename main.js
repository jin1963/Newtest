let web3;
let userAccount;
let contract;
let usdt;

const contractAddress = "0xBaeF58FC0Eb20334b2fDEC4882e2AB972C1242DE"; // Smart contract KJC
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT (BEP20)
const targetChainId = "0x38"; // BNB Chain = 56

function getProvider() {
  if (window.bitkeep && window.bitkeep.ethereum) return window.bitkeep.ethereum;
  if (window.ethereum) return window.ethereum;
  return null;
}

async function switchToBSC(provider) {
  const currentChainId = await provider.request({ method: "eth_chainId" });
  if (currentChainId !== targetChainId) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }]
      });
    } catch (err) {
      alert("⚠️ กรุณาเพิ่ม BNB Chain (Chain ID 56) ใน Wallet ของคุณ");
      throw err;
    }
  }
}

async function connectWallet() {
  const provider = getProvider();
  if (!provider) return alert("⚠️ ไม่พบ Wallet เช่น MetaMask หรือ Bitget");

  web3 = new Web3(provider);

  try {
    await switchToBSC(provider);
    await provider.request({ method: "eth_requestAccounts" });

    const accounts = await web3.eth.getAccounts();
    userAccount = accounts[0];
    document.getElementById("walletAddress").innerText = "✅ " + userAccount;

    contract = new web3.eth.Contract(contractABI, contractAddress);
    usdt = new web3.eth.Contract(usdtABI, usdtAddress);

    let ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) ref = localStorage.getItem("ref");
    if (!ref || ref.toLowerCase() === userAccount.toLowerCase()) {
      ref = userAccount;
    }
    localStorage.setItem("ref", ref);

    const link = window.location.origin + window.location.pathname + "?ref=" + userAccount;
    document.getElementById("referralLink").value = link;

  } catch (err) {
    document.getElementById("walletAddress").innerText = "❌ เชื่อมต่อล้มเหลว";
    console.error(err);
  }
}

async function registerReferrer() {
  const refAddress = document.getElementById("refAddress").value;
  if (!refAddress) return alert("⚠️ กรุณาใส่ Referrer Address");

  try {
    await contract.methods.registerReferrer(refAddress).send({ from: userAccount });
    alert("✅ สมัคร Referrer สำเร็จ");
  } catch (err) {
    alert("❌ สมัครไม่สำเร็จ");
    console.error(err);
  }
}

async function buyToken() {
  const provider = getProvider();
  await switchToBSC(provider);

  const amount = document.getElementById("usdtAmount").value;
  if (!amount || isNaN(amount)) {
    alert("⚠️ กรุณาใส่จำนวน USDT ที่ถูกต้อง");
    return;
  }

  const value = web3.utils.toWei(amount, "ether");

  try {
    await usdt.methods.approve(contractAddress, value).send({ from: userAccount });
    await contract.methods.buyWithReferralAndStake(value).send({ from: userAccount });
    alert("✅ ซื้อสำเร็จ และ Stake อัตโนมัติแล้ว");
  } catch (err) {
    alert("❌ เกิดข้อผิดพลาดในการซื้อ");
    console.error(err);
  }
}

function copyReferralLink() {
  const ref = document.getElementById("referralLink").value;
  if (ref) {
    navigator.clipboard.writeText(ref);
    alert("คัดลอกลิงก์แล้ว!");
  } else {
    alert("ยังไม่มีลิงก์ Referrer");
  }
}
