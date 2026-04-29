import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Chat</h1>
        <p className="mt-1 text-zinc-400">
          Streamed responses with server-side tool execution.
        </p>
      </div>

      <ChatInterface />
    </main>
  );
}
