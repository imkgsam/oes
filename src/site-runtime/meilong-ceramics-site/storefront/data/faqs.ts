export type FaqEntry = {
  answer: string
  id: string
  question: string
  sort: number
}

export type FaqCategory = {
  id: string
  locale: 'en-US'
  questions: FaqEntry[]
  sort: number
  title: string
}

// faqCategories is a development and test fixture; the production FAQ page reads the local Runtime directory instead.
export const faqCategories: FaqCategory[] = [
  {
    id: 'orders-shipping',
    locale: 'en-US',
    sort: 10,
    title: 'Orders & Shipping',
    questions: [
      {
        id: 'order-processing',
        sort: 10,
        question: 'When will my order begin processing?',
        answer: 'In-stock orders are prepared as soon as payment and delivery details are confirmed. Timing can vary for made-to-order pieces, freight deliveries, and orders that require a delivery appointment.'
      },
      {
        id: 'order-tracking',
        sort: 20,
        question: 'How can I track my delivery?',
        answer: 'Once a shipment is released, the delivery confirmation includes the carrier details and tracking information available for that order. Freight carriers may contact you separately to arrange the final delivery window.'
      },
      {
        id: 'order-changes',
        sort: 30,
        question: 'Can I change an order after it has been placed?',
        answer: 'Contact Customer Service as soon as possible. Changes can be reviewed before an order enters fulfillment, but availability depends on the product, production status, and delivery arrangement.'
      },
      {
        id: 'delivery-inspection',
        sort: 40,
        question: 'Should I inspect a shipment when it arrives?',
        answer: 'Yes. Check the packaging and product condition at delivery, and retain the packaging until the order has been fully inspected. Prompt documentation helps the support team review any shipping concern.'
      }
    ]
  },
  {
    id: 'returns-warranty',
    locale: 'en-US',
    sort: 20,
    title: 'Returns & Warranty',
    questions: [
      {
        id: 'return-request',
        sort: 10,
        question: 'How do I start a return request?',
        answer: 'Please contact Customer Service with your order reference, the product details, and the reason for the request. The team will confirm whether the item is eligible and provide the next steps before anything is sent back.'
      },
      {
        id: 'return-condition',
        sort: 20,
        question: 'What condition must a return be in?',
        answer: 'Return eligibility generally requires an unused, uninstalled product in its original protective packaging. Special-order and customized items may follow different conditions, so confirm the product-specific policy before arranging a return.'
      },
      {
        id: 'warranty-coverage',
        sort: 30,
        question: 'What does a product warranty cover?',
        answer: 'Warranty coverage is specific to each product and typically addresses verified manufacturing defects under normal use. Review the product documentation and warranty page for the applicable terms, exclusions, and claim process.'
      }
    ]
  },
  {
    id: 'product-care-installation',
    locale: 'en-US',
    sort: 30,
    title: 'Product Care & Installation',
    questions: [
      {
        id: 'professional-installation',
        sort: 10,
        question: 'Should I use a professional installer?',
        answer: 'Professional installation is recommended for plumbing products, fixtures, and heavy items. A qualified installer can verify dimensions, site conditions, connections, and local code requirements before the work begins.'
      },
      {
        id: 'rough-in-planning',
        sort: 20,
        question: 'Can I complete rough-in work before the product arrives?',
        answer: 'Use the current specification sheet as a planning guide, then verify the delivered product before final rough-in. Product dimensions and installation conditions should be checked on site rather than assumed from a screen or plan alone.'
      },
      {
        id: 'cleaning-guidance',
        sort: 30,
        question: 'How should I clean my fixture or sink?',
        answer: 'Clean gently with a soft cloth, mild soap, and water unless the care guide states otherwise. Avoid abrasive pads, harsh acids, and strong chemical cleaners that can affect finishes, glazing, and protective coatings.'
      },
      {
        id: 'replacement-parts',
        sort: 40,
        question: 'Can I request replacement parts?',
        answer: 'Customer Service can help identify compatible service parts when you provide the model number, finish, and a clear description of the part needed. Photos are useful when the component is difficult to identify.'
      }
    ]
  },
  {
    id: 'finishes-samples',
    locale: 'en-US',
    sort: 40,
    title: 'Finishes & Samples',
    questions: [
      {
        id: 'finish-samples',
        sort: 10,
        question: 'Can I request a finish sample?',
        answer: 'Finish samples are the most reliable way to assess tone and texture in your own lighting. Contact the sales or support team to confirm current sample availability for the product family you are specifying.'
      },
      {
        id: 'finish-variation',
        sort: 20,
        question: 'Will every finish match exactly?',
        answer: 'Natural materials and specialty finishes can show subtle variation in color, sheen, or patina. This character is expected, especially across separate production runs, and a physical sample is recommended for coordinated projects.'
      },
      {
        id: 'finish-care',
        sort: 30,
        question: 'How can I protect a specialty finish?',
        answer: 'Use only gentle, finish-safe care and dry the surface after use. Avoid abrasive products and prolonged contact with chemicals, which can change the appearance of specialty or living finishes over time.'
      }
    ]
  },
  {
    id: 'account-support',
    locale: 'en-US',
    sort: 50,
    title: 'Account & Support',
    questions: [
      {
        id: 'product-documents',
        sort: 10,
        question: 'Where can I find product dimensions and installation information?',
        answer: 'Product pages and specification documents provide the best starting point for dimensions, finishes, and installation notes. For project-specific questions, share the product model with the support team before making final site decisions.'
      },
      {
        id: 'contact-support',
        sort: 20,
        question: 'How do I contact Customer Service?',
        answer: 'Use the contact page to send order, product, or technical questions to the appropriate team. Include your order reference or product model whenever possible so the response can be specific to your request.'
      },
      {
        id: 'policy-details',
        sort: 30,
        question: 'Where can I review warranty and return policy details?',
        answer: 'The Warranty page explains product coverage, while Returns & Refunds explains eligibility, return authorization, and eligible credits. For an active order or product-specific question, Customer Service can clarify which policy applies before you take action.'
      }
    ]
  }
]

// buildFaqPageStructuredData serializes the exact displayed FAQ directory; the fixture remains only its test default.
export function buildFaqPageStructuredData(canonicalUrl: string, categories: Array<{ questions: Array<{ question: string; answer?: string; answerHtml?: string }> }> = faqCategories): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: categories.flatMap((category) =>
      category.questions.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer ?? entry.answerHtml ?? ''
        }
      }))
    ),
    name: 'FAQ / Help | MAIDSTONE | DXV',
    url: canonicalUrl
  }
}
