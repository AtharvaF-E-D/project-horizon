import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";

const Terms = () => {
  useEffect(() => {
    document.title = "Terms of Service | SIMPLIFY CRM";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "SIMPLIFY CRM Terms of Service — rules and conditions for using the platform.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-6 text-foreground/90 leading-relaxed">
          <div>
            <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using SIMPLIFY CRM ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">2. Use of the Service</h2>
            <p>You agree to use the Service only for lawful purposes and in compliance with all applicable laws and regulations. You are responsible for safeguarding your account credentials and all activity under your account.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">3. Subscriptions & Payments</h2>
            <p>Paid plans are billed in advance on a recurring basis. You may cancel at any time; cancellations take effect at the end of the current billing period. Refunds are handled in accordance with our refund policy.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">4. User Data</h2>
            <p>You retain ownership of all data you upload to the Service. You grant us a limited license to process your data solely to provide and improve the Service. See our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link> for details.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">5. Acceptable Use</h2>
            <p>You may not use the Service to send spam, distribute malware, infringe intellectual property, or harass others. We may suspend accounts that violate these terms.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">6. Service Availability</h2>
            <p>We strive for high availability but do not guarantee uninterrupted access. Scheduled maintenance and unforeseen outages may occur.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, SIMPLIFY CRM shall not be liable for indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">8. Termination</h2>
            <p>We may suspend or terminate your access to the Service if you breach these terms. Upon termination, your right to use the Service ceases immediately.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">9. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be communicated via email or in-app notice. Continued use after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">10. Contact</h2>
            <p>For questions about these Terms, contact us through the in-app Help & Support page.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Terms;
