let userAccount;
let contract;
let usdt;

async function connectWallet() {
  if (window.ethereum || window.bitkeep?.ethereum) {
    const provider = window.ethereum || window.bitkeep.ethereum;
    window.web3 = new Web3(provider);
    try {
      await provider.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      userAccount = accounts[0];
      document.getElementById("walletAddress").innerText = "✅ " + userAccount;

      contract = new web3.eth.Contract(contractABI, contractAddress);
      usdt = new web3.eth.Contract(usdtABI, usdtAddress);

      let ref = new URLSearchParams(window.location.search).get("ref");
      if (!ref) ref = localStorage.getItem("ref");
      if (!ref || ref.toLowerCase() === userAccount.toLowerCase()) {
        ref = "0x0000000000000000000000000000000000000000";
      }
      localStorage.setItem("ref", ref);

      const link = `${window.location.origin}${window.location.pathname}?ref=${userAccount}`;
      document.getElementById("referralLink").value = link;

    } catch (e) {
      console.error(e);
      document.getElementById("walletAddress").innerText = "❌ เชื่อมต่อล้มเหลว";
    }
  } else {
    alert("⚠️ ไม่พบ Wallet เช่น MetaMask หรือ Bitget");
  }
}

async function registerReferrer() {
  const refAddress = document.getElementById("refAddress").value.trim();
  if (!web3.utils.isAddress(refAddress)) {
    alert("⚠️ Referrer address ไม่ถูกต้อง");
    return;
  }
  if (refAddress.toLowerCase() === userAccount.toLowerCase()) {
    alert("❌ ห้ามสมัครตัวเองเป็น Referrer");
    return;
  }
  try {
    await contract.methods.registerReferrer(refAddress).send({ from: userAccount });
    alert("✅ สมัคร Referrer สำเร็จ");
  } catch (e) {
    console.error(e);
    alert("❌ สมัครไม่สำเร็จ");
  }
}

async function buyToken() {
  const amount = document.getElementById("usdtAmount").value.trim();
  if (!amount || isNaN(amount) || Number(amount) < 10) {
    alert("❗กรุณาใส่จำนวน USDT อย่างน้อย 10");
    return;
  }

  const value = web3.utils.toWei(amount, "ether");

  try {
    // อนุมัติ USDT ก่อน
    await usdt.methods.approve(contractAddress, value).send({ from: userAccount });

    const ref = localStorage.getItem("ref") || "0x0000000000000000000000000000000000000000";

    await contract.methods.buyWithReferralAndStake(value, ref).send({ from: userAccount });
    alert("✅ ซื้อและ Stake สำเร็จแล้ว");
  } catch (e) {
    console.error(e);
    alert("❌ เกิดข้อผิดพลาดในการซื้อและ Stake");
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
