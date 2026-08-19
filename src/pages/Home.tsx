import { Chat } from "./Chat";

export default function ChatHomePage() {

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      <main className="flex flex-1 flex-col bg-background">
         <Chat />
      </main>
    </div>
  );
}