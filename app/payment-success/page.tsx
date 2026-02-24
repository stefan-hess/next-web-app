import Footer from "components/sections/Footer";
import Header from "components/sections/Header";

export default function PaymentSuccess() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fdf6ee]">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="relative rounded-2xl bg-white border border-border shadow-card max-w-md w-full text-center p-10 space-y-6 overflow-hidden">
          {/* Decorative bee in background */}
          <Image
            src="/assets/icon/icon_v1.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-8 -right-8 w-52 h-52 opacity-10"
            style={{ transform: 'rotate(20deg)' }}
            width={208}
            height={208}
            priority
          />
          {/* Checkmark icon */}
          <div className="flex items-center justify-center mx-auto w-16 h-16 rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Payment Successful</h1>
            <p className="text-muted-foreground text-base">
              Thank you and welcome to the hive! Your subscription is now active.
            </p>
          </div>
          <a
            href="/login"
            className="inline-block w-full rounded-lg border-2 font-bold py-3 px-8 text-base shadow transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            style={{ borderColor: '#bfa76a', color: '#bfa76a', background: 'transparent' }}
          >
            Get Started
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
