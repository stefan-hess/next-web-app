export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#fdf6ee]">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-3xl font-bold text-black">Terms &amp; Conditions</h1>
        <div className="text-gray-800 text-sm">
          <p className="mb-2 text-right text-xs text-gray-500">Last updated: February 19, 2026</p>
          
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="font-bold text-red-600 mb-2">IMPORTANT DISCLAIMER - READ CAREFULLY</p>
            <p className="text-xs leading-relaxed">
              <strong>NOT INVESTMENT ADVICE:</strong> All information provided on StockTickerNews is for informational and educational purposes only. We are NOT registered investment advisers, broker-dealers, or financial planners. Nothing on this platform constitutes a recommendation to buy, sell, or hold any security. Past performance does not guarantee future results. All investments carry risk, including the potential loss of principal. You should consult with a licensed financial professional before making any investment decisions.
            </p>
          </div>
          
          <p className="mb-4">Welcome to StockTickerNews ("we," "our," "us"). These Terms and Conditions ("Terms") govern your use of our financial data platform and stock information service (the "Service"). By subscribing to or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.</p>
          
          <ol className="list-decimal pl-4 space-y-4">
            <li>
              <strong>Service Description</strong><br />
              The Service provides subscribers with access to financial data, market information, company fundamentals, news summaries, and analytical tools related to publicly traded securities. The Service aggregates publicly available information from third-party sources including but not limited to SEC filings, market data providers (AlphaVantage), and news outlets. The Service is provided for informational and educational purposes only.
              
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-bold text-red-700 mb-1">CRITICAL DISCLAIMERS:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Not Financial Advice:</strong> StockTickerNews does NOT provide personalized investment advice, recommendations, or financial planning services.</li>
                  <li><strong>Not a Broker-Dealer:</strong> We are NOT a securities broker-dealer, investment adviser, registered investment advisor (RIA), or any other type of financial professional regulated by the SEC, FINRA, or any other regulatory body.</li>
                  <li><strong>No Solicitation:</strong> Nothing on this platform constitutes an offer, solicitation of an offer, or advice to buy, sell, or hold any security, investment product, or financial instrument.</li>
                  <li><strong>No Research or Analysis:</strong> We do not produce proprietary investment research or security analysis. All data is sourced from third-party providers.</li>
                  <li><strong>Data Accuracy:</strong> While we strive for accuracy, we make NO WARRANTIES regarding the completeness, accuracy, reliability, or timeliness of any data provided.</li>
                  <li><strong>No Endorsement:</strong> Displaying information about a security does NOT constitute an endorsement or recommendation by StockTickerNews.</li>
                </ul>
              </div>
              
              <p className="mt-2 text-xs italic">By using StockTickerNews, you acknowledge that you are using a data aggregation and information tool only, and that all investment decisions are made at your sole discretion and risk.</p>
            </li>
            
            <li>
              <strong>Eligibility</strong><br />
              You must be at least 18 years old to subscribe. By subscribing, you represent that you have the legal capacity to enter into these Terms.
            </li>
            
            <li>
              <strong>Subscription and Payment</strong><br />
              We offer multiple subscription tiers with varying features and pricing. Subscription fees are billed in advance on a monthly or annual basis depending on your selection. Unless otherwise required by law, subscription fees are non-refundable. You may cancel your subscription at any time, but you will continue to have access to the Service until the end of the billing period.
            </li>
            
            <li>
              <strong>No Financial Advice - Extended Disclaimer</strong><br />
              <div className="space-y-2">
                <p><strong>General Information Only:</strong> All content, data, charts, metrics, and information provided through the Service constitutes general market commentary and educational material only. It is NOT tailored to your individual financial situation, investment objectives, risk tolerance, or financial needs.</p>
                
                <p><strong>The Service Does NOT:</strong></p>
                <ul className="list-disc pl-6 text-xs space-y-1">
                  <li>Provide personalized investment advice or recommendations</li>
                  <li>Suggest specific buy, sell, or hold actions for any security</li>
                  <li>Offer tax, legal, or accounting advice</li>
                  <li>Make predictions about future market movements or security prices</li>
                  <li>Guarantee investment returns or performance</li>
                  <li>Analyze your personal financial situation or portfolio</li>
                </ul>
                
                <p className="mt-2"><strong>Your Responsibility:</strong> You are solely and exclusively responsible for:</p>
                <ul className="list-disc pl-6 text-xs space-y-1">
                  <li>Conducting your own due diligence and research</li>
                  <li>Evaluating the suitability of any investment for your circumstances</li>
                  <li>Making all investment decisions independently</li>
                  <li>Understanding the risks associated with investing in securities</li>
                  <li>Consulting with qualified financial, tax, and legal professionals before making investment decisions</li>
                </ul>
                
                <p className="mt-2 font-bold text-red-700">⚠️ RISK WARNING: Investing in securities involves substantial risk of loss. You may lose some or all of your invested capital. Past performance does NOT indicate future results.</p>
              </div>
            </li>
            
            <li>
              <strong>User Responsibilities &amp; Acknowledgments</strong><br />
              By using the Service, you explicitly agree and acknowledge that:<br />
              <ul className="list-disc pl-6 text-xs space-y-1 mt-2">
                <li>You are using the Service at your own risk and for informational purposes only</li>
                <li>You will NOT rely solely on information from the Service for making investment decisions</li>
                <li>You understand that all investments carry risk, including the risk of total loss of capital</li>
                <li>You will conduct independent research and due diligence before making any investment</li>
                <li>You will consult with qualified professionals (financial advisors, tax advisors, attorneys) as appropriate</li>
                <li>You will NOT share, resell, redistribute, or commercially exploit Service content without prior written consent</li>
                <li>You will use the Service only for lawful purposes and in compliance with all applicable laws and regulations</li>
                <li>You will NOT attempt to manipulate, hack, or circumvent any Service security measures</li>
                <li>Any misuse may result in immediate suspension or termination of your account without refund</li>
              </ul>
              <p className="mt-2 font-bold text-red-700">You further acknowledge that StockTickerNews has provided clear and conspicuous disclaimers regarding the nature of the Service and the absence of personalized investment advice.</p>
            </li>
            
            <li>
              <strong>Limitation of Liability &amp; Disclaimer of Warranties</strong><br />
              <div className="space-y-2">
                <p className="font-bold">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
                
                <p><strong>NO WARRANTIES:</strong> The Service is provided on an "AS-IS" and "AS-AVAILABLE" basis without any warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to:</p>
                <ul className="list-disc pl-6 text-xs space-y-1">
                  <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                  <li>Warranties regarding accuracy, completeness, timeliness, or reliability of data</li>
                  <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                  <li>Warranties regarding third-party data sources</li>
                </ul>
                
                <p className="mt-2"><strong>LIMITATION OF LIABILITY:</strong> We, our officers, directors, employees, agents, suppliers, and licensors SHALL NOT BE LIABLE for:</p>
                <ul className="list-disc pl-6 text-xs space-y-1">
                  <li><strong>Investment Losses:</strong> Any losses, damages, or expenses arising from your investment or trading decisions, whether or not based on information from the Service</li>
                  <li><strong>Data Errors:</strong> Any inaccuracies, errors, omissions, delays, or interruptions in data provided through the Service</li>
                  <li><strong>Third-Party Sources:</strong> Any issues arising from data obtained from third-party providers (AlphaVantage, SEC, etc.)</li>
                  <li><strong>Technical Issues:</strong> Service interruptions, bugs, system failures, data breaches, or cybersecurity incidents</li>
                  <li><strong>Indirect Damages:</strong> Any indirect, incidental, special, consequential, or punitive damages, including lost profits, lost data, or loss of goodwill</li>
                  <li><strong>Reliance on Information:</strong> Any damages resulting from your reliance on information provided through the Service</li>
                </ul>
                
                <p className="mt-2"><strong>MAXIMUM LIABILITY CAP:</strong> In no event shall our total aggregate liability to you for all damages, losses, and causes of action exceed the amount paid by you to us for the Service in the twelve (12) months preceding the claim, or $100 USD, whichever is less.</p>
                
                <p className="mt-2 text-xs italic">Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability for incidental or consequential damages. In such jurisdictions, our liability will be limited to the greatest extent permitted by law.</p>
              </div>
            </li>
            
            <li>
              <strong>Indemnification</strong><br />
              You agree to indemnify, defend, and hold harmless StockTickerNews, its officers, directors, employees, agents, licensors, and suppliers from and against any and all claims, liabilities, damages, losses, costs, expenses (including reasonable attorneys' fees) arising from or related to:
              <ul className="list-disc pl-6 text-xs space-y-1 mt-2">
                <li>Your use or misuse of the Service</li>
                <li>Your investment decisions or trading activities</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </li>
            
            <li>
              <strong>Data Sources &amp; Third-Party Content</strong><br />
              The Service aggregates data from third-party sources including but not limited to AlphaVantage, SEC EDGAR database, and various news providers. We do NOT control, verify, or guarantee the accuracy of third-party data. You acknowledge that:
              <ul className="list-disc pl-6 text-xs space-y-1 mt-2">
                <li>Third-party data may contain errors, delays, or omissions</li>
                <li>We are not responsible for the performance or availability of third-party services</li>
                <li>Links to third-party websites are provided for convenience only and do NOT constitute endorsement</li>
              </ul>
            </li>
            
            <li>
              <strong>Intellectual Property</strong><br />
              All content on the platform, including but not limited to text, graphics, logos, data compilations, and software, is the property of StockTickerNews or its content suppliers and is protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-transferable license to use the Service for personal purposes only.
            </li>
            
            <li>
              <strong>Privacy</strong><br />
              We collect and process your personal data in accordance with our <a href="/privacy" className="text-indigo-600 underline">Privacy Policy</a>. By using the Service, you consent to such collection and processing.
            </li>
            
            <li>
              <strong>Termination</strong><br />
              You may terminate your subscription at any time via your account settings. We reserve the right to suspend or terminate accounts for violations of these Terms.
            </li>
            
            <li>
              <strong>Changes to These Terms</strong><br />
              We may update these Terms from time to time. If material changes occur, we will notify you by email or through the Service. Your continued use of the Service after such notification constitutes acceptance of the updated Terms.
            </li>
            
            <li>
              <strong>Governing Law &amp; Dispute Resolution</strong><br />
              These Terms shall be governed by and construed in accordance with the laws of Switzerland, without regard to its conflict of laws principles. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in Switzerland, except where prohibited by law.
            </li>
            
            <li>
              <strong>Contact Us</strong><br />
              If you have questions about these Terms, please contact us at: info@stock-ticker-news.com
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}
