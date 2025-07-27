let web3;
let contract;
let usdt;
let userAccount;

const contractAddress = "0xBaeF58FC0Eb20334b2fDEC4882e2AB972C1242DE";
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const targetChainId = 56; // BNB Smart Chain

async function connectWallet() {
  if (window.bitkeep && bitkeep.ethereum) {
    web3 = new Web3(bitkeep.ethereum);
    await bitkeep.ethereum.request({ method: "eth_requestAccounts" });
  } else if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
  } else {
    alert("กรุณาติดตั้ง MetaMask หรือ Bitget Wallet");
    return;
  }

  const chainId = await web3.eth.getChainId();
  if (chainId !== targetChainId) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: web3.utils.toHex(targetChainId) }]
      });
    } catch (e) {
      alert("กรุณาสลับเครือข่ายไปยัง BNB Chain");
      return;
    }
  }

  const accounts = await web3.eth.getAccounts();
  userAccount = accounts[0];
  contract = new web3.eth.Contract(contractABI, contractAddress);
  usdt = new web3.eth.Contract(erc20ABI, usdtAddress);

  document.getElementById("walletAddress").innerText = `✅ ${userAccount}`;
  document.getElementById("refSection").style.display = "block";

  const refLink = `${window.location.origin}${window.location.pathname}?ref=${userAccount}`;
  document.getElementById("refLink").value = refLink;
}

function copyRefLink() {
  const link = document.getElementById("refLink");
  link.select();
  document.execCommand("copy");
  alert("คัดลอกลิงก์เรียบร้อยแล้ว!");
}

async function registerReferrer() {
  const ref = document.getElementById("refInput").value.trim();
  if (!web3.utils.isAddress(ref) || ref.toLowerCase() === userAccount.toLowerCase()) {
    alert("กรุณาใส่ address ที่ถูกต้อง และไม่ใช่ address ของคุณเอง");
    return;
  }
  await contract.methods.registerReferrer(ref).send({ from: userAccount });
  alert("สมัคร Referrer สำเร็จ");
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    alert("กรุณาใส่จำนวน USDT ที่ถูกต้อง");
    return;
  }

  const usdtAmount = web3.utils.toWei(amount, "mwei"); // USDT บน BNB ใช้ 6 decimals
  const allowance = await usdt.methods.allowance(userAccount, contractAddress).call();

  if (BigInt(allowance) < BigInt(usdtAmount)) {
    await usdt.methods.approve(contractAddress, usdtAmount).send({ from: userAccount });
  }

  await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: userAccount });
  alert("ซื้อสำเร็จ และ stake อัตโนมัติเรียบร้อย");
}
