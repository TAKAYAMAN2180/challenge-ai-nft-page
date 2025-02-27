"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Textarea} from "@/components/ui/textarea"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Plus} from "lucide-react"
import {toast} from "@/components/ui/use-toast"
import {Toaster} from "@/components/ui/toaster"
import {ethers} from "ethers"
import QnAERC721 from "@/abi/QnAERC721.json";
import axios from "axios"; // ビルド済みのABIを読み込む想定

// コントラクトをデプロイしたアドレス
const CONTRACT_ADDRESS = "0x481FA34Fc38b68d0d7d165E331C7C995b72e9aEE"; // 置き換え


export default function QuestionsAndAnswers() {
    // 新しい質問の状態
    const [newQuestion, setNewQuestion] = useState("")
    const [status, setStatus] = useState("");
    const [answer, setAnswer] = useState("");
    const [txAddress, setTxAddress] = useState("");

    // 新しい質問を追加する関数
    const addQuestion = async () => {
        if (newQuestion.trim() === "") return
        let tokenId = "";
        try {
            // ユーザーのウォレット(例: MetaMask)があるか確認
            if (!window.ethereum) {
                alert("ウォレットが見つかりません。MetaMaskなどをインストールしてください。");
                return;
            }

            // プロバイダーとサインナーを作成
            const provider = new ethers.BrowserProvider(window.ethereum);

            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(11155111)) {
                // ネットワークの自動切り替え
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{chainId: "0xaa36a7"}], // 0xaa36a7(hex) = 11155111(dec)
                });

                return;
            }

            // 接続要求(ユーザーがウォレットで承認するUIが出ます)
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            // コントラクトインスタンスを生成
            const contract = new ethers.Contract(CONTRACT_ADDRESS, QnAERC721, signer);

            setStatus("Sending transaction...");

            // askQuestion の呼び出し(トランザクション送信)
            const tx = await contract.askQuestion(newQuestion);
            // マイニング完了待ち
            const receipt = await tx.wait();
            console.log("Transaction confirmed! 🎉")
            console.log(JSON.stringify(receipt));

            setStatus("Transaction confirmed! 🎉");

            tokenId = await getTokenIdFromReceipt(receipt);
            setTxAddress(receipt.hash)
            console.log("Token ID:", tokenId);
            setNewQuestion("");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.message ?? "Something went wrong"}`);
        }

        // API Routeに質問を送信
        const result = await axios.get("/api/lambda", {params: {tokenId: tokenId}});
        setAnswer(result.data.message);
        setNewQuestion("")
        toast({
            title: "質問が追加されました",
            description: "あなたの質問が正常に投稿されました。",
        })
    }

    return (
        <div className="space-y-8">
            {/* 新しい質問を追加するフォーム */}
            <Card>
                <CardHeader>
                    <CardTitle>新しい質問を投稿</CardTitle>
                    <CardDescription>あなたの質問を入力してください</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="ここに質問を入力..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
                <CardFooter>
                    <Button onClick={addQuestion} className="ml-auto">
                        <Plus className="mr-2 h-4 w-4"/> 質問を投稿
                    </Button>
                    {status && <p style={{marginTop: 16}} className={"text-red-600"}>{status}</p>}
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>実行結果</CardTitle>
                    <CardDescription>生成AIによる出力結果</CardDescription>
                </CardHeader>
                <CardContent>
                    {!answer ? <p>質問を投稿してください</p> : <>
                        <h3>生成された結果</h3>
                        <p>{answer}</p>
                        <h3>トランザクションの結果</h3>
                        <p className={"text-blue-700 hover:underline"}><a
                            href={"https://sepolia.etherscan.io/tx/" + txAddress}>{"https://sepolia.etherscan.io/tx/" + txAddress}</a>
                        </p></>
                    }
                </CardContent>
            </Card>
            <Toaster/>
        </div>
    )
}

async function getTokenIdFromReceipt(receipt: ethers.TransactionReceipt) {
    // Transferイベントのシグネチャ
    const transferTopic = ethers.id("Transfer(address,address,uint256)");

    for (const log of receipt.logs) {
        // イベントシグネチャが Transfer かどうか
        if (log.topics[0] === transferTopic) {
            // tokenId は 4番目のトピック
            const tokenIdHex = log.topics[3];
            // BigIntに変換する（または ethers でBigNumberにする）
            const tokenId = BigInt(tokenIdHex).toString(); // 10進数文字列に変換
            console.log("Minted token ID:", tokenId);
            return tokenId;
        }
    }

    throw new Error("Transfer event not found in receipt");
}