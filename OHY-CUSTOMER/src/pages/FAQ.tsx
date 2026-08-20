import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I purchase tickets?",
      answer: "Browse our events, select the event you want to attend, choose your ticket type and quantity, then click 'Purchase Now'. You'll be guided through a secure checkout process."
    },
    {
      question: "Can I get a refund on my tickets?",
      answer: "All ticket sales are final and non-refundable. However, in case of event cancellation by the organizer, refunds will be processed within 14 business days."
    },
    {
      question: "How will I receive my tickets?",
      answer: "After successful payment, your e-tickets will be sent to your registered email address. You can also access them from your account dashboard."
    },
    {
      question: "Can I transfer my tickets to someone else?",
      answer: "Tickets cannot be exchanged or transferred to another event or person. Please ensure you enter the correct details during purchase."
    },
    {
      question: "What do I need to bring to the event?",
      answer: "You'll need your e-ticket (digital or printed) and a valid government-issued photo ID. Some events may have additional requirements which will be specified in the event details."
    },
    {
      question: "Is there an age restriction for events?",
      answer: "Age restrictions vary by event. Please check the specific event details page for information about age requirements."
    },
    {
      question: "What happens if an event is cancelled?",
      answer: "If an event is cancelled by the organizer, you will be notified via email and refunds will be processed automatically within 14 business days."
    },
    {
      question: "Can I modify my ticket after purchase?",
      answer: "Once purchased, ticket details cannot be modified. Please review your order carefully before completing the purchase."
    },
    {
      question: "How do I add events to my wishlist?",
      answer: "Click the heart icon on any event card to add it to your wishlist. You can view all your saved events in the Wishlist section."
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach our support team through the Help Center or email us at support@ohyevents.com. We typically respond within 24 hours."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white/80 text-sm mb-4 font-montserrat">
            Home / FAQs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-montserrat">
            Frequently Asked Questions
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-lg text-muted-foreground mb-8 font-montserrat">
          Find answers to common questions about our events and ticketing process.
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-2xl px-6 border border-gray-100 shadow-sm"
            >
              <AccordionTrigger className="text-left font-semibold font-montserrat hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-montserrat pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 p-6 bg-purple-50 rounded-2xl border border-purple-100">
          <h3 className="text-xl font-bold mb-2 font-montserrat">Still have questions?</h3>
          <p className="text-muted-foreground font-montserrat mb-4">
            Can't find the answer you're looking for? Please reach out to our customer support team.
          </p>
          <a 
            href="mailto:support@ohyevents.com"
            className="text-primary font-semibold font-montserrat hover:underline"
          >
            support@ohyevents.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
