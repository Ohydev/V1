import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white/80 text-sm mb-4 font-montserrat">
            Home / Terms of Use
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-montserrat">
            Terms of Use
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground font-montserrat mb-6">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Acceptance of Terms</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              By accessing and using the OHY Events website and services, you accept and agree to be bound by 
              these Terms of Use. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Use of Services</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed mb-4">
              You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground font-montserrat">
              <li>Use the services in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the services or servers</li>
              <li>Use automated systems to access the services without permission</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Account Registration</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              To access certain features, you may need to create an account. You are responsible for maintaining 
              the confidentiality of your account credentials and for all activities under your account. 
              You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Ticket Purchases</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed mb-4">
              When purchasing tickets through our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground font-montserrat">
              <li>All sales are final and non-refundable unless otherwise stated</li>
              <li>Tickets cannot be transferred or resold without authorization</li>
              <li>You must provide accurate payment and contact information</li>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to cancel orders for any reason</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Event Modifications</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              Event organizers reserve the right to modify event details, including but not limited to date, 
              time, venue, and lineup. In case of significant changes or cancellations, ticket holders will 
              be notified via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Intellectual Property</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              All content on this website, including text, graphics, logos, images, and software, is the property 
              of OHY Events or its content suppliers and is protected by copyright laws. You may not reproduce, 
              distribute, or create derivative works without express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">User Content</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              By submitting content to our platform (reviews, comments, etc.), you grant us a non-exclusive, 
              worldwide, royalty-free license to use, reproduce, and display such content. You represent that 
              you own or have the rights to any content you submit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Limitation of Liability</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              OHY Events shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages resulting from your use of or inability to use the services. Our total liability shall not 
              exceed the amount paid by you for the specific service giving rise to the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Disclaimer</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              Our services are provided "as is" without warranties of any kind, either express or implied. 
              We do not guarantee that the services will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Governing Law</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
              in which OHY Events operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Changes to Terms</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately 
              upon posting. Your continued use of the services constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Contact Information</h2>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              For questions about these Terms of Use, please contact us at:
            </p>
            <p className="mt-4">
              <a 
                href="mailto:legal@ohyevents.com" 
                className="text-primary font-semibold font-montserrat hover:underline"
              >
                legal@ohyevents.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;
