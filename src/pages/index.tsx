import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <>
      <Head>
        <title>Habits</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="hero min-h-screen bg-base-200">
        <div className="container hero-content flex flex-col items-center justify-center gap-12 px-4 py-16 text-center ">
          <h1 className="text-5xl font-extrabold tracking-tight text-base-content sm:text-[5rem]">
            Habits
          </h1>
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (sessionData) {
      void router.push("/my_habits");
    }
  }, [sessionData, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-base-content">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-base-300 px-10 py-3 font-semibold text-base-content no-underline transition hover:bg-base-100"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
