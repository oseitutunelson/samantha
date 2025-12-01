import React from 'react';
import Button from './Button';

const Whitepaper = ({ onBack }) => {
  return (
    <section className="min-h-screen w-screen bg-black text-white py-20 px-6 md:px-20 font-general">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold font-VeniteAdoremus-regular text-violet-300">
            Samantha Whitepaper v1.0
          </h1>
          <Button onClick={onBack} className="text-sm">
            Back to Home
          </Button>
        </div>

        <div className="space-y-8 text-lg leading-relaxed">
          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">1. Introduction</h2>
            <p>
              Sports betting is a multi-billion–dollar global industry, yet existing platforms suffer from major flaws:
            </p>
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>Centralized control over odds</li>
              <li>Non-transparent match results and settlement</li>
              <li>Payout manipulation</li>
              <li>Slow withdrawals</li>
              <li>Lack of user ownership and verifiable fairness</li>
            </ul>
            <p className="mt-4">
              Samantha is a decentralized prediction and sports betting protocol that solves these problems using on-chain smart contracts, Chainlink Functions, Chainlink Automation, and stablecoin-based (USDT) betting.
            </p>
            <p>
              Samantha aims to bring provable fairness, trustlessness, and instant automated payouts to sports betting. The platform focuses initially on the English Premier League (EPL), with the architecture supporting future expansion to additional sports and markets.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">2. Vision & Mission</h2>
            <h3 className="text-2xl font-semibold text-violet-100 mb-2">Vision</h3>
            <p>
              To become the world’s most trusted, permissionless, and transparent platform for sports betting by eliminating intermediaries and ensuring verifiable match outcomes.
            </p>
            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">Mission</h3>
            <ul className="list-disc list-inside ml-6">
              <li>Allow users to place bets using USDT, ensuring price stability</li>
              <li>Automate match data fetching through Chainlink Functions</li>
              <li>Remove centralized control through immutable smart contracts</li>
              <li>Deliver instant, trustless payouts to winners</li>
              <li>Provide an intuitive GSAP-animated UI/UX that simplifies blockchain betting</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">3. Problem Statement</h2>
            <p>
              Traditional betting platforms are deeply flawed:
            </p>
            <h3 className="text-xl font-semibold text-violet-100 mb-2">Lack of Transparency</h3>
            <p>Odds and payouts are controlled behind closed doors with no verifiable fairness.</p>
            <h3 className="text-xl font-semibold text-violet-100 mb-2">Slow & Manipulated Payouts</h3>
            <p>Users often face withdrawal limits, delays, or unjustified voiding of bets.</p>
            <h3 className="text-xl font-semibold text-violet-100 mb-2">Centralized Risk & Custody</h3>
            <p>Platforms hold user funds — increasing failure, insolvency, and hacking risks.</p>
            <h3 className="text-xl font-semibold text-violet-100 mb-2">Data Trust Issues</h3>
            <p>Match results come from centralized servers that can be compromised.</p>
            <p className="mt-4">
              Samantha eliminates these risks through decentralized execution, stablecoin betting, and oracle-secured match results.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">4. Solution Overview</h2>
            <p>
              Samantha introduces a fully automated on-chain betting system.
            </p>
            <h3 className="text-2xl font-semibold text-violet-100 mb-2">Key Features</h3>
            <ul className="list-disc list-inside ml-6">
              <li>USDT Betting: Stablecoin ensures predictable value and easy adoption.</li>
              <li>On-chain Match Listings: Updated daily using Chainlink Functions.</li>
              <li>Automated Result Resolution: Chainlink fetches official match results.</li>
              <li>Provable Odds: Odds are generated and stored immutably per match.</li>
              <li>Instant Payouts: Smart contract executes payouts based on results.</li>
              <li>No Human Control: Owner can trigger match fetching but cannot alter results.</li>
              <li>Secure Secrets Management: API keys stored via encrypted IPFS.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">5. System Architecture</h2>
            <h3 className="text-2xl font-semibold text-violet-100 mb-2">5.1 High-Level Architecture</h3>
            <p>User Wallet → Smart Contract → Chainlink Functions → Football API</p>
            <p className="ml-6">↓</p>
            <p className="ml-6">Chainlink Automation</p>
            <p className="ml-6">↓</p>
            <p className="ml-6">Match Settlement + Payouts</p>

            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">5.2 Smart Contract Layer</h3>
            <p>The BettingContract handles:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Match storage</li>
              <li>Odds storage</li>
              <li>Bet placements (in USDT)</li>
              <li>Result verification</li>
              <li>Payout distribution</li>
              <li>Rate limiting for match requests</li>
            </ul>
            <p>The contract relies on:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Chainlink Functions for data fetching</li>
              <li>Chainlink Automation for triggering periodic updates</li>
            </ul>

            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">5.3 Oracle Layer: Chainlink Functions</h3>
            <p>Chainlink Functions is used to fetch two types of data:</p>
            <h4 className="text-xl font-semibold text-violet-50 mb-1">Today's Matches Source</h4>
            <p>Fetches scheduled matches from the EPL API + generates odds.</p>
            <h4 className="text-xl font-semibold text-violet-50 mb-1">Match Results Source</h4>
            <p>Fetches final score and encodes result as:</p>
            <ul className="list-disc list-inside ml-6">
              <li>1 = Home Win</li>
              <li>2 = Draw</li>
              <li>3 = Away Win</li>
            </ul>

            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">5.4 Secrets Management</h3>
            <ul className="list-disc list-inside ml-6">
              <li>Stored on IPFS as encrypted payload</li>
              <li>Decrypted only inside Chainlink DON (secure execution environment)</li>
              <li>Smart contract only stores the CID reference</li>
            </ul>
            <p>This ensures zero exposure of API keys.</p>

            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">5.5 Frontend Layer</h3>
            <p>Built with:</p>
            <ul className="list-disc list-inside ml-6">
              <li>React + Wagmi</li>
              <li>RainbowKit for wallet connection</li>
              <li>GSAP animations</li>
              <li>ethers.js v6</li>
            </ul>
            <p>Features:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Real-time fetching</li>
              <li>Bet placement panel</li>
              <li>Result history</li>
              <li>Odds display</li>
              <li>Owner dashboard for triggering match updates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">6. Betting Workflow</h2>
            <p>Step-by-step:</p>
            <ol className="list-decimal list-inside ml-6 space-y-2">
              <li><strong>Match Fetching</strong><br />Owner triggers requestMatches()<br />Chainlink Functions fetches today’s EPL matches<br />Smart contract updates match list on-chain</li>
              <li><strong>User Betting</strong><br />Users place bets payable in USDT:<br />Select match<br />Choose outcome (Home, Draw, Away)<br />Smart contract holds USDT until result is known</li>
              <li><strong>Results Resolution</strong><br />Contract calls requestMatchResult(matchId)<br />Chainlink Functions returns official results<br />Contract marks match as:<br />Home Win (1)<br />Draw (2)<br />Away Win (3)</li>
              <li><strong>Payouts</strong><br />All winning bets are paid immediately:<br />payout = amount * odds</li>
            </ol>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">7. Security Model</h2>
            <h3 className="text-2xl font-semibold text-violet-100 mb-2">7.1 Oracles</h3>
            <p>Chainlink ensures:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Integrity of match data</li>
              <li>Delivery without manipulation</li>
            </ul>

            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">7.2 Smart Contract</h3>
            <p>Security techniques:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Immutable odds</li>
              <li>Owner cannot modify match results</li>
              <li>Rate limiting on requests</li>
              <li>USDT-safe transfer patterns</li>
              <li>Access control for critical functions</li>
            </ul>

            <h3 className="text-2xl font-semibold text-violet-100 mb-2 mt-4">7.3 API Key Security</h3>
            <ul className="list-disc list-inside ml-6">
              <li>Keys encrypted via Chainlink Secrets</li>
              <li>Stored off-chain on IPFS</li>
              <li>Can only be decrypted inside DON</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">8. Use of Stablecoins (USDT)</h2>
            <p>Using USDT ensures:</p>
            <ul className="list-disc list-inside ml-6">
              <li>No volatility</li>
              <li>Easy onboarding</li>
              <li>Smooth deposits/withdrawals</li>
              <li>Trust from existing crypto users</li>
            </ul>
            <p>USDT runs on Polygon (Amoy/Testnet now), ideal due to:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Low fees</li>
              <li>High speed</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">9. Future Expansions</h2>
            <h3 className="text-xl font-semibold text-violet-100 mb-2">Short-Term</h3>
            <ul className="list-disc list-inside ml-6">
              <li>Multisport support (La Liga, NBA, UFC)</li>
              <li>Live betting market</li>
              <li>User profiles + streaks + leaderboards</li>
              <li>Referral rewards</li>
            </ul>
            <h3 className="text-xl font-semibold text-violet-100 mb-2 mt-4">Long-Term</h3>
            <ul className="list-disc list-inside ml-6">
              <li>Launch MATCH token</li>
              <li>DAO for governance</li>
              <li>Community-owned odds system</li>
              <li>Cross-chain deployments</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">10. Token Utility (Optional Future)</h2>
            <p>If launched, MATCH token could power:</p>
            <ul className="list-disc list-inside ml-6">
              <li>Reduced fees</li>
              <li>Liquidity pools for betting markets</li>
              <li>DAO governance</li>
              <li>Rewards for bettors</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">11. Risks & Mitigation</h2>
            <table className="w-full border-collapse border border-gray-600 mt-4">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-600 p-2 text-left">Risk</th>
                  <th className="border border-gray-600 p-2 text-left">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-600 p-2">API downtime</td>
                  <td className="border border-gray-600 p-2">Multiple fallback APIs + retries</td>
                </tr>
                <tr className="bg-gray-700">
                  <td className="border border-gray-600 p-2">Oracle delay</td>
                  <td className="border border-gray-600 p-2">Chainlink Automation + manual triggers</td>
                </tr>
                <tr>
                  <td className="border border-gray-600 p-2">Smart contract bugs</td>
                  <td className="border border-gray-600 p-2">Audits + formal verification</td>
                </tr>
                <tr className="bg-gray-700">
                  <td className="border border-gray-600 p-2">Stablecoin risk</td>
                  <td className="border border-gray-600 p-2">USDT (trusted & widely used)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">12. Conclusion</h2>
            <p>
              MatchX is redefining sports betting through decentralization, automation, and transparency.
              By combining smart contracts + Chainlink Functions + USDT, it eliminates the core problems with centralized betting systems while delivering a smooth, modern user experience.
            </p>
            <p>
              The future of betting is trustless — and Samantha is leading that transformation.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-violet-200 mb-4">Appendix</h2>
            <h3 className="text-2xl font-semibold text-violet-100 mb-2">A. Technologies Used</h3>
            <ul className="list-disc list-inside ml-6">
              <li>Solidity</li>
              <li>Hardhat</li>
              <li>Chainlink Functions</li>
              <li>Chainlink Automation</li>
              <li>IPFS</li>
              <li>USDT (ERC20)</li>
              <li>React.js</li>
              <li>GSAP</li>
              <li>Wagmi / RainbowKit</li>
              <li>Pinata</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Whitepaper;
