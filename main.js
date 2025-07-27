let userAccount;
let contract;
let usdt;

const targetChainId = "0x38"; // BNB Chain Mainnet (56)

function getProvider() {
  if (window.bitkeep && window.bitkeep.ethereum) {
    return window.bitkeep.ethereum;
  } else if (window.ethereum) {
    return window.ethereum;
  } else {
    return null;
  }
}

async function switchToBSC(provider) {
  try {
    const currentChainId = await provider.request({ method: 'eth_chainId' });
    if (currentChainId !== targetChainId) {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    }
  } catch (err) {
    alert("⚠️ กรุณาเพิ่ม BNB Chain ลงใน Wallet ของคุณก่อนใช้งาน");
    throw err;
  }
}

async function connectWallet() {
  const provider = getProvider();
  if (!provider) {
    alert("⚠️ ไม่พบ Wallet เช่น MetaMask หรือ Bitget");
    return;
  }

  window.web3 = new Web3(provider);
  try {
    await switchToBSC(provider);
    await provider.request({ method: "eth_requestAccounts" });

    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      document.getElementById("walletAddress").innerText = "❌ ไม่พบบัญชีผู้ใช้";
      return;
    }

    userAccount = accounts[0];
    document.getElementById("walletAddress").innerText = "✅ " + userAccount;

    contract = new web3.eth.Contract(contractABI, contractAddress);
    usdt = new web3.eth.Contract(usdtABI, usdtAddress);

    let ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) ref = localStorage.getItem("ref");
    if (!ref) ref = userAccount;
    localStorage.setItem("ref", ref);

    const link = window.location.origin + window.location.pathname + "?ref=" + userAccount;
    document.getElementById("referralLink").value = link;

  } catch (e) {
    document.getElementById("walletAddress").innerText = "❌ เชื่อมต่อล้มเหลว";
  }
}

async function registerReferrer() {
  const refAddress = document.getElementById("refAddress").value;
  try {
    await contract.methods.registerReferrer(refAddress).send({ from: userAccount });
    alert("✅ สมัคร Referrer สำเร็จ");
  } catch (e) {
    alert("❌ สมัครไม่สำเร็จ");
  }
}

async function buyToken() {
  const provider = getProvider();
  await switchToBSC(provider);

  const amount = document.getElementById("usdtAmount").value;
  if (!amount || isNaN(amount)) {
    alert("กรุณาใส่จำนวน USDT ที่ถูกต้อง");
    return;
  }

  const value = web3.utils.toWei(amount, "ether");

  try {
    await usdt.methods.approve(contractAddress, value).send({ from: userAccount });
    await contract.methods.buyWithReferral(value).send({ from: userAccount });
    alert("✅ ซื้อสำเร็จ");
  } catch (e) {
    alert("❌ เกิดข้อผิดพลาดในการซื้อ");
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
