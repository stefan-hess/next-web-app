export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#fdf6ee]">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-3xl font-bold text-black">Privacy Policy</h1>
        <div className="text-gray-800 text-sm">
          <p className="mb-2 text-right text-xs text-gray-500">Last updated: September 24 2025</p>
          <p className="mb-4">
            At StockTickerNews (“we,” “our,” “us”), your privacy is important to us. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our newsletter service (the “Service”). 
            By using the Service, you agree to the terms of this Privacy Policy. 
            If you do not agree, please do not use the Service.
          </p>
          <ol className="list-decimal pl-4 space-y-4">
            <li>
              <strong>Information We Collect</strong><br />
              We may collect the following types of information:<br />
              <ul className="list-disc pl-6">
                <li><em>Personal Information</em>: name, email address, payment details</li>
                <li><em>Usage Data</em>: IP address, browser type, device information, and pages visited</li>
                <li><em>Cookies</em> and similar technologies for analytics and performance</li>
              </ul>
            </li>
            <li>
              <strong>How We Use Your Information</strong><br />
              We use your information to:<br />
              <ul className="list-disc pl-6">
                <li>Provide, operate, and maintain the Service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send newsletters, updates, and service-related communications</li>
                <li>Improve user experience and analyze engagement</li>
                <li>Comply with legal obligations</li>
              </ul>
            </li>
            <li>
              <strong>Sharing of Information</strong><br />
              We do not sell your personal information.<br />
              We may share information with:<br />
              <ul className="list-disc pl-6">
                <li>Trusted third-party service providers (e.g., payment processors, analytics providers)</li>
                <li>Authorities if required by law or to protect our rights</li>
              </ul>
            </li>
            <li>
              <strong>Data Retention</strong><br />
              We retain personal information only as long as necessary to fulfill the purposes outlined in this Policy, 
              unless a longer retention period is required by law.
            </li>
            <li>
              <strong>Data Security</strong><br />
              We implement reasonable technical and organizational measures to protect your personal information. 
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </li>
            <li>
              <strong>Your Rights</strong><br />
              Depending on your location, you may have the right to:<br />
              <ul className="list-disc pl-6">
                <li>Access, correct, or delete your personal information</li>
                <li>Withdraw consent to data processing</li>
                <li>Opt out of marketing communications at any time</li>
              </ul>
              To exercise these rights, please contact us at <a href="mailto:info@stocktickernews.com" className="text-indigo-600 underline">info@stocktickernews.com</a>.
            </li>
            <li>
              <strong>Cookies and Tracking</strong><br />
              We use cookies and similar technologies to improve the Service, measure performance, 
              and analyze user behavior. You can adjust your browser settings to refuse cookies, 
              but this may affect the functionality of the Service.
            </li>
            <li>
              <strong>Children’s Privacy</strong><br />
              The Service is not directed to children under 18. 
              We do not knowingly collect personal information from minors. 
              If we become aware that we have collected such data, we will delete it.
            </li>
            <li>
              <strong>International Users</strong><br />
              If you access the Service from outside Switzerland, please note that your information 
              may be transferred and stored in jurisdictions with different data protection laws.
            </li>
            <li>
              <strong>Changes to This Privacy Policy</strong><br />
              We may update this Policy from time to time. 
              If material changes occur, we will notify you by email or through the Service.
            </li>
            <li>
              <strong>Contact Us</strong><br />
              If you have questions about this Privacy Policy, please contact us at: 
              <a href="mailto:info@stocktickernews.com" className="text-indigo-600 underline"> info@stocktickernews.com</a>.
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}