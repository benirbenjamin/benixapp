import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Webhook,
  Terminal,
  Zap,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  HelpCircle
} from 'lucide-react';

export const BenixPayDocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python' | 'php'>('curl');
  const [webhookLang, setWebhookLang] = useState<'node' | 'python' | 'php'>('node');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://benix.space/api/v1/benixpay/checkout \\
  -H "Authorization: Bearer bp_test_sec_9a7b8c...your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_reference": "ORD-98421",
    "amount": 5000,
    "currency": "RWF",
    "customer_email": "client@example.com",
    "customer_phone": "0788123456",
    "redirect_url": "https://yoursite.com/checkout/success"
  }'`,
    node: `// Install: npm install axios
import axios from 'axios';

async function createPayment() {
  const response = await axios.post(
    'https://benix.space/api/v1/benixpay/checkout',
    {
      order_reference: 'ORD-98421',
      amount: 5000,
      currency: 'RWF',
      customer_email: 'client@example.com',
      customer_phone: '0788123456',
      redirect_url: 'https://yoursite.com/checkout/success'
    },
    {
      headers: {
        'Authorization': 'Bearer bp_test_sec_your_secret_key',
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Redirect customer to:', response.data.checkout_url);
}`,
    python: `# Install: pip install requests
import requests

url = "https://benix.space/api/v1/benixpay/checkout"
headers = {
    "Authorization": "Bearer bp_test_sec_your_secret_key",
    "Content-Type": "application/json"
}
payload = {
    "order_reference": "ORD-98421",
    "amount": 5000,
    "currency": "RWF",
    "customer_email": "client@example.com",
    "customer_phone": "0788123456",
    "redirect_url": "https://yoursite.com/checkout/success"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Redirect customer to:", data.get("checkout_url"))`,
    php: `<?php
$curl = curl_init();

$payload = [
    "order_reference" => "ORD-98421",
    "amount" => 5000,
    "currency" => "RWF",
    "customer_email" => "client@example.com",
    "customer_phone" => "0788123456",
    "redirect_url" => "https://yoursite.com/checkout/success"
];

curl_setopt_array($curl, [
    CURLOPT_URL => "https://benix.space/api/v1/benixpay/checkout",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer bp_test_sec_your_secret_key",
        "Content-Type: application/json"
    ],
]);

$response = curl_exec($curl);
$data = json_decode($response, true);
curl_close($curl);

echo "Redirect URL: " . $data['checkout_url'];
?>`
  };

  const webhookSnippets = {
    node: `// Express.js Webhook Receiver
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'your_webhook_secret_from_dashboard';

app.post('/webhook/benixpay', (req, res) => {
  const signatureHeader = req.headers['x-benixpay-signature'];
  if (!signatureHeader) return res.status(401).send('No signature header');

  // Format: t=<timestamp>,v1=<hash>
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(\`\${timestamp}.\${payload}\`)
    .digest('hex');

  // Timing safe comparison to prevent side-channel attacks
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    const event = req.body;
    if (event.event === 'payment.successful') {
      const { transaction_id, order_reference, amount } = event.data;
      console.log(\`✅ Order \${order_reference} paid: \${amount} RWF\`);
    }
    return res.status(200).json({ received: true });
  }

  return res.status(400).send('Invalid signature');
});`,
    python: `# Python / Flask Webhook Receiver
import hmac, hashlib, time
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = b"your_webhook_secret_from_dashboard"

@app.route("/webhook/benixpay", methods=["POST"])
def benixpay_webhook():
    sig_header = request.headers.get("X-BenixPay-Signature", "")
    parts = dict(p.split("=") for p in sig_header.split(",") if "=" in p)
    timestamp = parts.get("t")
    received_sig = parts.get("v1")

    payload = request.get_data()
    signed_payload = f"{timestamp}.".encode("utf-8") + payload
    expected_sig = hmac.new(WEBHOOK_SECRET, signed_payload, hashlib.sha256).hexdigest()

    if hmac.compare_digest(received_sig, expected_sig):
        event = request.json
        if event.get("event") == "payment.successful":
            data = event.get("data", {})
            print(f"✅ Order {data.get('order_reference')} settled!")
        return jsonify({"received": True}), 200

    return "Invalid signature", 400`,
    php: `<?php
// PHP Webhook Receiver
$webhookSecret = "your_webhook_secret_from_dashboard";

$signatureHeader = $_SERVER['HTTP_X_BENIXPAY_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');

preg_match('/t=([0-9]+)/', $signatureHeader, $tsMatch);
preg_match('/v1=([a-f0-9]+)/', $signatureHeader, $sigMatch);

$timestamp = $tsMatch[1] ?? '';
$receivedSig = $sigMatch[1] ?? '';

$expectedSig = hash_hmac('sha256', "{$timestamp}.{$payload}", $webhookSecret);

if (hash_equals($receivedSig, $expectedSig)) {
    $event = json_decode($payload, true);
    if ($event['event'] === 'payment.successful') {
        // Fulfill order
    }
    http_response_code(200);
    echo json_encode(['received' => true]);
} else {
    http_response_code(400);
    echo "Invalid signature";
}
?>`
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-24">
      {/* Hero Header */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-blue-950/20 via-[#0B0E14] to-[#0B0E14] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Developer API Reference v1.0</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Benix Pay <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Merchant Gateway API</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed">
            Accept MTN Mobile Money, Airtel Money, and Visa/Mastercard payments in your website or mobile app across Rwanda and East Africa with a single unified REST API.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/dashboard#pay"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Your API Keys</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all"
            >
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Quickstart Guide</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Quickstart 3-Step Flow */}
        <section id="quickstart" className="space-y-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-400" />
            <span>3-Step Quickstart</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-black text-sm flex items-center justify-center border border-blue-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-white">Get API Credentials</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Activate your merchant account on the dashboard to receive your <code className="text-blue-400 font-mono text-[11px]">bp_test_pub_...</code> and <code className="text-purple-400 font-mono text-[11px]">bp_test_sec_...</code> keys instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-white">Create Checkout Session</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Make a server-to-server <code className="text-amber-400 font-mono text-[11px]">POST /api/v1/benixpay/checkout</code> call with your order details and redirect the buyer to the returned <code className="text-slate-300 font-mono text-[11px]">checkout_url</code>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-white">Receive Instant Settlement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive atomic HMAC-signed webhooks at your server and watch net funds credit your Central Benix Wallet with zero race conditions.
              </p>
            </div>
          </div>
        </section>

        {/* API Endpoint: Create Checkout */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs uppercase">
                POST
              </span>
              <code className="text-base font-mono font-bold text-white">/api/v1/benixpay/checkout</code>
            </div>
            <p className="text-sm text-slate-400">
              Initialize a hosted checkout session and receive a secure redirect URL for your customer.
            </p>
          </div>

          {/* Request Header and Parameters */}
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Headers & Parameters</span>
              <span className="text-[11px] text-slate-500 font-mono">Authorization: Bearer bp_sec_...</span>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-3 border-b border-slate-800/60 text-slate-300">
                <div>
                  <span className="text-blue-400 font-bold">order_reference</span>
                  <span className="text-rose-400 ml-1 font-sans">*required</span>
                </div>
                <div className="text-slate-400">string</div>
                <div className="text-slate-400 font-sans">Unique invoice or cart ID from your system (e.g. ORD-1002).</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-3 border-b border-slate-800/60 text-slate-300">
                <div>
                  <span className="text-blue-400 font-bold">amount</span>
                  <span className="text-rose-400 ml-1 font-sans">*required</span>
                </div>
                <div className="text-slate-400">number (&gt; 0)</div>
                <div className="text-slate-400 font-sans">Gross amount to charge the buyer (e.g. 5000).</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-3 border-b border-slate-800/60 text-slate-300">
                <div>
                  <span className="text-blue-400 font-bold">currency</span>
                </div>
                <div className="text-slate-400">string (default: 'RWF')</div>
                <div className="text-slate-400 font-sans">Supported: RWF, USD.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-3 border-b border-slate-800/60 text-slate-300">
                <div>
                  <span className="text-blue-400 font-bold">redirect_url</span>
                </div>
                <div className="text-slate-400">string (URL)</div>
                <div className="text-slate-400 font-sans">Customer return URL after completing checkout.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300">
                <div>
                  <span className="text-blue-400 font-bold">customer_email</span>
                </div>
                <div className="text-slate-400">string (email)</div>
                <div className="text-slate-400 font-sans">Customer email for official branded receipt dispatch.</div>
              </div>
            </div>
          </div>

          {/* Interactive Code Switcher */}
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                {(['curl', 'node', 'python', 'php'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(codeSnippets[activeTab], 'checkout_code')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {copiedId === 'checkout_code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto bg-[#090D14]">
              <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed">
                {codeSnippets[activeTab]}
              </pre>
            </div>
          </div>

          {/* Response Example */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example JSON Response</span>
            <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800 overflow-x-auto">
              <pre className="text-xs font-mono text-cyan-300">
{`{
  "success": true,
  "transaction_id": "bp_txn_7a29e1f58b0c",
  "checkout_url": "https://benix.space/pay/bp_txn_7a29e1f58b0c",
  "order_reference": "ORD-98421",
  "amount": 5000,
  "currency": "RWF",
  "fee_breakdown": {
    "gross_amount": 5000,
    "fee_amount": 225,
    "net_amount": 4775,
    "fee_bearer": "merchant",
    "fee_percent": 4.5
  },
  "mode": "sandbox"
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Webhooks Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Webhook className="w-6 h-6 text-purple-400" />
              <span>HMAC-SHA256 Signed Webhooks</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every payment event emits a signed HTTP POST request with the header <code className="text-purple-400 font-mono text-xs">X-BenixPay-Signature</code> containing the signature string <code className="text-slate-300 font-mono text-xs">t=&lt;timestamp&gt;,v1=&lt;hash&gt;</code>.
            </p>
          </div>

          {/* Webhook Code Switcher */}
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                {(['node', 'python', 'php'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setWebhookLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      webhookLang === lang
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {lang === 'node' ? 'Node.js (Express)' : lang === 'python' ? 'Python (Flask)' : 'PHP'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(webhookSnippets[webhookLang], 'webhook_code')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {copiedId === 'webhook_code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto bg-[#090D14]">
              <pre className="text-xs font-mono text-purple-300/90 leading-relaxed">
                {webhookSnippets[webhookLang]}
              </pre>
            </div>
          </div>
        </section>

        {/* Sandbox Test Simulator Guide */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Sandbox Testing & Test Numbers</span>
            </h2>
            <p className="text-sm text-slate-400">
              In test mode, test checkout pages include an interactive simulator toolbar to trigger instant state transitions without real funds.
            </p>
          </div>

          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-xs font-bold text-emerald-400 uppercase">Successful Payment</span>
                <p className="text-base font-mono font-bold text-white">0780000001</p>
                <p className="text-[11px] text-slate-400">Simulates instant MoMo push approval.</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="text-xs font-bold text-rose-400 uppercase">Insufficient Funds</span>
                <p className="text-base font-mono font-bold text-white">0780000002</p>
                <p className="text-[11px] text-slate-400">Simulates failed payment due to low wallet balance.</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase">User Cancelled</span>
                <p className="text-base font-mono font-bold text-white">0780000003</p>
                <p className="text-[11px] text-slate-400">Simulates buyer rejection or timeout.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-black text-white">Ready to Accept Live Payments?</h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Set up your business name, configure webhook URLs, and submit KYC verification in seconds from your central dashboard.
            </p>
          </div>
          <Link
            to="/dashboard#pay"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Open Merchant Hub
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BenixPayDocsPage;
