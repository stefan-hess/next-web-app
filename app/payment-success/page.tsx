export default function PaymentSuccess() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="rounded-xl bg-white p-8 shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
        <p className="mb-6 text-gray-700">
          Your premium plan is now active. Click below to get started!
        </p>
        <a
          href="/login"
          className="inline-block rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-2xl active:scale-95"
        >
          Go to Log In
        </a>
      </div>
    </main>
  );
}
