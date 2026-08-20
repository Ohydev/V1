import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white/80 text-sm mb-4 font-montserrat">
            Home / Privacy Policy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-montserrat">
            Privacy Policy
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground font-montserrat mb-6">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Introduction</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              Welcome to OHY Events. We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit 
              our website and use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Information We Collect</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground font-montserrat">
              <li>Name, email address, and contact information</li>
              <li>Payment and billing information</li>
              <li>Account credentials and preferences</li>
              <li>Event attendance history and ticket purchases</li>
              <li>Communications with our customer support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">How We Use Your Information</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground font-montserrat">
              <li>Process your ticket purchases and send confirmations</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send event updates, reminders, and promotional materials</li>
              <li>Improve our services and user experience</li>
              <li>Detect and prevent fraudulent transactions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Information Sharing</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground font-montserrat mt-4">
              <li>Event organizers for events you have registered for</li>
              <li>Payment processors to complete transactions</li>
              <li>Service providers who assist in our operations</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Data Security</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
              over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Your Rights</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground font-montserrat">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Cookies</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on our website. 
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Changes to This Policy</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Contact Us</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-4">
              <a 
                href="mailto:privacy@ohyevents.com" 
                className="text-primary font-semibold font-montserrat hover:underline"
              >
                privacy@ohyevents.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
