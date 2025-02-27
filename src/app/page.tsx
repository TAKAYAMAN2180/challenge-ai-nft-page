import QuestionsAndAnswers from "@/components/questions-and-answers"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-2">Q&A NFTプラットフォーム</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          質問を投稿し、回答を得て、あなたの質問をNFTとして保存しましょう
        </p>
        <QuestionsAndAnswers />
      </div>
    </main>
  )
}

