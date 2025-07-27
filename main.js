async function connectWallet() {
  if (window.ethereum) {
    try {
      window.web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      userAccount = accounts[0];

      // อัปเดตข้อความบนหน้าเว็บ
      document.getElementById("walletAddress").innerText = `✅ ${userAccount}`;
      document.getElementById("walletStatus").innerHTML = "✅ Wallet connected";
      document.getElementById("walletStatus").style.color = "lime";

      // ตรวจสอบ Chain ให้ตรงกับ BNB Chain
      const currentChainId = await web3.eth.getChainId();
      if (currentChainId !== 56) {
        alert("กรุณาสลับไปยัง BNB Smart Chain (ChainId: 56)");
        await switchToBSC();
      }

      // สร้าง instance ของสัญญา
      contract = new web3.eth.Contract(contractABI, contractAddress);
      usdt = new web3.eth.Contract(usdtABI, usdtAddress);

    } catch (err) {
      console.error("Wallet connect error:", err);
      document.getElementById("walletStatus").innerHTML = "❌ Connect failed";
      document.getElementById("walletStatus").style.color = "red";
    }
  } else {
    alert("กรุณาติดตั้ง MetaMask หรือ Bitget Wallet ก่อน");
  }
}

// ฟังก์ชันสลับไป BNB Smart Chain
async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }], // 0x38 = 56
    });
  } catch (switchError) {
    console.error("Switch network error:", switchError);
  }
}
