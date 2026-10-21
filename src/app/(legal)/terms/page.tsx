import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from '@/lib/terms'
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from '@/lib/support'

export const metadata = {
  title: 'Terms and Conditions | Impact Link',
  description: 'Terms for using Impact Link to find, list and manage properties in Nigeria.',
}

const sections = [
  {
    id: 'about', title: '1. About these terms',
    paragraphs: [
      'These Terms and Conditions govern your use of Impact Link at link.theimpactproperties.com, including property searches, listings, inspections and property management tools. By selecting the acceptance checkbox when you sign up, you agree to these terms. Please read them before creating an account.',
      'A property sale, tenancy, lease, shortlet, agency appointment or professional service may require a separate agreement between the relevant parties. These platform terms do not replace those agreements or change rights and obligations under an existing property agreement.',
    ],
  },
  {
    id: 'accounts', title: '2. Eligibility and account security',
    paragraphs: [
      'You must be at least 18 years old and able to enter into an agreement to create an account. If you act for another person or an organisation, you must have authority to do so. Select the account role that accurately describes how you use the platform.',
      'Provide accurate registration and onboarding information, keep your contact details current, and protect your password and account access. Do not impersonate another person, create deceptive accounts, or share access to carry out unauthorised activity. Contact us promptly if you suspect misuse of your account.',
    ],
  },
  {
    id: 'platform', title: '3. Our role and listing reviews',
    paragraphs: [
      'Impact Link helps people discover properties and provides tools for property owners, tenants, agents and property professionals. A listing does not by itself make Impact Link the property owner, landlord, seller, tenant, agent, lawyer, guarantor or a party to a property transaction. Any service we separately agree to provide will be described in its own terms.',
      'We may review, approve, reject or remove listings. A “verified” or approved listing means it has passed our platform review; it is not a guarantee of legal title, authority to transact, property condition, availability, personal safety or a particular financial outcome. Review the relevant documents and obtain independent professional advice where needed before committing to a transaction.',
    ],
  },
  {
    id: 'listings', title: '4. Listing properties and supplying information',
    paragraphs: [
      'Only list a property that you own or are authorised to list. Accurately state your relationship to the property and, where relevant, your relationship to the direct owner. Supply truthful owner contact details, location, property features, pricing, availability, images, document descriptions and inspection details.',
      'You are responsible for obtaining the authority and permissions needed to upload information, photographs and another person’s contact details. Do not upload forged documents, misleading photographs, stolen content, discriminatory listings or information that breaches another person’s rights. A list of available document types does not establish that we have authenticated those documents.',
      'Keep your listing current and tell us when a property is no longer available or material information changes. The ownership and accuracy declaration you accept when submitting a property applies to all information supplied with that listing.',
    ],
  },
  {
    id: 'inspections', title: '5. Enquiries, inspections and due diligence',
    paragraphs: [
      'Inspection requests are enquiries, not confirmed bookings or reservations. A date and time must be agreed with the team or the authorised contact. Listing availability can change before an inspection or agreement is completed.',
      'Inspect the property, confirm the other party’s identity and authority, understand the documents and transaction terms, and verify payment instructions independently. Do not send money simply because a listing appears on the platform or someone claims to represent Impact Link. Report suspicious requests through the contact details below.',
    ],
  },
  {
    id: 'fees', title: '6. Prices, fees and payments',
    paragraphs: [
      'Property prices and relevant agreement, platform, agency, service and caution fees are shown where applicable. Check the amount, calculation basis and pricing period: a rental period, a yearly lease price, a nightly shortlet rate or a sale price are different commitments. Ask for clarification about any charge before agreeing to it.',
      'A listing price or fee estimate is not a payment receipt or a completed transaction. Obtain a clear written agreement identifying the parties, authorised payee, total payable, payment schedule and any deposit, refund or cancellation conditions. These terms do not authorise hidden or undisclosed charges.',
      'Property management payment summaries may be based on information entered by users and are not independent proof that funds were received. Verify payments against actual receipts and your financial records.',
    ],
  },
  {
    id: 'cancellations', title: '7. Reservations, cancellations and refunds',
    paragraphs: [
      'Submitting an enquiry or requesting an inspection does not create a tenancy, lease, reservation or sale. A binding commitment depends on the agreement and applicable law, not merely on a property being displayed on Impact Link.',
      'Refund and cancellation arrangements for a property or separately agreed service must be disclosed before payment and agreed with the party providing that property or service. We do not impose a blanket “no refunds” rule through these terms. Contact us about any charge made for a service provided directly by Impact Link. Your mandatory consumer rights continue to apply.',
    ],
  },
  {
    id: 'conduct', title: '8. Acceptable use',
    paragraphs: [
      'Use the platform lawfully and respectfully. Do not commit fraud, harass or threaten people, unlawfully discriminate, send unsolicited messages, collect personal information for unrelated purposes, bypass access controls, introduce harmful code or interfere with the service.',
      'Do not copy or reuse another user’s information without permission or use automated access that compromises privacy, security or service availability. Report inaccurate listings, unauthorised use of a property, and suspected scams to our team.',
    ],
  },
  {
    id: 'content', title: '9. Your content and platform materials',
    paragraphs: [
      'You retain your rights in content you submit. You grant Impact Link permission to store, format, display and use that content as reasonably needed to publish your listings, provide the requested services, conduct reviews and handle support. You must have the rights and permissions needed to grant that permission.',
      'Impact Link’s branding, software and original platform materials remain the property of their respective owners. Access to the platform does not transfer ownership of those materials to you.',
    ],
  },
  {
    id: 'privacy', title: '10. Personal information and communications',
    paragraphs: [
      'We use account, profile, listing, inspection and management information to operate the platform, authenticate accounts, review listings, arrange requested services and respond to support enquiries. Landlord onboarding may include contact details, state of origin, LGA and next-of-kin details. Provide another person’s information only when you have a lawful basis and have explained why it is being supplied.',
      'Public property pages display listing information and features. Direct owner details, next-of-kin details and other non-public profile information are not intended for public listing display. Service providers supporting authentication, email, hosting, database storage and image uploads may process information needed for their services.',
      'We store the date and version of terms accepted at signup and the declaration accepted with a property submission. We may send account verification and service messages needed for your use of Impact Link. Accepting these terms does not subscribe you to marketing messages.',
      'Contact us to request access to or correction of your personal information, request account closure or deletion, or raise a privacy concern. Requests are handled under applicable data protection law, including any identity checks and lawful retention requirements. These terms do not waive your privacy rights.',
    ],
  },
  {
    id: 'availability', title: '11. Availability and third-party services',
    paragraphs: [
      'We aim to keep Impact Link available and information accurate, but service interruptions, maintenance and errors can occur. Third-party login, maps, communications and other external services are subject to their own availability and applicable terms.',
      'Keep independent copies of important agreements, receipts and records. Contact us if an error affects a listing, account or service so that we can investigate.',
    ],
  },
  {
    id: 'suspension', title: '12. Account restrictions and closure',
    paragraphs: [
      'We may restrict an account or listing where reasonably necessary to address suspected fraud, a breach of these terms, a legal requirement or a security risk. Where lawful and practical, we will explain the reason and provide a way to contact us about the decision.',
      'You may stop using the platform and request account closure through support. Closing an account does not automatically cancel a separate property agreement, remove an existing payment obligation or extinguish a valid complaint. Information may be retained where required by law or reasonably needed to resolve outstanding matters.',
    ],
  },
  {
    id: 'responsibility', title: '13. Responsibility and consumer rights',
    paragraphs: [
      'Each user is responsible for their own statements, authority and conduct. We do not guarantee a third party’s performance or the accuracy of information supplied by that party. Impact Link remains responsible for its own services to the extent required by applicable law.',
      'Nothing in these terms excludes or limits rights or liabilities that cannot lawfully be excluded or limited, including applicable consumer and data protection rights. Nothing in these terms makes you responsible for loss caused by our fraud or other conduct for which the law requires us to remain responsible.',
    ],
  },
  {
    id: 'disputes', title: '14. Complaints and governing law',
    paragraphs: [
      'Contact our support team with the relevant listing reference, dates and supporting information if a problem arises. We will consider complaints relating to our platform and services. A dispute about a separate property agreement may also need to be addressed directly with the other party.',
      'These terms are governed by the laws of the Federal Republic of Nigeria, subject to any mandatory laws that also protect you. Contacting support does not remove your right to approach a competent court, consumer protection body or data protection regulator.',
    ],
  },
  {
    id: 'changes', title: '15. Changes to these terms',
    paragraphs: [
      'We may update these terms as our services or legal obligations change. We will publish the updated version and effective date on this page and give reasonable notice of material changes where required. Where a change requires your agreement, we will ask for it. Changes do not retrospectively alter a separate property agreement or remove rights that have already arisen.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 px-4 py-6 text-brand-dark md:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label="Impact Link home"><Image src="/logo.png" alt="Impact Link" width={140} height={32} className="h-auto w-36" priority /></Link>
          <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-forest hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to sign up</Link>
        </header>
        <main className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Terms and Conditions</h1>
          <p className="mt-3 text-sm text-gray-500">Effective {TERMS_EFFECTIVE_DATE} · Version {TERMS_VERSION}</p>
          <p className="mt-5 leading-relaxed text-gray-600">Please read these terms before creating your Impact Link account. They explain how our property marketplace and management tools may be used and what to expect from the service.</p>
          <nav aria-label="Terms contents" className="my-8 rounded-2xl bg-emerald-50/60 p-5">
            <h2 className="mb-3 font-bold">On this page</h2>
            <ul className="grid gap-2 text-sm md:grid-cols-2">{sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="text-brand-forest underline-offset-4 hover:underline">{section.title}</a></li>)}<li><a href="#contact" className="text-brand-forest underline-offset-4 hover:underline">16. Contact us</a></li></ul>
          </nav>
          <div className="space-y-8">{sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <h2 className="text-lg font-bold md:text-xl">{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => <p key={index} className="mt-3 text-sm leading-7 text-gray-600 md:text-base">{paragraph}</p>)}
            </section>
          ))}</div>
          <section id="contact" className="mt-8 scroll-mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-lg font-bold md:text-xl">16. Contact us</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">Contact Impact Link with questions about these terms, your account, listings or a privacy request.</p>
            <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-brand-forest">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 break-all hover:underline"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{SUPPORT_EMAIL}</a>
              <a href={SUPPORT_PHONE_HREF} className="inline-flex items-center gap-2 hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{SUPPORT_PHONE}</a>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
