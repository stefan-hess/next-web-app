export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-3xl font-bold text-indigo-800">Terms &amp; Conditions</h1>
        <div className="text-gray-800 text-sm">
          <p className="mb-2 text-right text-xs text-gray-500">Last updated: September 4 2025</p>
          <p className="mb-4">Welcome to StockTickerNews (“we,” “our,” “us”). These Terms and Conditions (“Terms”) govern your use of our stock ticker newsletter service (the “Service”). By subscribing to or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.</p>
          <ol className="list-decimal pl-4 space-y-4">
            <li>
              <strong>Service Description</strong><br />
              The Service provides subscribers with curated summaries and insights on stock market events, news, and trends. The Service is provided for informational and educational purposes only and does not constitute financial, investment, or trading advice.
            </li>
            <li>
              <strong>Eligibility</strong><br />
              You must be at least 18 years old to subscribe.<br />
              By subscribing, you represent that you have the legal capacity to enter into these Terms.
            </li>
            <li>
              <strong>Subscription and Payment</strong><br />
              The Service is offered on a subscription basis (monthly or annually).<br />
              By subscribing, you authorize us (and our payment processor, Stripe or equivalent) to charge your selected payment method.<br />
              Subscriptions automatically renew unless canceled before the renewal date.<br />
              Prices are subject to change; you will be notified in advance of any changes.
            </li>
            <li>
              <strong>Refund Policy</strong><br />
              Unless otherwise required by law, subscription fees are non-refundable.<br />
              You may cancel your subscription at any time, but you will continue to have access to the Service until the end of the billing period.
            </li>
            <li>
              <strong>No Financial Advice</strong><br />
              The information provided in the Service is general market commentary.<br />
              We are not licensed financial advisors, and the Service does not constitute:<br />
              <ul className="list-disc pl-6">
                <li>Personalized investment advice</li>
                <li>Recommendations to buy, sell, or hold any security</li>
              </ul>
              You are solely responsible for any investment decisions you make. Always conduct your own research or consult a licensed professional before making financial decisions.
            </li>
            <li>
              <strong>User Responsibilities</strong><br />
              You agree not to share, resell, or distribute newsletter content without prior written consent.<br />
              You agree to use the Service only for lawful purposes.<br />
              Any misuse may result in suspension or termination of your account.
            </li>
            <li>
              <strong>Intellectual Property</strong><br />
              All content provided through the Service (text, graphics, branding) is owned by or licensed to us.<br />
              You are granted a limited, non-transferable license to use the Service for personal purposes only.
            </li>
            <li>
              <strong>Limitation of Liability</strong><br />
              To the maximum extent permitted by law, we are not liable for:<br />
              <ul className="list-disc pl-6">
                <li>Losses incurred from reliance on the Service</li>
                <li>Trading or investment losses</li>
                <li>Service interruptions, errors, or data inaccuracies</li>
              </ul>
              The Service is provided on an “as-is” and “as-available” basis.
            </li>
            <li>
              <strong>Privacy</strong><br />
              We collect and process your personal data in accordance with our <a href="/privacy" className="text-indigo-600 underline">Privacy Policy</a>.<br />
              By using the Service, you consent to such collection and processing.
            </li>
            <li>
              <strong>Termination</strong><br />
              You may terminate your subscription at any time via your account settings.<br />
              We reserve the right to suspend or terminate accounts for violations of these Terms.
            </li>
            <li>
              <strong>Changes to These Terms</strong><br />
              We may update these Terms from time to time.<br />
              If material changes occur, we will notify you by email or through the Service.
            </li>
            <li>
              <strong>Governing Law</strong><br />
              These Terms shall be governed by and construed in accordance with the laws of [Insert Jurisdiction], without regard to its conflict of laws principles.
            </li>
            <li>
              <strong>Contact Us</strong><br />
              If you have questions about these Terms, please contact us at:<br />
              StockTickerNews<br />
              [Your Contact Email]
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}
