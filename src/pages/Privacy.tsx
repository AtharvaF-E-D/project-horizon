import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | SIMPLIFY CRM";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "SIMPLIFY CRM Privacy Policy — how we collect, use, and protect your data.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-6 text-foreground/90 leading-relaxed">
          <div>
            <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
            <p>We collect account information (name, email, password hash), CRM data you upload (contacts, leads, deals), and usage data (logs, IP address, device type) to operate the Service.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Authenticate users and prevent abuse</li>
              <li>Send transactional and security emails</li>
              <li>Respond to support requests</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">3. Data Storage & Security</h2>
            <p>Your data is stored on secure cloud infrastructure with encryption in transit (TLS) and at rest. Access is governed by Row-Level Security policies; only you and authorized members of your workspace can view your data.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with service providers necessary to operate the Service (e.g., hosting, email delivery, voice/SMS providers) under strict confidentiality.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">5. Your Rights (GDPR / CCPA)</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time. Contact us via the Help & Support page to exercise these rights.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">6. Cookies</h2>
            <p>We use essential cookies to maintain your session. We do not use advertising or third-party tracking cookies.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">7. Data Retention</h2>
            <p>We retain your data for the duration of your account. Upon account deletion, data is permanently removed within 30 days, except where retention is required by law.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">8. Children's Privacy</h2>
            <p>The Service is not directed to children under 16. We do not knowingly collect personal data from children.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notice.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">10. Contact</h2>
            <p>For privacy questions, contact us through the in-app Help & Support page. See also our <Link to="/terms" className="text-primary underline">Terms of Service</Link>.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Privacy;
