<script setup lang="ts">
import { nextTick, watch } from 'vue'
import {
  clampGalleryZoomScale,
  getBoundedGalleryPan,
  getGalleryPinchZoom,
  getGalleryPointerOriginPercent,
  getGallerySwipeDragOffset,
  getGallerySwipeStep
} from './kpdpGalleryGestures'

type ProductVariant = {
  sku: string
  label: string
  price: string
  swatch: string
  image: string
}

type ProductImage = {
  type?: 'image'
  src: string
  label: string
  wide?: boolean
}

type ProductVideo = {
  type: 'video'
  src: string
  label: string
  poster: string
  videoSrc: string
}

type ProductMedia = ProductImage | ProductVideo

type ProductResource = {
  label: string
  ariaLabel: string
  icon: string
  badge: string
  href: string
}

type RelatedProduct = {
  brand: string
  name: string
  price: string
  href: string
  image: string
  handle: string
}

type ReviewDistribution = {
  rating: number
  count: number
  percent: number
}

type ProductReview = {
  author: string
  region: string
  verifiedLabel: string
  date: string
  rating: number
  title: string
  body: string
  media: ProductReviewPhoto[]
  serviceReply?: {
    author: string
    date: string
    body: string
  }
  helpfulUp: number
  helpfulDown: number
}

type ProductReviewPhoto = {
  src: string
  alt: string
  author: string
  type?: 'image' | 'video'
  videoSrc?: string
}

type ProductQuestion = {
  question: string
  answer: string
}

type ReviewTab = 'reviews' | 'qa'
type ReviewSortOption = 'highest' | 'recent' | 'lowest'
type ReviewSubmissionMode = 'review' | 'question'
type ReviewSubmissionStep = 'form' | 'success'

type ReviewSubmissionForm = {
  rating: number
  title: string
  body: string
  name: string
  email: string
  region: string
  question: string
  notify: boolean
}

type ReviewSubmissionErrorKey = 'rating' | 'title' | 'body' | 'question' | 'name' | 'email' | 'media'

const reviewPageSize = 3
const reviewSubmissionMaxMediaFiles = 6
const reviewSubmissionMaxMediaSizeMb = 20
const reviewSubmissionMaxMediaSizeBytes = reviewSubmissionMaxMediaSizeMb * 1024 * 1024
const reviewSubmissionAcceptedMediaTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]
const reviewSubmissionAcceptedMediaExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.mp4', '.webm', '.mov']
const reviewSubmissionMediaAccept = [
  ...reviewSubmissionAcceptedMediaTypes,
  ...reviewSubmissionAcceptedMediaExtensions
].join(',')
const scene7 = 'https://kohler.scene7.com/is/image/PAWEB'
const { addToCart, isFavorite, openGuestCommerceDrawer, toggleFavorite } = useGuestCommerce()

const variants: ProductVariant[] = [
  {
    sku: 'K-39304-8-02M',
    label: 'White with Vibrant Brushed Moderne Brass',
    price: '$1,750.01',
    swatch: 'linear-gradient(135deg, #f7f7f4 0 52%, #b89634 52% 100%)',
    image: `${scene7}/39304-8-02M_ISO_d2c0131800_rgb`
  },
  {
    sku: 'K-39304-8-0CP',
    label: 'White with Polished Chrome',
    price: '$1,750.01',
    swatch: 'linear-gradient(135deg, #f8f8f6 0 52%, #d8d9d7 52% 100%)',
    image: `${scene7}/39304-8-0CP_ISO_d2c0131634_rgb`
  },
  {
    sku: 'K-39304-8-0BL',
    label: 'White with Black',
    price: '$1,750.01',
    swatch: 'linear-gradient(135deg, #fafaf8 0 52%, #252525 52% 100%)',
    image: `${scene7}/39304-8-0BL_ISO_d2c0132104_rgb`
  },
  {
    sku: 'K-39304-8-22M',
    label: 'Dune with Vibrant Brushed Moderne Brass',
    price: '$1,903.01',
    swatch: 'linear-gradient(135deg, #d5c9b7 0 52%, #b89634 52% 100%)',
    image: `${scene7}/39304-8-22M_ISO_d2c0131775_rgb`
  },
  {
    sku: 'K-39304-8-2BN',
    label: 'Vibrant Brushed Nickel',
    price: '$2,275.01',
    swatch: 'linear-gradient(135deg, #d4c9b7 0 52%, #b9b6ad 52% 100%)',
    image: `${scene7}/39304-8-2BN_ISO_d2c0131683_rgb`
  }
]

const galleryImages: ProductMedia[] = [
  {
    src: `${scene7}/39304-8-02M_ISO_d2c0131800_rgb`,
    label: 'Claude console table sink isolated product view',
    wide: true
  },
  {
    src: `${scene7}/39304-8-02M_CloseRoomViewSquare_d2c0131669_rgb`,
    label: 'Claude console sink in a finished bathroom'
  },
  {
    src: `${scene7}/39304-8-02M_DIMENSIONALSquareWithText_d2c0131586_en-US`,
    label: 'Claude console sink dimensional drawing'
  },
  {
    src: `${scene7}/39304-8-02M_CloseRoomViewOnePointSquareWithText_d2c0131879_en-US`,
    label: 'Claude console sink room perspective'
  },
  {
    src: `${scene7}/39304-8-02M_CloseRoomViewProductDetailSquare_d2c0131798_rgb`,
    label: 'Claude console sink product detail'
  },
  {
    src: `${scene7}/SKU_BATHROOMS_FEATUREDESIGNER_SheaMcGeeSquareWithText_en-US`,
    label: 'Studio McGee designer feature'
  },
  {
    src: `${scene7}/39304-8-02M_OverheadRoomViewSquare_d2c0131968_rgb`,
    label: 'Claude console sink overhead room view'
  },
  {
    src: `${scene7}/39304-8-02M_WarrantySquareWithText_d2c0131827_en-US`,
    label: 'Claude console sink warranty graphic'
  },
  {
    src: `${scene7}/39304-8-02M_InTheBoxSquareWithText_d2c0137878_en-US`,
    label: 'Claude console sink included parts'
  },
  {
    src: `${scene7}/39304-8-02M_TOPSquare_d2c0131815_rgb`,
    label: 'Claude console sink top view'
  },
  {
    type: 'video',
    src: 'https://www.youtube.com/watch?v=1iaifmKcvdI',
    label: 'Eir Intelligent toilet product video',
    poster: `${scene7}/77795-0_CloseRoomViewSquare_d2c0021552_rgb`,
    videoSrc: '/videos/eir-intelligent-toilet-demo.webm'
  },
  {
    src: `${scene7}/39304-8-02M_FRONTSquare_d2c0131810_rgb`,
    label: 'Claude console sink front view'
  }
]

const productResources: ProductResource[] = [
  { label: 'Specification Sheet', ariaLabel: 'Download specification sheet', icon: 'pdf', badge: 'PDF', href: '#' },
  { label: 'Installation Guide', ariaLabel: 'Download installation guide', icon: 'guide', badge: 'PDF', href: '#' },
  { label: 'Technical Drawing', ariaLabel: 'Download technical drawing', icon: 'drawing', badge: 'DWG', href: '#' },
  { label: 'Dimension Drawing', ariaLabel: 'Download dimension drawing', icon: 'drawing', badge: 'DIM', href: '#' },
  { label: 'Parts Diagram', ariaLabel: 'Download parts diagram', icon: 'parts', badge: 'PDF', href: '#' },
  { label: 'CAD Files', ariaLabel: 'Download CAD files', icon: 'cad', badge: 'CAD', href: '#' },
  { label: '3D Model', ariaLabel: 'Download 3D model', icon: 'model', badge: '3D', href: '#' },
  { label: 'Revit File', ariaLabel: 'Download Revit file', icon: 'revit', badge: 'RVT', href: '#' },
  { label: 'Care & Maintenance', ariaLabel: 'Download care and maintenance guide', icon: 'care', badge: 'PDF', href: '#' },
  { label: 'Warranty', ariaLabel: 'Download warranty information', icon: 'warranty', badge: 'PDF', href: '#' }
]

const relatedProducts: RelatedProduct[] = [
  {
    brand: 'MAIDSTONE',
    name: '24 Inch Bathroom Pedestal Sink',
    price: '$735.00',
    href: '/products/maidstone-24-inch-bathroom-pedestal-sink-138-pds25-8?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783834415294&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776186994/websites-product-info-and-content/maidstone/product-info/Website/138-PDS25-8.jpg',
    handle: 'maidstone-24-inch-bathroom-pedestal-sink-138-pds25-8'
  },
  {
    brand: 'MAIDSTONE',
    name: '22 Inch Bathroom Pedestal Sink',
    price: '$735.00',
    href: '/products/maidstone-22-inch-bathroom-pedestal-sink-138-pds27-8?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783836479678&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776198059/websites-product-info-and-content/maidstone/product-info/Website/138-PDS27-8_v1.jpg',
    handle: 'maidstone-22-inch-bathroom-pedestal-sink-138-pds27-8'
  },
  {
    brand: 'MAIDSTONE',
    name: '34 Inch Pedestal Sink',
    price: '$594.00',
    href: '/products/maidstone-34-inch-pedestal-sink-138-pds17?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783824748734&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776188982/websites-product-info-and-content/maidstone/product-info/Website/138-PDS17-8D_v3.jpg',
    handle: 'maidstone-34-inch-pedestal-sink-138-pds17'
  },
  {
    brand: 'MAIDSTONE',
    name: '26 Inch Porcelain Pedestal Bathroom Sink',
    price: '$559.00',
    href: '/products/maidstone-26-inch-porcelain-pedestal-bathroom-sink-138-pds28?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783828779198&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776285836/websites-product-info-and-content/maidstone/product-info/Website/138-PDS28.jpg',
    handle: 'maidstone-26-inch-porcelain-pedestal-bathroom-sink-138-pds28'
  },
  {
    brand: 'MAIDSTONE',
    name: '32 Inch Pedestal Sink',
    price: '$537.00',
    href: '/products/maidstone-32-inch-pedestal-sink-138-pds16?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783824617662&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776187851/websites-product-info-and-content/maidstone/product-info/Website/138-PDS16-4D.jpg',
    handle: 'maidstone-32-inch-pedestal-sink-138-pds16'
  },
  {
    brand: 'MAIDSTONE',
    name: '15 Inch Pedestal Sink',
    price: '$543.00',
    href: '/products/maidstone-15-inch-pedestal-sink-138-pds20-4d?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783834775742&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776285260/websites-product-info-and-content/maidstone/product-info/Website/138-PDS20-4D_V1.jpg',
    handle: 'maidstone-15-inch-pedestal-sink-138-pds20-4d'
  },
  {
    brand: 'MAIDSTONE',
    name: '20 Inch Pedestal Sink - 4 Inch Faucet Center',
    price: '$577.00',
    href: '/products/maidstone-20-inch-pedestal-sink-4-inch-faucet-center-138-pds21-4d?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783841853630&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776191819/websites-product-info-and-content/maidstone/product-info/Website/138-PDS21-4D.jpg',
    handle: 'maidstone-20-inch-pedestal-sink-4-inch-faucet-center-138-pds21-4d'
  },
  {
    brand: 'MAIDSTONE',
    name: 'Crest 26 Inch Pedestal Bathroom Sink - 8 Inch Faucet Drillings',
    price: '$840.00',
    href: '/products/maidstone-crest-26-inch-pedestal-bathroom-sink-8-inch-faucet-drillings-138-pds30-8?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783841198270&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1773865310/websites-product-info-and-content/maidstone/product-info/sink/138-pds30-8/138-pds30-8_lifestyle.jpg',
    handle: 'maidstone-crest-26-inch-pedestal-bathroom-sink-8-inch-faucet-drillings-138-pds30-8'
  },
  {
    brand: 'MAIDSTONE',
    name: '23 Inch Pedestal Sink',
    price: '$504.00',
    href: '/products/maidstone-23-inch-pedestal-sink-138-pds18?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783826518206&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776285573/websites-product-info-and-content/maidstone/product-info/Website/138-PDS18.jpg',
    handle: 'maidstone-23-inch-pedestal-sink-138-pds18'
  },
  {
    brand: 'MAIDSTONE',
    name: '19 Inch Pedestal Sink',
    price: '$509.00',
    href: '/products/maidstone-19-inch-pedestal-sink-138-pds19?pr_prod_strat=e5_desc&pr_rec_id=7688216d3&pr_rec_pid=8783837397182&pr_ref_pid=8783840936126&pr_seq=uniform',
    image: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1776188399/websites-product-info-and-content/maidstone/product-info/Website/138-PDS19-8D_v2.jpg',
    handle: 'maidstone-19-inch-pedestal-sink-138-pds19'
  }
]

const reviewPhotos: ProductReviewPhoto[] = [
  {
    src: relatedProducts[0]!.image,
    alt: 'Customer bath project with a pedestal sink and polished wall finish',
    author: 'M. Reynolds'
  },
  {
    src: relatedProducts[7]!.image,
    alt: 'Customer bathroom installation with a classic sink profile',
    author: 'Alder & Finch'
  },
  {
    src: relatedProducts[2]!.image,
    alt: 'Customer walkthrough video showing a completed bathroom sink wall',
    author: 'Westlake Build Studio',
    type: 'video',
    videoSrc: '/videos/eir-intelligent-toilet-demo.webm'
  },
  {
    src: relatedProducts[3]!.image,
    alt: 'Customer primary bath installation with a white ceramic sink',
    author: 'Northline Homes'
  },
  {
    src: relatedProducts[4]!.image,
    alt: 'Customer close photo of a white bathroom basin',
    author: 'L. Bennett'
  },
  {
    src: relatedProducts[5]!.image,
    alt: 'Customer bath project with traditional ceramic sink styling',
    author: 'Harbor Point Design'
  },
  {
    src: relatedProducts[6]!.image,
    alt: 'Customer installation detail for sink planning',
    author: 'Fieldstone Bath'
  },
  {
    src: relatedProducts[1]!.image,
    alt: 'Customer bathroom with white ceramic and metal accents',
    author: 'Everett Row Studio'
  },
  {
    src: relatedProducts[8]!.image,
    alt: 'Customer powder room remodel with compact sink placement',
    author: 'S. Calloway'
  },
  {
    src: relatedProducts[9]!.image,
    alt: 'Customer bathroom installation during project completion',
    author: 'Meridian Build'
  },
  {
    src: '/images/meilong-showroom-hero.png',
    alt: 'Customer showroom-style bathroom view in soft light',
    author: 'C. Whitman'
  },
  {
    src: '/images/meilong-calacatta-slab.png',
    alt: 'Customer finish material detail in bathroom light',
    author: 'Briar Lane Homes'
  },
  {
    src: relatedProducts[0]!.image,
    alt: 'Customer finish sample photo near a ceramic sink',
    author: 'R. Ellison'
  },
  {
    src: relatedProducts[1]!.image,
    alt: 'Customer chrome finish detail beside a bathroom sink',
    author: 'Oak & Mason'
  },
  {
    src: relatedProducts[2]!.image,
    alt: 'Customer dark frame detail in a bathroom project',
    author: 'Haven Contracting'
  },
  {
    src: relatedProducts[3]!.image,
    alt: 'Customer brushed nickel detail in natural bathroom light',
    author: 'G. Mercer'
  }
]

const baseProductReviews: ProductReview[] = [
  {
    author: 'M. Reynolds',
    region: 'United States, California',
    verifiedLabel: 'Verified buyer',
    date: 'Mar 18, 2026',
    rating: 5,
    title: 'Balanced scale for a larger vanity wall.',
    body:
      'The double bowl layout feels substantial without making the room heavy. The open console base keeps the floor visible, and the brass finish became a clear design detail in the finished bath.',
    media: [reviewPhotos[0]!, reviewPhotos[2]!, reviewPhotos[1]!, reviewPhotos[3]!, reviewPhotos[4]!, reviewPhotos[5]!, reviewPhotos[6]!],
    serviceReply: {
      author: 'Maidstone Customer Care',
      date: 'Mar 20, 2026',
      body:
        'Thank you for sharing your project details. We are glad the open console base worked well for the room, and we appreciate the note on the brass finish as a design detail.'
    },
    helpfulUp: 12,
    helpfulDown: 1
  },
  {
    author: 'Westlake Build Studio',
    region: 'Canada, Ontario',
    verifiedLabel: 'Trade partner',
    date: 'Feb 02, 2026',
    rating: 5,
    title: 'Specification packet was clear for planning.',
    body:
      'The specification sheet and dimension drawing gave our installer enough detail to confirm wall spacing, faucet spread, and rough-in locations before the product arrived on site.',
    media: [reviewPhotos[6]!, reviewPhotos[9]!],
    helpfulUp: 8,
    helpfulDown: 0
  },
  {
    author: 'Alder & Finch',
    region: 'United States, New York',
    verifiedLabel: 'Verified project',
    date: 'Jan 27, 2026',
    rating: 4,
    title: 'Looks refined, but planning the wall support matters.',
    body:
      'The finished installation has the lighter look we wanted. Our only note is that the wall anchoring and plumbing coordination need to be checked early because the open base leaves very little room to hide mistakes.',
    media: [reviewPhotos[1]!, reviewPhotos[7]!, reviewPhotos[8]!],
    serviceReply: {
      author: 'Maidstone Customer Care',
      date: 'Jan 29, 2026',
      body:
        'We appreciate the practical note. For this installation type, we always recommend reviewing the specification sheet with the installer before rough-in.'
    },
    helpfulUp: 19,
    helpfulDown: 2
  },
  {
    author: 'C. Whitman',
    region: 'United Kingdom, Surrey',
    verifiedLabel: 'Verified buyer',
    date: 'Dec 14, 2025',
    rating: 3,
    title: 'Beautiful finish, delivery packaging needed more care.',
    body:
      'The sink and frame look excellent after installation. One corner of the outer packaging arrived crushed, so we had to inspect everything carefully before accepting the delivery.',
    media: [reviewPhotos[10]!],
    serviceReply: {
      author: 'Maidstone Customer Care',
      date: 'Dec 16, 2025',
      body:
        'Thank you for documenting the delivery condition. We have shared this with our logistics team and are glad the product itself passed inspection before installation.'
    },
    helpfulUp: 7,
    helpfulDown: 3
  },
  {
    author: 'Haven Contracting',
    region: 'Australia, Victoria',
    verifiedLabel: 'Trade partner',
    date: 'Nov 06, 2025',
    rating: 2,
    title: 'Good product, but the site conditions were unforgiving.',
    body:
      'The product quality was not the issue. The rough-in on this renovation was too tight, and the console format made corrections more visible than a closed vanity would have.',
    media: [reviewPhotos[14]!, reviewPhotos[15]!],
    helpfulUp: 5,
    helpfulDown: 4
  },
  {
    author: 'R. Ellison',
    region: 'United States, Illinois',
    verifiedLabel: 'Verified buyer',
    date: 'Oct 21, 2025',
    rating: 1,
    title: 'Returned because the finish did not match our fixtures.',
    body:
      'The size was right, but the finish read warmer in our lighting than expected. We returned it and chose a different metal finish for the room.',
    media: [],
    serviceReply: {
      author: 'Maidstone Customer Care',
      date: 'Oct 23, 2025',
      body:
        'We are sorry the finish did not coordinate with your existing fixtures. Ordering finish samples before final selection can help confirm the tone under project lighting.'
    },
    helpfulUp: 3,
    helpfulDown: 1
  }
]

const targetReviewDistribution: Array<Pick<ReviewDistribution, 'rating' | 'count'>> = [
  { rating: 5, count: 34 },
  { rating: 4, count: 5 },
  { rating: 3, count: 1 },
  { rating: 2, count: 1 },
  { rating: 1, count: 1 }
]

const reviewMockAuthors = [
  ['N. Hartwell', 'United States, Texas', 'Verified buyer'],
  ['Studio Vale', 'United States, Florida', 'Trade partner'],
  ['Briar & Co.', 'Canada, British Columbia', 'Verified project'],
  ['K. Lawson', 'United States, Washington', 'Verified buyer'],
  ['Northshore Bath', 'United States, Massachusetts', 'Trade partner'],
  ['R. Okafor', 'United Kingdom, London', 'Verified buyer'],
  ['M. Sato', 'Japan, Tokyo', 'Verified project'],
  ['Elwood Interiors', 'Australia, New South Wales', 'Trade partner'],
  ['P. Anders', 'United States, Colorado', 'Verified buyer'],
  ['Linden Row Design', 'Canada, Quebec', 'Verified project'],
  ['A. Morrison', 'United States, Georgia', 'Verified buyer'],
  ['Cedar House Studio', 'United States, Oregon', 'Trade partner']
] as const

const fiveStarReviewCopy = [
  {
    title: 'Strong presence without feeling bulky.',
    body:
      'The proportion works well in a shared bath. It has enough visual weight to anchor the wall, but the open base keeps the room from feeling closed in.'
  },
  {
    title: 'The finish detail elevated the whole wall.',
    body:
      'We paired it with warm metal fixtures and the result feels intentional. The ceramic surface cleaned up easily after install and photographed beautifully for our project closeout.'
  },
  {
    title: 'Installer had everything needed from the drawings.',
    body:
      'The spec packet made the planning stage straightforward. Faucet spacing, overall width, and rough-in expectations were clear enough for our contractor to confirm before ordering.'
  },
  {
    title: 'Exactly the console look we wanted.',
    body:
      'We wanted something more architectural than a standard vanity. This gave the bath a tailored look while still leaving enough practical counter area around each bowl.'
  },
  {
    title: 'Feels appropriate for a high-use primary bath.',
    body:
      'Both bowls are comfortable to use at the same time, and the console frame keeps towels and cleaning access simple. It feels refined without becoming delicate.'
  },
  {
    title: 'Clean lines and a very balanced width.',
    body:
      'The 48 inch size landed well between two sconces. It gives the room symmetry and still leaves enough breathing room on both sides of the wall.'
  },
  {
    title: 'Good match for a classic renovation.',
    body:
      'We used it in an older home where a closed vanity looked too heavy. The console format kept the design period-friendly while still feeling current.'
  },
  {
    title: 'Worth planning around.',
    body:
      'This is not a last-minute swap, but once the wall blocking and plumbing were coordinated, the finished result looked very polished.'
  }
]

const fourStarReviewCopy = [
  {
    title: 'Beautiful result, measure twice.',
    body:
      'The product looks excellent installed. I would only stress that the rough-in and wall support should be verified early because the open frame leaves no room for sloppy alignment.'
  },
  {
    title: 'Elegant, but schedule the install carefully.',
    body:
      'The sink itself met expectations. Delivery timing and coordination with the plumber mattered more than with a simple vanity, so it needs a little extra planning.'
  },
  {
    title: 'Great style with a few practical considerations.',
    body:
      'The console makes the bathroom feel larger, but exposed plumbing choices become more visible. Once we selected the right finish, the final look was worth it.'
  },
  {
    title: 'Very good for design-forward projects.',
    body:
      'Clients loved the finished presence. The only reason it is not a full five for us is that the installation sequence needs to be tightly managed.'
  }
]

const generatedReviewDates = [
  'Jun 28, 2026',
  'Jun 19, 2026',
  'Jun 07, 2026',
  'May 26, 2026',
  'May 13, 2026',
  'Apr 30, 2026',
  'Apr 18, 2026',
  'Apr 05, 2026',
  'Mar 29, 2026',
  'Mar 11, 2026',
  'Feb 24, 2026',
  'Feb 15, 2026'
]

// Builds demo review records from the target distribution so list content, totals, and rating bars stay in sync.
function createGeneratedReview(rating: number, index: number): ProductReview {
  const author = reviewMockAuthors[index % reviewMockAuthors.length]!
  const copyPool = rating >= 5 ? fiveStarReviewCopy : fourStarReviewCopy
  const copy = copyPool[index % copyPool.length]!
  const mediaStart = (index * 2) % reviewPhotos.length
  const mediaCount = index % 4 === 0 ? 3 : index % 3 === 0 ? 2 : 1
  const media = Array.from({ length: mediaCount }, (_, mediaIndex) => reviewPhotos[(mediaStart + mediaIndex) % reviewPhotos.length]!)

  return {
    author: author[0],
    region: author[1],
    verifiedLabel: author[2],
    date: generatedReviewDates[index % generatedReviewDates.length]!,
    rating,
    title: copy.title,
    body: copy.body,
    media,
    serviceReply:
      index % 5 === 0
        ? {
            author: 'Maidstone Customer Care',
            date: generatedReviewDates[(index + 1) % generatedReviewDates.length]!,
            body:
              'Thank you for sharing the project notes. We appreciate the installation context and are glad the finished space met the design intent.'
          }
        : undefined,
    helpfulUp: 4 + ((index * 3) % 18),
    helpfulDown: index % 4
  }
}

// Expands the authored seed reviews to the visible demo total while preserving the intended rating mix.
function buildProductReviews(): ProductReview[] {
  const reviews = [...baseProductReviews]

  targetReviewDistribution.forEach((target) => {
    const existingCount = reviews.filter((review) => review.rating === target.rating).length
    const missingCount = Math.max(target.count - existingCount, 0)

    for (let index = 0; index < missingCount; index += 1) {
      reviews.push(createGeneratedReview(target.rating, reviews.length + index))
    }
  })

  return reviews
}

const productReviews: ProductReview[] = buildProductReviews()

const productQuestions: ProductQuestion[] = [
  {
    question: 'Does this console sink include the metal base?',
    answer:
      'Yes. The product is configured as a console table bathroom sink with the vitreous china top and matching console legs for the selected finish.'
  },
  {
    question: 'Can the double bowl top support two widespread faucets?',
    answer:
      'Yes. Each bowl is drilled for an 8-inch widespread faucet, so the installation can support two matching faucet sets.'
  },
  {
    question: 'Where should installers confirm rough-in dimensions?',
    answer:
      'Use the specification sheet and dimension drawing in the resources section before wall preparation or plumbing rough-in.'
  }
]

const reviewSortOptions: Array<{ value: ReviewSortOption; label: string }> = [
  { value: 'highest', label: 'Highest rating' },
  { value: 'recent', label: 'Most recent' },
  { value: 'lowest', label: 'Lowest rating' }
]

const reviewCountryCodes = [
  'AF',
  'AX',
  'AL',
  'DZ',
  'AS',
  'AD',
  'AO',
  'AI',
  'AQ',
  'AG',
  'AR',
  'AM',
  'AW',
  'AU',
  'AT',
  'AZ',
  'BS',
  'BH',
  'BD',
  'BB',
  'BY',
  'BE',
  'BZ',
  'BJ',
  'BM',
  'BT',
  'BO',
  'BQ',
  'BA',
  'BW',
  'BV',
  'BR',
  'IO',
  'BN',
  'BG',
  'BF',
  'BI',
  'CV',
  'KH',
  'CM',
  'CA',
  'KY',
  'CF',
  'TD',
  'CL',
  'CN',
  'CX',
  'CC',
  'CO',
  'KM',
  'CG',
  'CD',
  'CK',
  'CR',
  'CI',
  'HR',
  'CU',
  'CW',
  'CY',
  'CZ',
  'DK',
  'DJ',
  'DM',
  'DO',
  'EC',
  'EG',
  'SV',
  'GQ',
  'ER',
  'EE',
  'SZ',
  'ET',
  'FK',
  'FO',
  'FJ',
  'FI',
  'FR',
  'GF',
  'PF',
  'TF',
  'GA',
  'GM',
  'GE',
  'DE',
  'GH',
  'GI',
  'GR',
  'GL',
  'GD',
  'GP',
  'GU',
  'GT',
  'GG',
  'GN',
  'GW',
  'GY',
  'HT',
  'HM',
  'VA',
  'HN',
  'HK',
  'HU',
  'IS',
  'IN',
  'ID',
  'IR',
  'IQ',
  'IE',
  'IM',
  'IL',
  'IT',
  'JM',
  'JP',
  'JE',
  'JO',
  'KZ',
  'KE',
  'KI',
  'KP',
  'KR',
  'KW',
  'KG',
  'LA',
  'LV',
  'LB',
  'LS',
  'LR',
  'LY',
  'LI',
  'LT',
  'LU',
  'MO',
  'MG',
  'MW',
  'MY',
  'MV',
  'ML',
  'MT',
  'MH',
  'MQ',
  'MR',
  'MU',
  'YT',
  'MX',
  'FM',
  'MD',
  'MC',
  'MN',
  'ME',
  'MS',
  'MA',
  'MZ',
  'MM',
  'NA',
  'NR',
  'NP',
  'NL',
  'NC',
  'NZ',
  'NI',
  'NE',
  'NG',
  'NU',
  'NF',
  'MK',
  'MP',
  'NO',
  'OM',
  'PK',
  'PW',
  'PS',
  'PA',
  'PG',
  'PY',
  'PE',
  'PH',
  'PN',
  'PL',
  'PT',
  'PR',
  'QA',
  'RE',
  'RO',
  'RU',
  'RW',
  'BL',
  'SH',
  'KN',
  'LC',
  'MF',
  'PM',
  'VC',
  'WS',
  'SM',
  'ST',
  'SA',
  'SN',
  'RS',
  'SC',
  'SL',
  'SG',
  'SX',
  'SK',
  'SI',
  'SB',
  'SO',
  'ZA',
  'GS',
  'SS',
  'ES',
  'LK',
  'SD',
  'SR',
  'SJ',
  'SE',
  'CH',
  'SY',
  'TW',
  'TJ',
  'TZ',
  'TH',
  'TL',
  'TG',
  'TK',
  'TO',
  'TT',
  'TN',
  'TR',
  'TM',
  'TC',
  'TV',
  'UG',
  'UA',
  'AE',
  'GB',
  'UM',
  'US',
  'UY',
  'UZ',
  'VU',
  'VE',
  'VN',
  'VG',
  'VI',
  'WF',
  'EH',
  'YE',
  'ZM',
  'ZW'
]

const reviewCountryDisplay = new Intl.DisplayNames(['en'], { type: 'region' })
const reviewCountryOptions = reviewCountryCodes.map((code) => `${code} - ${reviewCountryDisplay.of(code) ?? code}`)

const selectedVariant = ref<ProductVariant>(variants[0]!)
const quantity = ref(1)
const isGalleryOpen = ref(false)
const activeGalleryIndex = ref(0)
const isGalleryZoomed = ref(false)
const galleryZoomScale = ref(1)
const galleryZoomOrigin = ref('50% 50%')
const galleryPanX = ref(0)
const galleryPanY = ref(0)
const isGalleryPanning = ref(false)
const isGalleryPinching = ref(false)
const isGalleryPlaying = ref(false)
const isGalleryFullscreen = ref(false)
const areGalleryThumbsVisible = ref(true)
const isActiveGalleryVideoPlaying = ref(false)
const isGallerySwiping = ref(false)
const isGallerySlideAnimating = ref(false)
const shouldAnimateGalleryImageIntro = ref(true)
const gallerySwipeX = ref(0)
const gallerySlideStep = ref(0)
const galleryStageWidth = ref(0)
const galleryPanel = ref<HTMLElement | null>(null)
const galleryThumbRail = ref<HTMLElement | null>(null)
const relatedProductRail = ref<HTMLElement | null>(null)
const reviewMediaThumbRail = ref<HTMLElement | null>(null)
const relatedRailProgress = ref(0)
const isRelatedRailDragging = ref(false)
const activeReviewTab = ref<ReviewTab>('reviews')
const selectedReviewRating = ref<number | null>(null)
const reviewSortOption = ref<ReviewSortOption>('highest')
const isReviewSortOpen = ref(false)
const visibleReviewCount = ref(reviewPageSize)
const isReviewLoadingMore = ref(false)
const isReviewPhotoGalleryOpen = ref(false)
const activeReviewMediaItems = ref<ProductReviewPhoto[]>(reviewPhotos)
const activeReviewMediaIndex = ref(0)
const activeReviewMediaReview = ref<ProductReview | null>(null)
const isReviewSubmissionOpen = ref(false)
const reviewSubmissionMode = ref<ReviewSubmissionMode>('review')
const reviewSubmissionStep = ref<ReviewSubmissionStep>('form')
const isReviewSubmissionSubmitting = ref(false)
const reviewSubmissionHoverRating = ref(0)
const isReviewCountryOpen = ref(false)
const reviewSubmissionForm = ref<ReviewSubmissionForm>({
  rating: 0,
  title: '',
  body: '',
  name: '',
  email: '',
  region: '',
  question: '',
  notify: true
})
const reviewSubmissionMediaFiles = ref<string[]>([])
const reviewSubmissionErrors = ref<Partial<Record<ReviewSubmissionErrorKey, string>>>({})
const openProductAccordionIds = ref(['description', 'highlights'])
const isShareCopied = ref(false)
const isProductShareOpen = ref(false)
let gallerySlideshowTimer: number | undefined
let gallerySwipeCommitTimer: number | undefined
let shareCopiedTimer: number | undefined
let reviewLoadMoreTimer: number | undefined
const galleryPlaybackKey = ref(0)
const galleryScrollLockState = {
  locked: false,
  scrollY: 0
}
const galleryGesturePointers = new Map<number, { startX: number; startY: number; x: number; y: number }>()
const galleryThumbDrag = {
  active: false,
  pointerId: 0,
  startX: 0,
  scrollLeft: 0,
  moved: false,
  captured: false
}
const reviewMediaThumbDrag = {
  active: false,
  pointerId: 0,
  startX: 0,
  scrollLeft: 0,
  moved: false,
  captured: false
}
const galleryImageDrag = {
  active: false,
  pointerId: 0,
  startX: 0,
  startY: 0,
  panX: 0,
  panY: 0,
  moved: false,
  captured: false
}
const relatedRailDrag = {
  active: false,
  pointerId: 0,
  startX: 0,
  scrollLeft: 0,
  moved: false,
  suppressClick: false
}
const galleryPinchGesture = {
  active: false,
  startDistance: 0,
  startScale: 1
}
const featuredGalleryImages = computed(() => galleryImages.slice(0, 5))
const hiddenGalleryCount = computed(() => Math.max(galleryImages.length - featuredGalleryImages.value.length, 0))
const featuredReviewPhotos = computed(() => reviewPhotos.slice(0, 6))
const reviewTotal = computed(() => productReviews.length)
const reviewAverage = computed(() => {
  if (!reviewTotal.value) {
    return 0
  }

  return productReviews.reduce((total, review) => total + review.rating, 0) / reviewTotal.value
})
const reviewAverageLabel = computed(() => reviewAverage.value.toFixed(1))
const reviewDistribution = computed<ReviewDistribution[]>(() => {
  const total = reviewTotal.value

  return [5, 4, 3, 2, 1].map((rating) => {
    const count = productReviews.filter((review) => review.rating === rating).length

    return {
      rating,
      count,
      percent: total ? (count / total) * 100 : 0
    }
  })
})
const filteredReviews = computed(() => {
  const matchedReviews = productReviews.filter((review) => {
    return selectedReviewRating.value === null || review.rating === selectedReviewRating.value
  })

  return [...matchedReviews].sort((a, b) => {
    if (reviewSortOption.value === 'lowest') {
      return a.rating - b.rating
    }

    if (reviewSortOption.value === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }

    return b.rating - a.rating
  })
})
const reviewSortLabel = computed(() => reviewSortOptions.find((option) => option.value === reviewSortOption.value)?.label ?? 'Sort reviews')
const visibleReviews = computed(() => filteredReviews.value.slice(0, visibleReviewCount.value))
const visibleReviewTotal = computed(() => Math.min(visibleReviewCount.value, filteredReviews.value.length))
const canLoadMoreReviews = computed(() => visibleReviewCount.value < filteredReviews.value.length)
const activeReviewMedia = computed(() => activeReviewMediaItems.value[activeReviewMediaIndex.value] ?? activeReviewMediaItems.value[0] ?? reviewPhotos[0]!)
const activeReviewMediaContext = computed(() => activeReviewMediaReview.value ?? findReviewForMedia(activeReviewMedia.value))
const activeReviewMediaAuthorName = computed(() => activeReviewMediaContext.value?.author ?? activeReviewMedia.value.author)
const activeReviewMediaAuthorInitials = computed(() => getReviewAuthorInitials(activeReviewMediaAuthorName.value))
const reviewSubmissionTitle = computed(() => (
  reviewSubmissionMode.value === 'review' ? 'Write a review' : 'Ask a question'
))
const reviewSubmissionIntro = computed(() => (
  reviewSubmissionMode.value === 'review'
    ? 'Share your project experience. Reviews are screened before they appear on the product page.'
    : 'Send a product question to the Maidstone support team. Published answers appear in the Q&A section.'
))
const reviewSubmissionSuccessTitle = computed(() => (
  reviewSubmissionMode.value === 'review' ? 'Review received' : 'Question received'
))
const reviewSubmissionSuccessCopy = computed(() => (
  reviewSubmissionMode.value === 'review'
    ? 'Thanks for sharing your project. This demo submission is marked pending approval; the OES review queue will handle real moderation later.'
    : 'Thanks for the question. This demo submission is marked for the support queue; the OES Q&A workflow will publish real answers later.'
))
const filteredReviewCountryOptions = computed(() => {
  const query = reviewSubmissionForm.value.region.trim().toLowerCase()

  if (!query) {
    return reviewCountryOptions
  }

  return reviewCountryOptions.filter((country) => country.toLowerCase().includes(query))
})
const reviewSubmissionMediaSummary = computed(() => {
  if (!reviewSubmissionMediaFiles.value.length) {
    return 'No media selected'
  }

  return reviewSubmissionMediaFiles.value.length === 1
    ? reviewSubmissionMediaFiles.value[0]
    : `${reviewSubmissionMediaFiles.value.length} files selected`
})
const activeGalleryMedia = computed(() => galleryImages[activeGalleryIndex.value] ?? galleryImages[0]!)
const activeGalleryVideo = computed(() => (isVideoMedia(activeGalleryMedia.value) ? activeGalleryMedia.value : null))
// Provides fixed PDP highlight media until OES serves structured highlight blocks.
const productHighlightImages = computed(() => [
  {
    src: getGalleryMediaImage(galleryImages[4]!, 4),
    label: 'Close detail of the console sink basin and brass fitting'
  },
  {
    src: getGalleryMediaImage(galleryImages[3]!, 3),
    label: 'Installed console sink room view'
  },
  {
    src: getGalleryMediaImage(galleryImages[8]!, 8),
    label: 'Included console sink parts and hardware'
  }
])
const adjacentGalleryMedia = computed(() => {
  if (gallerySlideStep.value === 0) {
    return null
  }
  const nextIndex = (activeGalleryIndex.value + gallerySlideStep.value + galleryImages.length) % galleryImages.length
  return galleryImages[nextIndex] ?? null
})
const adjacentGalleryMediaIndex = computed(() => {
  if (gallerySlideStep.value === 0) {
    return activeGalleryIndex.value
  }
  return (activeGalleryIndex.value + gallerySlideStep.value + galleryImages.length) % galleryImages.length
})
const certificateBadges = [
  {
    label: 'cUPC certified',
    logo: 'https://iapmort.org/media/cu3d3hlf/c-upc.gif?rmode=max&width=260&height=252'
  },
  {
    label: 'IAPMO listed',
    logo: 'https://iapmort.org/media/wlrdszs4/c-iapmo-rt-r.gif?rmode=max&width=260&height=254'
  },
  {
    label: 'Accessible design',
    logo: '/images/certificates/international-symbol-of-access.svg'
  }
]

// Tracks each PDP summary accordion independently so open and close states can animate smoothly.
function isProductAccordionOpen(id: string) {
  return openProductAccordionIds.value.includes(id)
}

// Toggles a product information accordion without relying on the browser's instant details rendering.
function toggleProductAccordion(id: string) {
  openProductAccordionIds.value = isProductAccordionOpen(id)
    ? openProductAccordionIds.value.filter((openId) => openId !== id)
    : [...openProductAccordionIds.value, id]
}

// Identifies video media so the lightbox can switch from image zooming to playable video rendering.
function isVideoMedia(media: ProductMedia): media is ProductVideo {
  return media.type === 'video'
}

// Resolves the thumbnail or lead image used for a mixed image/video media item.
function getGalleryMediaImage(media: ProductMedia, index: number) {
  if (isVideoMedia(media)) {
    return media.poster
  }
  return index === 0 ? selectedVariant.value.image : media.src
}

// Uses same-origin print image URLs so Chrome PDF output does not drop third-party product pixels.
function getGalleryPrintMediaImage(media: ProductMedia, index: number) {
  return `/api/print-image?src=${encodeURIComponent(getGalleryMediaImage(media, index))}`
}

// Waits for the browser to paint the updated image sources before opening native print preview.
function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve())
    })
  })
}

// Starts the active video player from the local poster state instead of relying on iframe srcdoc navigation.
function playActiveGalleryVideo() {
  isGalleryPlaying.value = false
  isActiveGalleryVideoPlaying.value = true
}

// Selects the active sellable configuration and syncs the lead gallery image to match the finish.
function selectVariant(variant: ProductVariant) {
  selectedVariant.value = variant
}

// Keeps quantity changes bounded to the same compact stepper behavior as the reference PDP.
function updateQuantity(nextQuantity: number) {
  quantity.value = Math.max(1, Math.min(9, nextQuantity))
}

// Moves the related-product rail by one viewport so desktop and mobile browsing remain lightweight.
function scrollRelatedProducts(direction: 1 | -1) {
  const rail = relatedProductRail.value
  if (!rail) {
    return
  }

  const card = rail.querySelector<HTMLElement>('.kpdp-related-card')
  const cardStep = card ? card.offsetWidth + 20 : 411

  rail.scrollBy({
    left: direction * cardStep,
    behavior: 'smooth'
  })
}

// Syncs the product rail progress bar with the carousel scroll position.
function updateRelatedProductProgress() {
  const rail = relatedProductRail.value
  if (!rail) {
    relatedRailProgress.value = 0
    return
  }

  const maxScroll = rail.scrollWidth - rail.clientWidth
  relatedRailProgress.value = maxScroll > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / maxScroll)) : 1
}

// Starts a mouse or pen drag on the related-product rail while preserving native touch scrolling.
function handleRelatedRailPointerDown(event: PointerEvent) {
  if (event.pointerType === 'touch') return

  const rail = relatedProductRail.value
  const target = event.target as HTMLElement | null
  if (!rail || target?.closest('button, input, label')) {
    return
  }

  relatedRailDrag.active = true
  relatedRailDrag.pointerId = event.pointerId
  relatedRailDrag.startX = event.clientX
  relatedRailDrag.scrollLeft = rail.scrollLeft
  relatedRailDrag.moved = false
  relatedRailDrag.suppressClick = false
  isRelatedRailDragging.value = true
  window.addEventListener('pointermove', handleRelatedRailPointerMove)
  window.addEventListener('pointerup', handleRelatedRailPointerEnd)
  window.addEventListener('pointercancel', handleRelatedRailPointerEnd)
  rail.setPointerCapture?.(event.pointerId)
}

// Converts horizontal pointer movement into carousel scroll and marks link clicks as drag gestures.
function handleRelatedRailPointerMove(event: PointerEvent) {
  const rail = relatedProductRail.value
  if (!rail || !relatedRailDrag.active || event.pointerId !== relatedRailDrag.pointerId) {
    return
  }

  const deltaX = event.clientX - relatedRailDrag.startX
  if (Math.abs(deltaX) > 6) {
    relatedRailDrag.moved = true
    relatedRailDrag.suppressClick = true
  }

  if (!relatedRailDrag.moved) {
    return
  }

  rail.scrollLeft = relatedRailDrag.scrollLeft - deltaX
  updateRelatedProductProgress()
  event.preventDefault()
}

// Ends related-product dragging and briefly suppresses the click generated by a completed drag.
function handleRelatedRailPointerEnd(event: PointerEvent) {
  const rail = relatedProductRail.value
  if (!relatedRailDrag.active || event.pointerId !== relatedRailDrag.pointerId) {
    return
  }

  relatedRailDrag.active = false
  isRelatedRailDragging.value = false
  window.removeEventListener('pointermove', handleRelatedRailPointerMove)
  window.removeEventListener('pointerup', handleRelatedRailPointerEnd)
  window.removeEventListener('pointercancel', handleRelatedRailPointerEnd)
  rail?.releasePointerCapture?.(event.pointerId)

  if (relatedRailDrag.moved) {
    window.setTimeout(() => {
      relatedRailDrag.suppressClick = false
    }, 0)
  }
}

// Prevents product navigation when a rail drag starts on a product link or image.
function handleRelatedRailClick(event: MouseEvent) {
  if (!relatedRailDrag.suppressClick) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
}

// Switches the combined review area between customer reviews and product questions.
function setReviewTab(tab: ReviewTab) {
  activeReviewTab.value = tab
  isReviewSortOpen.value = false
}

function toggleReviewRating(rating: number) {
  selectedReviewRating.value = selectedReviewRating.value === rating ? null : rating
}

// Selects the visible review ordering from the custom PDP sort menu.
function selectReviewSortOption(option: ReviewSortOption) {
  reviewSortOption.value = option
  isReviewSortOpen.value = false
}

// Clears a single inline validation message once the shopper edits that field.
function clearReviewSubmissionError(key: ReviewSubmissionErrorKey) {
  if (!reviewSubmissionErrors.value[key]) {
    return
  }

  const nextErrors = { ...reviewSubmissionErrors.value }
  delete nextErrors[key]
  reviewSubmissionErrors.value = nextErrors
}

// Applies a country selection from the custom searchable country list.
function selectReviewCountry(country: string) {
  reviewSubmissionForm.value.region = country
  isReviewCountryOpen.value = false
}

// Validates contact and review/Q&A fields before the mock submission flow can advance.
function validateReviewSubmissionForm() {
  const form = reviewSubmissionForm.value
  const nextErrors: Partial<Record<ReviewSubmissionErrorKey, string>> = {}
  const normalizedEmail = form.email.trim()
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

  if (!form.name.trim()) {
    nextErrors.name = 'Enter your name.'
  }

  if (!normalizedEmail) {
    nextErrors.email = 'Enter your email.'
  } else if (!hasValidEmail) {
    nextErrors.email = 'Enter a valid email address.'
  }

  if (reviewSubmissionMode.value === 'review') {
    if (form.rating <= 0) {
      nextErrors.rating = 'Select a rating.'
    }

    if (!form.title.trim()) {
      nextErrors.title = 'Enter a review title.'
    }

    if (!form.body.trim()) {
      nextErrors.body = 'Enter your review.'
    }
  } else if (!form.question.trim()) {
    nextErrors.question = 'Enter your question.'
  }

  const mediaError = reviewSubmissionErrors.value.media
  reviewSubmissionErrors.value = mediaError
    ? { ...nextErrors, media: mediaError }
    : nextErrors

  return Object.keys(nextErrors).length === 0 && !mediaError
}

// Accepts only common image/video uploads that fit the PDP review demo limits.
function validateReviewSubmissionMedia(files: File[]) {
  if (files.length > reviewSubmissionMaxMediaFiles) {
    return `Upload up to ${reviewSubmissionMaxMediaFiles} files.`
  }

  const unsupportedFile = files.find((file) => {
    const normalizedName = file.name.toLowerCase()
    const hasAcceptedType = Boolean(file.type) && reviewSubmissionAcceptedMediaTypes.includes(file.type)
    const hasAcceptedExtension = reviewSubmissionAcceptedMediaExtensions.some((extension) => normalizedName.endsWith(extension))

    return !hasAcceptedType && !hasAcceptedExtension
  })
  if (unsupportedFile) {
    return 'Use JPG, PNG, WebP, HEIC, GIF, MP4, WebM, or MOV files.'
  }

  const oversizedFile = files.find((file) => file.size > reviewSubmissionMaxMediaSizeBytes)
  if (oversizedFile) {
    return `Each file must be ${reviewSubmissionMaxMediaSizeMb}MB or smaller.`
  }

  return ''
}

// Resets the mock submission form when switching between review and Q&A entry points.
function resetReviewSubmissionForm(mode: ReviewSubmissionMode) {
  reviewSubmissionForm.value = {
    rating: 0,
    title: '',
    body: '',
    name: '',
    email: '',
    region: '',
    question: '',
    notify: mode === 'question'
  }
  reviewSubmissionHoverRating.value = 0
  isReviewCountryOpen.value = false
  reviewSubmissionMediaFiles.value = []
  reviewSubmissionErrors.value = {}
}

// Opens the shared PDP submission modal in either review or product-question mode.
function openReviewSubmission(mode: ReviewSubmissionMode) {
  reviewSubmissionMode.value = mode
  reviewSubmissionStep.value = 'form'
  isReviewSubmissionSubmitting.value = false
  resetReviewSubmissionForm(mode)
  isReviewSubmissionOpen.value = true
}

// Closes the mock submission modal without mutating the displayed review/Q&A lists.
function closeReviewSubmission() {
  isReviewSubmissionOpen.value = false
  isReviewSubmissionSubmitting.value = false
  reviewSubmissionHoverRating.value = 0
  isReviewCountryOpen.value = false
  reviewSubmissionErrors.value = {}
}

// Simulates submission success until OES provides the moderated review/Q&A backend workflow.
function submitReviewSubmission() {
  if (isReviewSubmissionSubmitting.value) {
    return
  }

  if (!validateReviewSubmissionForm()) {
    return
  }

  isReviewSubmissionSubmitting.value = true
  window.setTimeout(() => {
    isReviewSubmissionSubmitting.value = false
    reviewSubmissionStep.value = 'success'
  }, 680)
}

// Mirrors selected upload names into a styled English control instead of showing the browser-native file input text.
function handleReviewSubmissionMediaChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const files = Array.from(input?.files ?? [])
  const mediaError = validateReviewSubmissionMedia(files)

  if (mediaError) {
    reviewSubmissionMediaFiles.value = []
    reviewSubmissionErrors.value = {
      ...reviewSubmissionErrors.value,
      media: mediaError
    }

    if (input) {
      input.value = ''
    }

    return
  }

  clearReviewSubmissionError('media')
  reviewSubmissionMediaFiles.value = files.map((file) => file.name)
}

// Releases the shared scroll lock after the review/Q&A submission dialog leaves.
function handleReviewSubmissionAfterLeave() {
  if (!isGalleryOpen.value && !isReviewPhotoGalleryOpen.value) {
    syncGalleryScrollLock(false)
  }
}

// Reveals the next fixed-size batch of reviews without changing the active filters.
function loadMoreReviews() {
  if (isReviewLoadingMore.value || !canLoadMoreReviews.value) {
    return
  }

  isReviewLoadingMore.value = true
  reviewLoadMoreTimer = window.setTimeout(() => {
    visibleReviewCount.value = Math.min(visibleReviewCount.value + reviewPageSize, filteredReviews.value.length)
    isReviewLoadingMore.value = false
    reviewLoadMoreTimer = undefined
  }, 760)
}

// Cancels a pending review batch reveal when filters change or the component unmounts.
function clearReviewLoadMoreTimer() {
  if (reviewLoadMoreTimer) {
    window.clearTimeout(reviewLoadMoreTimer)
    reviewLoadMoreTimer = undefined
  }
  isReviewLoadingMore.value = false
}

// Builds the compact initials badge used by the review media modal author header.
function getReviewAuthorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

// Finds the review that owns a media item so global customer-photo browsing still shows the matching review copy.
function findReviewForMedia(media: ProductReviewPhoto) {
  return productReviews.find((review) => review.media.some((item) => item === media || (
    item.src === media.src &&
    item.author === media.author &&
    item.videoSrc === media.videoSrc
  ))) ?? null
}

// Opens the review media viewer from either the global customer strip or a specific review.
function openReviewPhotoGallery(mediaItems: ProductReviewPhoto[] = reviewPhotos, index = 0, review: ProductReview | null = null) {
  activeReviewMediaItems.value = mediaItems.length ? mediaItems : reviewPhotos
  activeReviewMediaIndex.value = Math.max(0, Math.min(activeReviewMediaItems.value.length - 1, index))
  activeReviewMediaReview.value = review
  isReviewPhotoGalleryOpen.value = true
}

// Closes the customer photo browser without disturbing the main PDP gallery state.
function closeReviewPhotoGallery() {
  isReviewPhotoGalleryOpen.value = false
}

// Moves within the active review media set without closing the dialog.
function moveReviewMedia(step: number) {
  const mediaCount = activeReviewMediaItems.value.length
  if (mediaCount < 2) {
    return
  }
  activeReviewMediaIndex.value = (activeReviewMediaIndex.value + step + mediaCount) % mediaCount
}

// Selects a media thumbnail inside the review viewer.
function selectReviewMedia(index: number) {
  activeReviewMediaIndex.value = Math.max(0, Math.min(activeReviewMediaItems.value.length - 1, index))
}

// Starts mouse or pen drag-to-scroll for review media thumbnails without selecting one immediately.
function startReviewMediaThumbDrag(event: PointerEvent) {
  if (event.pointerType === 'touch') return

  if (!reviewMediaThumbRail.value || (event.pointerType === 'mouse' && event.button !== 0)) {
    return
  }
  reviewMediaThumbDrag.active = true
  reviewMediaThumbDrag.pointerId = event.pointerId
  reviewMediaThumbDrag.startX = event.clientX
  reviewMediaThumbDrag.scrollLeft = reviewMediaThumbRail.value.scrollLeft
  reviewMediaThumbDrag.moved = false
  reviewMediaThumbDrag.captured = false
}

// Converts horizontal pointer movement into scroll on the review media thumbnail strip.
function moveReviewMediaThumbDrag(event: PointerEvent) {
  if (!reviewMediaThumbDrag.active || !reviewMediaThumbRail.value || event.pointerId !== reviewMediaThumbDrag.pointerId) {
    return
  }
  const deltaX = event.clientX - reviewMediaThumbDrag.startX
  if (Math.abs(deltaX) > 3) {
    reviewMediaThumbDrag.moved = true
    if (!reviewMediaThumbDrag.captured) {
      reviewMediaThumbRail.value.setPointerCapture(event.pointerId)
      reviewMediaThumbDrag.captured = true
    }
  }
  if (reviewMediaThumbDrag.moved) {
    reviewMediaThumbRail.value.scrollLeft = reviewMediaThumbDrag.scrollLeft - deltaX
  }
}

// Ends review media thumbnail drag and releases pointer capture when needed.
function endReviewMediaThumbDrag(event: PointerEvent) {
  if (!reviewMediaThumbDrag.active || !reviewMediaThumbRail.value || event.pointerId !== reviewMediaThumbDrag.pointerId) {
    return
  }
  reviewMediaThumbDrag.active = false
  if (reviewMediaThumbDrag.captured && reviewMediaThumbRail.value.hasPointerCapture(event.pointerId)) {
    reviewMediaThumbRail.value.releasePointerCapture(event.pointerId)
  }
  reviewMediaThumbDrag.captured = false
}

// Selects a review media thumbnail unless the pointer gesture was a drag.
function selectReviewMediaFromThumb(index: number) {
  if (reviewMediaThumbDrag.moved) {
    reviewMediaThumbDrag.moved = false
    return
  }
  selectReviewMedia(index)
}

// Preloads the print-only gallery images before opening the native print preview.
async function preloadProductPrintImages() {
  const imageSources = featuredGalleryImages.value
    .slice(0, 5)
    .map((media, index) => getGalleryPrintMediaImage(media, index))

  await nextTick()

  await Promise.allSettled(imageSources.map((src) => new Promise<void>((resolve) => {
    const image = new Image()
    let isResolved = false
    const finish = () => {
      if (isResolved) {
        return
      }
      isResolved = true
      resolve()
    }
    window.setTimeout(finish, 2500)
    image.loading = 'eager'
    image.onload = finish
    image.onerror = finish
    image.src = src
    if (image.decode) {
      image.decode().then(finish).catch(finish)
    }
  })))

  const printImages = Array.from(document.querySelectorAll<HTMLImageElement>('.kpdp-print-gallery img'))
  await Promise.allSettled(printImages.map((image) => {
    if (image.complete && image.naturalWidth > 0) {
      return image.decode ? image.decode().catch(() => undefined) : Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      let isResolved = false
      const finish = () => {
        if (isResolved) {
          return
        }
        isResolved = true
        resolve()
      }
      window.setTimeout(finish, 2500)
      image.onload = finish
      image.onerror = finish
    })
  }))

  await waitForNextPaint()
}

// Opens the browser print dialog after print-only images are ready for PDF capture.
async function printProductPage() {
  if (import.meta.server) {
    return
  }
  isProductShareOpen.value = false
  await preloadProductPrintImages()
  window.print()
}

// Toggles the PDP share popover that contains the full social sharing actions.
function toggleProductShare() {
  isProductShareOpen.value = !isProductShareOpen.value
}

// Supplies the current PDP product and selected finish to the shared guest-commerce boundary.
function currentCommerceProduct() {
  return {
    productKey: 'kohler-claude-console-table-bathroom-sink',
    title: 'Claude by Studio McGee',
    href: '/products/maidstone-20-inch-pedestal-sink-4-inch-faucet-center-138-pds21-4d',
    image: selectedVariant.value.image,
    price: selectedVariant.value.price,
    variantKey: selectedVariant.value.sku,
    variantLabel: selectedVariant.value.label,
  }
}

// Adds the selected sellable finish and quantity before revealing the Cart as immediate guest feedback.
function addCurrentProductToCart() {
  addToCart(currentCommerceProduct(), quantity.value)
  openGuestCommerceDrawer('cart')
}

// Copies the current product URL so the PDP share action stays lightweight and dependency-free.
async function copyProductLink() {
  if (import.meta.server) {
    return
  }
  if (shareCopiedTimer) {
    window.clearTimeout(shareCopiedTimer)
  }

  let copied = false
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(window.location.href)
      copied = true
    } catch {
      copied = false
    }
  }

  if (!copied) {
    try {
      const fallbackInput = document.createElement('textarea')
      fallbackInput.value = window.location.href
      fallbackInput.setAttribute('readonly', 'true')
      fallbackInput.style.position = 'fixed'
      fallbackInput.style.opacity = '0'
      document.body.append(fallbackInput)
      fallbackInput.select()
      copied = document.execCommand('copy')
      fallbackInput.remove()
    } catch {
      copied = false
    }
  }
  isShareCopied.value = copied

  shareCopiedTimer = window.setTimeout(() => {
    isShareCopied.value = false
    shareCopiedTimer = undefined
  }, 1800)
}

// Opens lightweight social share targets while preserving the local copy-link fallback.
function shareProduct(platform: 'facebook' | 'pinterest' | 'x' | 'email') {
  if (import.meta.server) {
    return
  }
  isProductShareOpen.value = false
  const url = window.location.href
  const title = document.title
  const shareTargets = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    pinterest: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
  }
  if (platform === 'email') {
    window.location.href = shareTargets.email
    return
  }
  window.open(shareTargets[platform], '_blank', 'noopener,noreferrer,width=760,height=640')
}

// Opens the full media browser at a specific item while the PDP keeps the compact five-block layout.
function openGallery(index = 0) {
  clearGallerySwipeCommitTimer()
  activeGalleryIndex.value = Math.max(0, Math.min(galleryImages.length - 1, index))
  shouldAnimateGalleryImageIntro.value = true
  resetGalleryZoom()
  isActiveGalleryVideoPlaying.value = false
  isGalleryOpen.value = true
}

// Closes the full media browser and restores normal page scrolling.
function closeGallery() {
  isGalleryOpen.value = false
  isGalleryPlaying.value = false
  isActiveGalleryVideoPlaying.value = false
  shouldAnimateGalleryImageIntro.value = true
  clearGallerySwipeCommitTimer()
  resetGalleryZoom()
}

// Prevents background scrolling while leaving the document layout untouched for modal stability.
function preventGalleryBackgroundScroll(event: Event) {
  if (!isGalleryOpen.value && !isReviewPhotoGalleryOpen.value && !isReviewSubmissionOpen.value) {
    return
  }

  const target = event.target as HTMLElement | null
  if (isReviewPhotoGalleryOpen.value && target?.closest('.kpdp-review-photo-panel')) {
    return
  }
  if (isReviewSubmissionOpen.value && target?.closest('.kpdp-review-submission-panel')) {
    return
  }
  event.preventDefault()
}

// Locks page scrolling for the modal without changing html/body layout styles.
function syncGalleryScrollLock(locked: boolean) {
  if (import.meta.server) {
    return
  }

  if (locked) {
    if (galleryScrollLockState.locked) {
      return
    }
    galleryScrollLockState.locked = true
    galleryScrollLockState.scrollY = window.scrollY
    window.addEventListener('wheel', preventGalleryBackgroundScroll, { passive: false })
    window.addEventListener('touchmove', preventGalleryBackgroundScroll, { passive: false })
    return
  }

  if (galleryScrollLockState.locked) {
    const restoreY = galleryScrollLockState.scrollY
    galleryScrollLockState.locked = false
    window.removeEventListener('wheel', preventGalleryBackgroundScroll)
    window.removeEventListener('touchmove', preventGalleryBackgroundScroll)
    window.scrollTo(0, restoreY)
  }
}

// Releases the scroll lock only after the close transition finishes to avoid a closing-frame jump.
function handleGalleryAfterLeave() {
  if (!isReviewPhotoGalleryOpen.value && !isReviewSubmissionOpen.value) {
    syncGalleryScrollLock(false)
  }
}

// Releases the shared modal scroll lock after the customer photo dialog fades out.
function handleReviewPhotoDialogAfterLeave() {
  if (!isGalleryOpen.value && !isReviewSubmissionOpen.value) {
    syncGalleryScrollLock(false)
  }
}

// Advances the lightbox without leaving the modal, matching the reference product image browser behavior.
function moveGallery(step: number) {
  const nextIndex = (activeGalleryIndex.value + step + galleryImages.length) % galleryImages.length
  setActiveGalleryIndex(nextIndex, false)
}

// Selects a thumbnail inside the expanded image browser.
function selectGalleryImage(index: number) {
  setActiveGalleryIndex(index, false)
}

// Drops one-shot image intro styling after it finishes so the open modal keeps less animation state alive.
function finishGalleryImageIntro() {
  shouldAnimateGalleryImageIntro.value = false
}

// Applies all active-media side effects from one path so image switching stays predictable.
function setActiveGalleryIndex(index: number, animateIntro: boolean) {
  shouldAnimateGalleryImageIntro.value = animateIntro
  activeGalleryIndex.value = Math.max(0, Math.min(galleryImages.length - 1, index))
  resetGalleryZoom()
  isActiveGalleryVideoPlaying.value = false
  galleryPlaybackKey.value += 1
}

// Cancels delayed swipe commits so closing or replacing a gesture cannot trigger stale navigation.
function clearGallerySwipeCommitTimer() {
  if (!gallerySwipeCommitTimer || import.meta.server) {
    return
  }
  window.clearTimeout(gallerySwipeCommitTimer)
  gallerySwipeCommitTimer = undefined
}

// Resets the image zoom so each gallery image opens from the same neutral fitted state.
function resetGalleryZoom() {
  galleryZoomScale.value = 1
  galleryZoomOrigin.value = '50% 50%'
  galleryPanX.value = 0
  galleryPanY.value = 0
  gallerySwipeX.value = 0
  isGallerySwiping.value = false
  isGallerySlideAnimating.value = false
  gallerySlideStep.value = 0
  isGalleryPanning.value = false
  isGalleryPinching.value = false
  isGalleryZoomed.value = false
  resetGalleryGestureState()
}

// Clears transient pointer gesture bookkeeping when the media item or zoom state changes.
function resetGalleryGestureState() {
  galleryGesturePointers.clear()
  galleryImageDrag.active = false
  galleryImageDrag.captured = false
  galleryImageDrag.moved = false
  galleryPinchGesture.active = false
  galleryPinchGesture.startDistance = 0
  galleryPinchGesture.startScale = 1
  isGalleryPanning.value = false
  isGalleryPinching.value = false
  isGallerySwiping.value = false
  isGallerySlideAnimating.value = false
  gallerySlideStep.value = 0
  gallerySwipeX.value = 0
}

// Parses the current transform origin so pan boundaries account for off-center pinch zooming.
function getGalleryZoomOriginRatios() {
  const [originX = '50%', originY = '50%'] = galleryZoomOrigin.value.split(' ')
  return {
    x: Math.min(1, Math.max(0, Number.parseFloat(originX) / 100 || 0.5)),
    y: Math.min(1, Math.max(0, Number.parseFloat(originY) / 100 || 0.5))
  }
}

// Creates dynamic pan-bound inputs from the real stage and image layout dimensions.
function getActiveGalleryImage(target: HTMLElement) {
  return target.querySelector<HTMLImageElement>('.kpdp-lightbox-active-image')
}

// Creates dynamic pan-bound inputs from the real stage and image layout dimensions.
function getGalleryPanBounds(target: HTMLElement, scale = galleryZoomScale.value, image = getActiveGalleryImage(target)) {
  const origins = getGalleryZoomOriginRatios()
  return {
    x: {
      stageSize: target.clientWidth,
      mediaSize: image?.offsetWidth ?? 0,
      originRatio: origins.x,
      scale
    },
    y: {
      stageSize: target.clientHeight,
      mediaSize: image?.offsetHeight ?? 0,
      originRatio: origins.y,
      scale
    }
  }
}

// Maps a viewport pointer location to the active image's own transform-origin coordinate system.
function getGalleryPointerOrigin(target: HTMLElement, clientX: number, clientY: number) {
  const rect = target.getBoundingClientRect()
  const image = getActiveGalleryImage(target)
  const originX = getGalleryPointerOriginPercent({
    pointerOffset: clientX - rect.left,
    stageSize: target.clientWidth,
    mediaSize: image?.offsetWidth ?? 0
  })
  const originY = getGalleryPointerOriginPercent({
    pointerOffset: clientY - rect.top,
    stageSize: target.clientHeight,
    mediaSize: image?.offsetHeight ?? 0
  })
  return `${originX.toFixed(2)}% ${originY.toFixed(2)}%`
}

// Re-applies dynamic edge bounds after pinch zoom changes the image scale.
function clampGalleryPanToStage(target: HTMLElement, scale = galleryZoomScale.value) {
  const bounds = getGalleryPanBounds(target, scale)
  galleryPanX.value = getBoundedGalleryPan({ startPan: galleryPanX.value, delta: 0, ...bounds.x })
  galleryPanY.value = getBoundedGalleryPan({ startPan: galleryPanY.value, delta: 0, ...bounds.y })
}

// Animates an accepted swipe before committing the active gallery index change.
function commitGallerySwipe(step: number, target: HTMLElement) {
  clearGallerySwipeCommitTimer()
  galleryStageWidth.value = target.getBoundingClientRect().width
  gallerySlideStep.value = step
  isGallerySwiping.value = false
  isGallerySlideAnimating.value = true
  gallerySwipeX.value = -step * galleryStageWidth.value

  gallerySwipeCommitTimer = window.setTimeout(() => {
    gallerySwipeCommitTimer = undefined
    if (!isGalleryOpen.value) {
      return
    }
    isGallerySlideAnimating.value = false
    gallerySwipeX.value = 0
    gallerySlideStep.value = 0
    moveGallery(step)
  }, 360)
}

// Measures the distance between the two active pointer contacts for pinch zoom.
function getGalleryGestureDistance() {
  const pointers = Array.from(galleryGesturePointers.values())
  if (pointers.length < 2) {
    return 0
  }
  return Math.hypot(pointers[0]!.x - pointers[1]!.x, pointers[0]!.y - pointers[1]!.y)
}

// Resolves the midpoint of the active pinch contacts as a CSS transform origin.
function getGalleryGestureOrigin(target: HTMLElement) {
  const pointers = Array.from(galleryGesturePointers.values())
  if (pointers.length < 2) {
    return galleryZoomOrigin.value
  }
  const centerX = (pointers[0]!.x + pointers[1]!.x) / 2
  const centerY = (pointers[0]!.y + pointers[1]!.y) / 2
  return getGalleryPointerOrigin(target, centerX, centerY)
}

// Applies a bounded image zoom scale and keeps the toolbar pressed state in sync.
function setGalleryZoom(scale: number, origin?: string) {
  const nextScale = clampGalleryZoomScale(scale)
  galleryZoomScale.value = nextScale
  if (origin) {
    galleryZoomOrigin.value = origin
  }
  isGalleryZoomed.value = nextScale > 1.01
  if (!isGalleryZoomed.value) {
    galleryPanX.value = 0
    galleryPanY.value = 0
    isGalleryPanning.value = false
  }
}

// Keeps the toolbar zoom control aligned with the current wheel-zoom state.
function toggleGalleryZoom() {
  if (activeGalleryVideo.value) {
    return
  }
  if (isGalleryZoomed.value) {
    resetGalleryZoom()
    return
  }
  setGalleryZoom(2, '50% 50%')
}

// Zooms the active image with the mouse wheel, using the pointer position as the visual anchor.
function handleGalleryWheelZoom(event: WheelEvent) {
  if (activeGalleryVideo.value) {
    return
  }
  const target = event.currentTarget as HTMLElement
  const direction = event.deltaY < 0 ? 1 : -1
  const step = Math.min(0.32, Math.max(0.08, Math.abs(event.deltaY) / 900))
  const nextScale = clampGalleryZoomScale(galleryZoomScale.value + direction * step)
  setGalleryZoom(nextScale, getGalleryPointerOrigin(target, event.clientX, event.clientY))
  clampGalleryPanToStage(target, nextScale)
}

// Starts image panning so zoomed images can be inspected by dragging.
function startGalleryImageDrag(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }
  if (!activeGalleryVideo.value) {
    event.preventDefault()
  }
  const target = event.currentTarget as HTMLElement
  galleryGesturePointers.set(event.pointerId, {
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY
  })

  if (galleryGesturePointers.size >= 2) {
    if (activeGalleryVideo.value) {
      resetGalleryGestureState()
      return
    }
    event.preventDefault()
    galleryImageDrag.active = false
    galleryImageDrag.captured = false
    isGalleryPanning.value = false
    isGallerySwiping.value = false
    isGalleryPinching.value = true
    gallerySwipeX.value = 0
    galleryPinchGesture.active = true
    galleryPinchGesture.startDistance = getGalleryGestureDistance()
    galleryPinchGesture.startScale = galleryZoomScale.value
    isGalleryPlaying.value = false
    return
  }

  galleryImageDrag.active = true
  galleryImageDrag.pointerId = event.pointerId
  galleryImageDrag.startX = event.clientX
  galleryImageDrag.startY = event.clientY
  galleryImageDrag.panX = galleryPanX.value
  galleryImageDrag.panY = galleryPanY.value
  galleryImageDrag.moved = false
  galleryImageDrag.captured = !activeGalleryVideo.value
  if (galleryImageDrag.captured) {
    target.setPointerCapture(event.pointerId)
  }
}

// Captures the active pointer only after a real drag starts so video poster taps still click.
function captureGalleryImageDragPointer(target: HTMLElement) {
  if (galleryImageDrag.captured || !galleryImageDrag.active) {
    return
  }
  target.setPointerCapture(galleryImageDrag.pointerId)
  galleryImageDrag.captured = true
}

// Routes pointer movement to pinch zoom, zoomed-image panning, or unzoomed swipe navigation.
function moveGalleryImageDrag(event: PointerEvent) {
  const pointer = galleryGesturePointers.get(event.pointerId)
  if (pointer) {
    pointer.x = event.clientX
    pointer.y = event.clientY
  }

  if (galleryPinchGesture.active && galleryGesturePointers.size >= 2) {
    event.preventDefault()
    galleryImageDrag.moved = true
    isGalleryPinching.value = true
    const target = event.currentTarget as HTMLElement
    const nextScale = getGalleryPinchZoom({
      startDistance: galleryPinchGesture.startDistance,
      currentDistance: getGalleryGestureDistance(),
      startScale: galleryPinchGesture.startScale
    })
    setGalleryZoom(nextScale, getGalleryGestureOrigin(target))
    clampGalleryPanToStage(target, nextScale)
    return
  }

  if (!galleryImageDrag.active || galleryImageDrag.pointerId !== event.pointerId) {
    return
  }
  const target = event.currentTarget as HTMLElement
  const deltaX = event.clientX - galleryImageDrag.startX
  const deltaY = event.clientY - galleryImageDrag.startY

  if (galleryZoomScale.value <= 1.01) {
    if (Math.abs(deltaX) > 4 && Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
      event.preventDefault()
      captureGalleryImageDragPointer(target)
      galleryImageDrag.moved = true
      isGallerySwiping.value = true
      galleryStageWidth.value = target.getBoundingClientRect().width
      gallerySwipeX.value = getGallerySwipeDragOffset({ deltaX, stageWidth: galleryStageWidth.value })
      gallerySlideStep.value = deltaX < 0 ? 1 : -1
    }
    return
  }

  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    event.preventDefault()
    captureGalleryImageDragPointer(target)
    galleryImageDrag.moved = true
    isGalleryPanning.value = true
  }
  const bounds = getGalleryPanBounds(target)
  galleryPanX.value = getBoundedGalleryPan({ startPan: galleryImageDrag.panX, delta: deltaX, ...bounds.x })
  galleryPanY.value = getBoundedGalleryPan({ startPan: galleryImageDrag.panY, delta: deltaY, ...bounds.y })
}

// Ends the active pointer gesture and commits swipe navigation or zoomed-image panning.
function endGalleryImageDrag(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement
  const endingPointer = galleryGesturePointers.get(event.pointerId)
  galleryGesturePointers.delete(event.pointerId)

  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }

  if (galleryPinchGesture.active) {
    galleryPinchGesture.active = galleryGesturePointers.size >= 2
    if (!galleryPinchGesture.active) {
      isGalleryPinching.value = false
      if (galleryZoomScale.value <= 1.01) {
        setGalleryZoom(1)
      }
      window.setTimeout(() => {
        galleryImageDrag.moved = false
      }, 0)
    }
    return
  }

  if (!galleryImageDrag.active || galleryImageDrag.pointerId !== event.pointerId) {
    return
  }

  if (isGallerySwiping.value && endingPointer) {
    const step = getGallerySwipeStep({
      deltaX: event.clientX - endingPointer.startX,
      deltaY: event.clientY - endingPointer.startY,
      stageWidth: target.getBoundingClientRect().width,
      scale: galleryZoomScale.value
    })
    if (step !== 0) {
      commitGallerySwipe(step, target)
    }
    if (step === 0) {
      isGallerySwiping.value = false
      gallerySwipeX.value = 0
      gallerySlideStep.value = 0
    }
  }

  galleryImageDrag.active = false
  isGalleryPanning.value = false
  galleryImageDrag.captured = false
  if (galleryImageDrag.moved && !import.meta.server) {
    window.setTimeout(() => {
      galleryImageDrag.moved = false
    }, 0)
  }
}

// Closes the expanded gallery when the user clicks only the empty lightbox area.
function closeGalleryFromEmptyArea(event: MouseEvent) {
  if (galleryImageDrag.moved) {
    galleryImageDrag.moved = false
    return
  }
  if (event.target === event.currentTarget) {
    closeGallery()
  }
}

// Starts or pauses the automatic image rotation in the lightbox.
function toggleGalleryPlayback() {
  isGalleryPlaying.value = !isGalleryPlaying.value
  galleryPlaybackKey.value += 1
}

// Shows or hides the thumbnail rail without closing the active image browser.
function toggleGalleryThumbs() {
  areGalleryThumbsVisible.value = !areGalleryThumbsVisible.value
}

// Uses the browser fullscreen API for the image browser when available.
async function toggleGalleryFullscreen() {
  if (import.meta.server || !galleryPanel.value) {
    return
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen()
    isGalleryFullscreen.value = false
    return
  }

  await galleryPanel.value.requestFullscreen()
  isGalleryFullscreen.value = true
}

// Enables mouse or pen drag-to-scroll for the thumbnail rail while leaving touch scrolling native.
function startThumbDrag(event: PointerEvent) {
  if (event.pointerType === 'touch') return

  if (!galleryThumbRail.value) {
    return
  }
  galleryThumbDrag.active = true
  galleryThumbDrag.pointerId = event.pointerId
  galleryThumbDrag.startX = event.clientX
  galleryThumbDrag.scrollLeft = galleryThumbRail.value.scrollLeft
  galleryThumbDrag.moved = false
  galleryThumbDrag.captured = false
}

// Scrolls the thumbnail rail directly under pointer movement.
function moveThumbDrag(event: PointerEvent) {
  if (!galleryThumbDrag.active || !galleryThumbRail.value) {
    return
  }
  const deltaX = event.clientX - galleryThumbDrag.startX
  if (Math.abs(deltaX) > 3) {
    galleryThumbDrag.moved = true
    if (!galleryThumbDrag.captured) {
      galleryThumbRail.value.setPointerCapture(galleryThumbDrag.pointerId)
      galleryThumbDrag.captured = true
    }
  }
  galleryThumbRail.value.scrollLeft = galleryThumbDrag.scrollLeft - deltaX
}

// Ends thumbnail drag and releases pointer capture.
function endThumbDrag(event: PointerEvent) {
  if (!galleryThumbDrag.active || !galleryThumbRail.value) {
    return
  }
  galleryThumbDrag.active = false
  if (galleryThumbDrag.captured && galleryThumbRail.value.hasPointerCapture(event.pointerId)) {
    galleryThumbRail.value.releasePointerCapture(event.pointerId)
  }
  galleryThumbDrag.captured = false
}

// Prevents a thumbnail click from firing after a drag gesture.
function selectGalleryImageFromThumb(index: number) {
  if (galleryThumbDrag.moved) {
    galleryThumbDrag.moved = false
    return
  }
  selectGalleryImage(index)
}

watch([selectedReviewRating, reviewSortOption], () => {
  clearReviewLoadMoreTimer()
  visibleReviewCount.value = reviewPageSize
})

watch(isGalleryOpen, (open) => {
  if (import.meta.server) {
    return
  }
  if (open) {
    syncGalleryScrollLock(true)
  }
})

watch(isReviewPhotoGalleryOpen, (open) => {
  if (import.meta.server) {
    return
  }
  if (open) {
    syncGalleryScrollLock(true)
  }
})

watch(isReviewSubmissionOpen, (open) => {
  if (import.meta.server) {
    return
  }
  if (open) {
    syncGalleryScrollLock(true)
  }
})

watch(isGalleryPlaying, (playing) => {
  if (import.meta.server) {
    return
  }

  if (gallerySlideshowTimer) {
    window.clearInterval(gallerySlideshowTimer)
    gallerySlideshowTimer = undefined
  }

  if (playing) {
    gallerySlideshowTimer = window.setInterval(() => {
      moveGallery(1)
    }, 2600)
  }
})

onMounted(() => {
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isReviewSortOpen.value) {
        isReviewSortOpen.value = false
        return
      }
      if (isReviewCountryOpen.value) {
        isReviewCountryOpen.value = false
        return
      }
      if (isReviewSubmissionOpen.value) {
        closeReviewSubmission()
        return
      }
      if (isReviewPhotoGalleryOpen.value) {
        closeReviewPhotoGallery()
        return
      }
      if (isProductShareOpen.value) {
        isProductShareOpen.value = false
        return
      }
      closeGallery()
      return
    }
    if (isReviewPhotoGalleryOpen.value && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      moveReviewMedia(event.key === 'ArrowLeft' ? -1 : 1)
      return
    }
    if (!isGalleryOpen.value) {
      return
    }
    if (event.key === 'ArrowLeft') {
      moveGallery(-1)
    }
    if (event.key === 'ArrowRight') {
      moveGallery(1)
    }
  }
  const syncFullscreenState = () => {
    isGalleryFullscreen.value = Boolean(document.fullscreenElement)
  }
  const closeProductTools = () => {
    isProductShareOpen.value = false
    isReviewSortOpen.value = false
    isReviewCountryOpen.value = false
  }
  window.addEventListener('keydown', closeOnEscape)
  document.addEventListener('click', closeProductTools)
  document.addEventListener('fullscreenchange', syncFullscreenState)
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', closeOnEscape)
    window.removeEventListener('pointermove', handleRelatedRailPointerMove)
    window.removeEventListener('pointerup', handleRelatedRailPointerEnd)
    window.removeEventListener('pointercancel', handleRelatedRailPointerEnd)
    document.removeEventListener('click', closeProductTools)
    document.removeEventListener('fullscreenchange', syncFullscreenState)
    if (gallerySlideshowTimer) {
      window.clearInterval(gallerySlideshowTimer)
    }
    if (shareCopiedTimer) {
      window.clearTimeout(shareCopiedTimer)
    }
    clearReviewLoadMoreTimer()
    clearGallerySwipeCommitTimer()
    syncGalleryScrollLock(false)
  })
})

useHead({
  title: 'Claude by Studio McGee 30" Console Table Bathroom Sink | KOHLER',
  meta: [
    {
      name: 'description',
      content:
        'Shop the Claude bathroom sink collection from Kohler x Studio McGee that combines classic and modern influences in a timeless expression for the home.'
    }
  ]
})
</script>

<template>
  <main class="kpdp-page">
    <nav class="kpdp-breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink to="/product/collections">Bathroom</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink to="/collections/bathroom-sinks-pedestal">Bathroom Sinks</NuxtLink>
      <span aria-hidden="true">/</span>
      <span>Claude by Studio McGee</span>
    </nav>

    <section class="kpdp-shell" aria-label="Product details">
      <div class="kpdp-gallery" aria-label="Product media gallery">
        <figure
          v-for="(media, index) in featuredGalleryImages"
          :key="media.src"
          class="kpdp-media"
          :class="{ 'kpdp-media-main': index === 0, 'kpdp-media-more': index === featuredGalleryImages.length - 1 }"
          :style="{ '--kpdp-delay': `${index * 70}ms` }"
          >
          <img
            :src="getGalleryMediaImage(media, index)"
            :alt="index === 0 ? selectedVariant.label : media.label"
            loading="eager"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            @click="openGallery(index)"
          />
          <button
            v-if="index !== featuredGalleryImages.length - 1"
            type="button"
            class="kpdp-gallery-open"
            :aria-label="`Open ${index === 0 ? selectedVariant.label : media.label}`"
            @click="openGallery(index)"
          />
          <button
            v-if="index === featuredGalleryImages.length - 1"
            type="button"
            class="kpdp-gallery-more"
            aria-label="Open all product images"
            @click="openGallery(index)"
          >
            <span class="kpdp-gallery-more-copy">
              <span class="kpdp-gallery-more-kicker">Open gallery</span>
              <span class="kpdp-gallery-more-label">View all images</span>
            </span>
            <span class="kpdp-gallery-more-count" aria-hidden="true">
              <span>+{{ hiddenGalleryCount }}</span>
              <small>more</small>
            </span>
          </button>
        </figure>
      </div>
      <div class="kpdp-print-gallery" aria-hidden="true">
        <figure
          v-for="(media, index) in featuredGalleryImages"
          :key="`print-${media.src}`"
          class="kpdp-print-media"
          :class="{ 'kpdp-print-media-main': index === 0 }"
        >
          <img
            :src="getGalleryPrintMediaImage(media, index)"
            :alt="index === 0 ? selectedVariant.label : media.label"
            loading="eager"
            decoding="sync"
          />
        </figure>
      </div>

      <aside class="kpdp-summary" aria-label="Purchase panel">
        <div class="kpdp-product-tools" aria-label="Product tools" @click.stop>
          <button type="button" aria-label="Print this page" @click="printProductPage">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 8V3h10v5" />
              <path d="M7 18H5.5C4.1 18 3 16.9 3 15.5v-4C3 10.1 4.1 9 5.5 9h13c1.4 0 2.5 1.1 2.5 2.5v4c0 1.4-1.1 2.5-2.5 2.5H17" />
              <path d="M7 14h10v7H7z" />
              <path d="M17.5 12.2h.01" />
            </svg>
          </button>
          <div class="kpdp-product-share" :class="{ 'is-open': isProductShareOpen }">
            <button
              type="button"
              :aria-expanded="isProductShareOpen"
              aria-label="Share this product"
              @click="toggleProductShare"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .66 1.88l-7.2 4.2a3 3 0 1 0 0 3.84l7.2 4.2A3 3 0 1 0 17 16.27l-7.32-4.27L17 7.73c.32.17.66.27 1 .27Z" />
              </svg>
            </button>
            <div v-if="isProductShareOpen" class="kpdp-share-popover" role="menu" aria-label="Share options" @click.stop>
              <button type="button" class="kpdp-share-platform kpdp-share-facebook" role="menuitem" aria-label="Share on Facebook" @click="shareProduct('facebook')">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.1 8.1h2.1V4.6c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5v3.1H4.2v3.9h3.5v8h4.2v-8h3.5l.5-3.9h-4v-2.7c0-1.1.3-2.2 2.2-2.2Z" /></svg>
                <span>Facebook</span>
              </button>
              <button type="button" class="kpdp-share-platform kpdp-share-pinterest" role="menuitem" aria-label="Share on Pinterest" @click="shareProduct('pinterest')">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.2 3.8c-4.4 0-7.5 3-7.5 6.9 0 2.5 1.4 4 2.3 4 .4 0 .6-1.1.6-1.4 0-.4-1-1.2-1-2.8 0-2.7 2.1-4.6 4.7-4.6 2.3 0 4 1.3 4 3.7 0 1.8-.7 5.1-3.1 5.1-.9 0-1.7-.7-1.7-1.6 0-1.4 1-2.8 1-4.2 0-2.4-3.4-2-3.4 1 0 .6.1 1.3.4 1.9-.6 2.5-1.7 6.2-1.7 8.8 0 .8.1 1.6.2 2.4l.2.1c1.5-2 1.9-3.9 2.6-6.4.5.9 1.7 1.4 2.7 1.4 4.1 0 5.9-4 5.9-7.6 0-3.9-3.4-6.7-7.2-6.7Z" /></svg>
                <span>Pinterest</span>
              </button>
              <button type="button" class="kpdp-share-platform kpdp-share-x" role="menuitem" aria-label="Share on X" @click="shareProduct('x')">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.4 10.6 22.2 2h-1.9l-6.8 7.4L8.2 2H2l8.2 11.4L2 22h1.9l7.1-7.7 5.7 7.7H22l-7.6-11.4Zm-2.5 2.8-.8-1.1L4.5 3.4h2.8l5.4 7.3.8 1.1 6.9 9.3h-2.8l-5.7-7.7Z" /></svg>
                <span>X</span>
              </button>
              <button type="button" class="kpdp-share-platform kpdp-share-email" role="menuitem" aria-label="Share by email" @click="shareProduct('email')">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h17c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-11C2 5.7 2.7 5 3.5 5Zm.7 2 7.8 5.4L19.8 7H4.2Zm15.8 9.8V8.9l-7.4 5.1c-.4.3-.8.3-1.2 0L4 8.9v7.9h16Z" /></svg>
                <span>Email</span>
              </button>
              <button type="button" class="kpdp-share-copy" role="menuitem" :aria-label="isShareCopied ? 'Product link copied' : 'Copy product link'" @click="copyProductLink">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8h9.5c.8 0 1.5.7 1.5 1.5V19c0 .8-.7 1.5-1.5 1.5H9c-.8 0-1.5-.7-1.5-1.5V9.5C7.5 8.7 8.2 8 9 8Z" /><path d="M5 16H4.5C3.7 16 3 15.3 3 14.5V5c0-.8.7-1.5 1.5-1.5H14c.8 0 1.5.7 1.5 1.5v.5" /></svg>
                <span>{{ isShareCopied ? 'Copied' : 'Copy link' }}</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            class="kpdp-save-list"
            :class="{ 'is-saved': isFavorite(currentCommerceProduct().productKey) }"
            :aria-label="isFavorite(currentCommerceProduct().productKey) ? 'Remove from Favorites' : 'Add to Favorites'"
            :aria-pressed="isFavorite(currentCommerceProduct().productKey)"
            @click="toggleFavorite(currentCommerceProduct())"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-9.4-9.2C1.3 8.2 3.2 5 6.6 5c2 0 3.4 1.1 4.2 2.3C11.6 6.1 13 5 15 5c3.4 0 5.3 3.2 4 6.3-1.9 4.6-7 9.2-7 9.2Z" />
            </svg>
          </button>
        </div>
        <p class="kpdp-brand">KOHLER x Studio McGee</p>
        <h1>Claude<sup>TM</sup> by Studio McGee</h1>
        <p class="kpdp-subtitle">30&quot; rectangular console table bathroom sink</p>
        <p class="kpdp-sku">{{ selectedVariant.sku }}</p>

        <div class="kpdp-rating" aria-label="Reviews">
          <span aria-hidden="true">★★★★★</span>
          <a href="#kpdp-review-panel-reviews">{{ reviewAverageLabel }} ({{ reviewTotal }} Reviews)</a>
        </div>

        <div class="kpdp-price-row">
          <p class="kpdp-price">{{ selectedVariant.price }}</p>
          <p class="kpdp-stock">In stock</p>
        </div>

        <section class="kpdp-option" aria-label="Color finish">
          <div class="kpdp-option-head">
            <span>Color / Finish</span>
            <strong>{{ selectedVariant.label }}</strong>
          </div>
          <div class="kpdp-swatches" role="list">
            <button
              v-for="variant in variants"
              :key="variant.sku"
              type="button"
              class="kpdp-swatch"
              :class="{ 'is-active': variant.sku === selectedVariant.sku }"
              :aria-label="variant.label"
              :aria-pressed="variant.sku === selectedVariant.sku"
              :style="{ '--kpdp-swatch': variant.swatch }"
              @click="selectVariant(variant)"
            />
          </div>
        </section>

        <section class="kpdp-actions" aria-label="Purchase actions">
          <div class="kpdp-qty" aria-label="Quantity">
            <button type="button" aria-label="Decrease quantity" @click="updateQuantity(quantity - 1)">−</button>
            <span>{{ quantity }}</span>
            <button type="button" aria-label="Increase quantity" @click="updateQuantity(quantity + 1)">+</button>
          </div>
          <button type="button" class="kpdp-add" @click="addCurrentProductToCart">Add to Cart</button>
          <button type="button" class="kpdp-secondary">Find a Store</button>
        </section>

        <p class="kpdp-affirm">In stock. Ships within 1-3 business days.</p>

        <div class="kpdp-summary-info" aria-label="Product purchase information">
          <section class="kpdp-side-section">
            <h2>Important Features</h2>
            <ul class="kpdp-feature-list">
              <li>48-inch double bowl console sink for a shared primary bath.</li>
              <li>8-inch widespread faucet drilling on each basin deck.</li>
              <li>Integrated overflow on both bowls for everyday use.</li>
              <li>Vitreous china sink top with refined console proportions.</li>
              <li>Open lower shelf keeps towels and daily essentials within reach.</li>
            </ul>
          </section>

          <section class="kpdp-side-section">
            <h2>Certificates</h2>
            <div class="kpdp-certificates" aria-label="Product certificates">
              <article v-for="certificate in certificateBadges" :key="certificate.label">
                <img :src="certificate.logo" :alt="certificate.label" loading="lazy" />
              </article>
            </div>
          </section>

          <section class="kpdp-side-section kpdp-promises-section" aria-label="Purchase promises">
            <ul class="kpdp-promise-list">
              <li>
                <span class="kpdp-promise-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path class="fill" d="M18.2 2H15.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C11 4.28 11 5.12 11 6.8v1c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C9.48 11 8.92 11 7.8 11H4.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C1 12.52 1 13.08 1 14.2V16c0 .932 0 1.398.152 1.765a2 2 0 0 0 1.083 1.083C2.602 19 3.068 19 4 19a3 3 0 1 1 6 0h4a3 3 0 1 1 6 0 3 3 0 0 0 3-3V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C20.72 2 19.88 2 18.2 2Z" /><path d="M10 19h4M10 19a3 3 0 1 1-6 0m6 0a3 3 0 1 0-6 0m10 0a3 3 0 1 0 6 0m-6 0a3 3 0 1 1 6 0m0 0a3 3 0 0 0 3-3V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C20.72 2 19.88 2 18.2 2H15.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C11 4.28 11 5.12 11 6.8v1c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C9.48 11 8.92 11 7.8 11H1.5M4 19c-.932 0-1.398 0-1.765-.152a2 2 0 0 1-1.083-1.083C1 17.398 1 16.932 1 16v-3.227c0-.66 0-.99.052-1.31.047-.285.124-.564.231-.832.12-.302.29-.585.629-1.151l.224-.373c.679-1.133 1.019-1.699 1.487-2.111.414-.364.899-.639 1.425-.806C5.642 6 6.302 6 7.624 6H11" /></svg>
                </span>
                <span><strong>Ships within 1-3 business days</strong><span>Fast processing on in-stock items.</span></span>
              </li>
              <li>
                <span class="kpdp-promise-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><g class="fill"><path d="M2 16c0-.932 0-1.398.152-1.765a2 2 0 0 1 1.083-1.083C3.602 13 4.068 13 5 13s1.398 0 1.765.152a2 2 0 0 1 1.083 1.083C8 14.602 8 15.068 8 16v3c0 .932 0 1.398-.152 1.765a2 2 0 0 1-1.083 1.083C6.398 22 5.932 22 5 22s-1.398 0-1.765-.152a2 2 0 0 1-1.083-1.083C2 20.398 2 19.932 2 19v-3Z" /><path d="M16 16c0-.932 0-1.398.152-1.765a2 2 0 0 1 1.083-1.083C17.602 13 18.068 13 19 13s1.398 0 1.765.152a2 2 0 0 1 1.083 1.083C22 14.602 22 15.068 22 16v3c0 .932 0 1.398-.152 1.765a2 2 0 0 1-1.083 1.083C20.398 22 19.932 22 19 22s-1.398 0-1.765-.152a2 2 0 0 1-1.083-1.083C16 20.398 16 19.932 16 19v-3Z" /></g><path d="M22 17v-5c0-5.523-4.477-10-10-10S2 6.477 2 12v5m20 2v-3c0-.932 0-1.398-.152-1.765a2 2 0 0 0-1.083-1.083C20.398 13 19.932 13 19 13s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083C16 14.602 16 15.068 16 16v3c0 .932 0 1.398.152 1.765a2 2 0 0 0 1.083 1.083C17.602 22 18.068 22 19 22s1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083C22 20.398 22 19.932 22 19ZM5 22c.932 0 1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083C8 20.398 8 19.932 8 19v-3c0-.932 0-1.398-.152-1.765a2 2 0 0 0-1.083-1.083C6.398 13 5.932 13 5 13s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083C2 14.602 2 15.068 2 16v3c0 .932 0 1.398.152 1.765a2 2 0 0 0 1.083 1.083C3.602 22 4.068 22 5 22Z" /></svg>
                </span>
                <span><strong>30-day risk-free trial</strong><span>Return eligible items within 30 days.</span></span>
              </li>
              <li>
                <span class="kpdp-promise-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect class="fill" x="4" y="2" width="16" height="16" rx="8" /><path d="m7 16.5-1 5.5c1.982-.33 3.985-.779 6-.779s4.018.449 6 .779l-1-5.5M12 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" /></svg>
                </span>
                <span><strong>2-Year Warranty</strong><span>Coverage for manufacturing defects.</span></span>
              </li>
              <li>
                <span class="kpdp-promise-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path class="fill" d="M22 14.283V7.282a.497.497 0 0 0-.242-.427.5.5 0 0 0-.515.002l-6.742 4.116c-.908.554-1.363.832-1.848.94a3 3 0 0 1-1.305 0c-.486-.108-.94-.386-1.85-.94L2.758 6.857a.5.5 0 0 0-.515-.002.497.497 0 0 0-.242.427v7.001c0 .991 0 1.486.142 1.931.126.394.332.758.605 1.069.309.351.734.606 1.583 1.115l5.2 3.12c.898.539 1.347.809 1.826.914.424.093.864.093 1.288 0 .479-.105.928-.375 1.826-.914l5.2-3.12c.849-.509 1.274-.764 1.583-1.115.273-.311.479-.675.605-1.069.142-.445.142-.94.142-1.931Z" /><path d="M7.5 9.5 16.5 4M12 12.5l9-5.5m-9 5.5L3 7m9 5.5v10M2 9.718v4.564c0 .991 0 1.487.142 1.932.126.394.332.758.605 1.068.309.351.734.606 1.583 1.116l5.2 3.12c.898.539 1.347.808 1.826.914.424.093.864.093 1.288 0 .479-.106.928-.375 1.826-.914l5.2-3.12c.849-.51 1.274-.765 1.583-1.116.273-.31.479-.674.605-1.068.142-.445.142-.941.142-1.932V9.718c0-.991 0-1.487-.142-1.932a3 3 0 0 0-.605-1.068c-.309-.351-.734-.606-1.583-1.116l-5.2-3.12c-.898-.539-1.347-.808-1.826-.914a3 3 0 0 0-1.288 0c-.479.106-.928.375-1.826.914l-5.2 3.12c-.849.51-1.274.765-1.583 1.116a3 3 0 0 0-.605 1.068C2 8.231 2 8.727 2 9.718Z" /></svg>
                </span>
                <span><strong>Complimentary shipping & returns</strong><span>Simple delivery and return support.</span></span>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </section>

    <section class="kpdp-detail-panels" aria-label="Product details">
      <div class="kpdp-detail-accordions">
        <section class="kpdp-accordion" :class="{ 'is-open': isProductAccordionOpen('description') }">
          <button
            id="kpdp-accordion-description-trigger"
            type="button"
            class="kpdp-accordion-summary"
            :aria-expanded="isProductAccordionOpen('description')"
            aria-controls="kpdp-accordion-description-panel"
            @click="toggleProductAccordion('description')"
          >
            <span>Product Description</span>
            <span class="kpdp-accordion-icon" aria-hidden="true"></span>
          </button>
          <div id="kpdp-accordion-description-panel" class="kpdp-accordion-panel" role="region" aria-labelledby="kpdp-accordion-description-trigger">
            <div class="kpdp-accordion-panel-inner">
              <p>
                The Augusta 48-inch double bowl console sink creates a refined focal point for a shared primary bath, guest suite, or hospitality powder room. Its wide rectangular top gives two users a dedicated washing area while the open console base keeps the room feeling lighter than a closed vanity.
              </p>
              <p>
                The vitreous china top is shaped with crisp perimeter lines and softly rounded basins, balancing traditional bathroom character with a cleaner architectural profile. Each bowl is configured for an 8-inch widespread faucet and includes an overflow, making the piece practical for everyday residential use.
              </p>
              <p>
                Pair the console with polished chrome, brushed nickel, brass, or matte black fittings to match the surrounding hardware. The lower shelf can be used for folded towels or daily essentials without visually closing off the wall behind the sink.
              </p>
            </div>
          </div>
        </section>

        <section class="kpdp-accordion kpdp-highlights-accordion" :class="{ 'is-open': isProductAccordionOpen('highlights') }">
          <button
            id="kpdp-accordion-highlights-trigger"
            type="button"
            class="kpdp-accordion-summary"
            :aria-expanded="isProductAccordionOpen('highlights')"
            aria-controls="kpdp-accordion-highlights-panel"
            @click="toggleProductAccordion('highlights')"
          >
            <span>Product Highlights</span>
            <span class="kpdp-accordion-icon" aria-hidden="true"></span>
          </button>
          <div id="kpdp-accordion-highlights-panel" class="kpdp-accordion-panel" role="region" aria-labelledby="kpdp-accordion-highlights-trigger">
            <div class="kpdp-accordion-panel-inner">
              <div class="kpdp-highlights-layout">
                <div class="kpdp-highlights-media">
                  <figure class="kpdp-highlight-hero">
                    <img :src="productHighlightImages[0]?.src" :alt="productHighlightImages[0]?.label" loading="lazy" />
                    <figcaption>Refined basin detail with integrated overflow</figcaption>
                  </figure>
                  <figure>
                    <img :src="productHighlightImages[1]?.src" :alt="productHighlightImages[1]?.label" loading="lazy" />
                    <figcaption>Open console profile for a lighter bath plan</figcaption>
                  </figure>
                  <figure>
                    <img :src="productHighlightImages[2]?.src" :alt="productHighlightImages[2]?.label" loading="lazy" />
                    <figcaption>Core parts grouped for installation planning</figcaption>
                  </figure>
                </div>

                <div class="kpdp-highlights-copy">
                  <span class="kpdp-highlights-kicker">Visual Detail</span>
                  <h3>Built for shared routines without the weight of a vanity.</h3>
                  <p>
                    A wide double-bowl top gives two users their own washing area, while the open metal base keeps towels visible and the wall plane clear. The layout is intended for primary baths, hospitality suites, and larger powder rooms that need presence without visual bulk.
                  </p>

                  <div class="kpdp-highlight-points" aria-label="Product highlight details">
                    <article>
                      <span aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M4 7h16v10H4z" /><path d="M8 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm4 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" /></svg>
                      </span>
                      <div>
                        <strong>Double-bowl comfort</strong>
                        <p>Two oval basins support side-by-side use in a shared bath.</p>
                      </div>
                    </article>
                    <article>
                      <span aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M7 5h10v6a5 5 0 0 1-10 0V5Z" /><path d="M9 8h6M12 16v4" /></svg>
                      </span>
                      <div>
                        <strong>Integrated overflow</strong>
                        <p>Each basin includes overflow protection for everyday operation.</p>
                      </div>
                    </article>
                    <article>
                      <span aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M5 5h14M7 5v14m10-14v14M5 19h14M8 13h8" /></svg>
                      </span>
                      <div>
                        <strong>Open lower shelf</strong>
                        <p>The exposed shelf keeps folded towels and essentials within reach.</p>
                      </div>
                    </article>
                  </div>

                  <div class="kpdp-included-strip" aria-label="Included items">
                    <span>What's included</span>
                    <ul>
                      <li>Sink top</li>
                      <li>Console stand</li>
                      <li>Lower shelf</li>
                      <li>Mounting hardware</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="kpdp-accordion" :class="{ 'is-open': isProductAccordionOpen('specs') }">
          <button
            id="kpdp-accordion-specs-trigger"
            type="button"
            class="kpdp-accordion-summary"
            :aria-expanded="isProductAccordionOpen('specs')"
            aria-controls="kpdp-accordion-specs-panel"
            @click="toggleProductAccordion('specs')"
          >
            <span>Detail Spec</span>
            <span class="kpdp-accordion-icon" aria-hidden="true"></span>
          </button>
          <div id="kpdp-accordion-specs-panel" class="kpdp-accordion-panel" role="region" aria-labelledby="kpdp-accordion-specs-trigger">
            <div class="kpdp-accordion-panel-inner">
              <dl>
                <div><dt>Model number</dt><dd>138-CNS15-8-2</dd></div>
                <div><dt>Product type</dt><dd>Double bowl console sink</dd></div>
                <div><dt>Overall width</dt><dd>48&quot;</dd></div>
                <div><dt>Overall depth</dt><dd>22-1/2&quot;</dd></div>
                <div><dt>Overall height</dt><dd>35-1/16&quot;</dd></div>
                <div><dt>Bowl configuration</dt><dd>Double bowl</dd></div>
                <div><dt>Basin shape</dt><dd>Oval</dd></div>
                <div><dt>Basin depth</dt><dd>5-5/8&quot;</dd></div>
                <div><dt>Faucet drilling</dt><dd>8&quot; widespread</dd></div>
                <div><dt>Faucet holes</dt><dd>Three per basin</dd></div>
                <div><dt>Drain opening</dt><dd>Standard 1-3/4&quot;</dd></div>
                <div><dt>Overflow</dt><dd>Included</dd></div>
                <div><dt>Material</dt><dd>Vitreous china</dd></div>
                <div><dt>Base material</dt><dd>Metal console frame</dd></div>
                <div><dt>Finish shown</dt><dd>White / Vibrant Brushed Moderne Brass</dd></div>
                <div><dt>Installation type</dt><dd>Console sink</dd></div>
                <div><dt>Mounting</dt><dd>Wall anchored with console support</dd></div>
                <div><dt>Included components</dt><dd>Sink top, console frame, shelf</dd></div>
                <div><dt>Not included</dt><dd>Faucets, drains, P-traps</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section class="kpdp-accordion" :class="{ 'is-open': isProductAccordionOpen('resources') }">
          <button
            id="kpdp-accordion-resources-trigger"
            type="button"
            class="kpdp-accordion-summary"
            :aria-expanded="isProductAccordionOpen('resources')"
            aria-controls="kpdp-accordion-resources-panel"
            @click="toggleProductAccordion('resources')"
          >
            <span>Resources Download</span>
            <span class="kpdp-accordion-icon" aria-hidden="true"></span>
          </button>
          <div id="kpdp-accordion-resources-panel" class="kpdp-accordion-panel" role="region" aria-labelledby="kpdp-accordion-resources-trigger">
            <div class="kpdp-accordion-panel-inner">
              <div class="kpdp-downloads">
                <a
                  v-for="resource in productResources"
                  :key="resource.label"
                  :href="resource.href"
                  :aria-label="resource.ariaLabel"
                >
                  <span class="kpdp-download-icon" :class="`kpdp-download-icon-${resource.icon}`" aria-hidden="true">
                    <span>{{ resource.badge }}</span>
                  </span>
                  <span class="kpdp-download-label">{{ resource.label }}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="kpdp-series-block" aria-label="Augusta collection">
      <div class="kpdp-series-inner">
        <div class="kpdp-series-copy">
          <span>Series</span>
          <h2>Augusta Collection</h2>
          <p>
            Build a coordinated bathroom around the same refined console language, with balanced ceramic forms, open metal structure, and finishes that pair across sinks, vanities, and bath fittings.
          </p>
          <div class="kpdp-series-actions">
            <a href="/collections/augusta">Shop Augusta</a>
            <a href="/product/collections">All Collections</a>
          </div>
        </div>
        <figure class="kpdp-series-media">
          <img :src="getGalleryMediaImage(galleryImages[1]!, 1)" alt="Augusta collection bathroom with console sink" loading="lazy" />
        </figure>
      </div>
    </section>

    <section class="kpdp-related-products" aria-label="You may also like">
      <div class="kpdp-related-head">
        <h2>You May Also Like</h2>
      </div>

      <div class="kpdp-related-rail-wrap">
        <div
          ref="relatedProductRail"
          class="kpdp-related-rail"
          :class="{ 'is-dragging': isRelatedRailDragging }"
          tabindex="0"
          aria-label="Related product carousel"
          @click.capture="handleRelatedRailClick"
          @dragstart.prevent
          @pointerdown="handleRelatedRailPointerDown"
          @scroll.passive="updateRelatedProductProgress"
        >
          <article v-for="product in relatedProducts" :key="product.name" class="kpdp-related-card">
            <div class="kpdp-related-image">
              <a :href="product.href" :aria-label="product.name">
                <img :src="product.image" :alt="product.name" loading="lazy" />
              </a>
              <button type="button" class="kpdp-related-save" :aria-label="`Add ${product.name} to project`">
                <span>Add to Project</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.5 3.5h11v17l-5.5-3.7-5.5 3.7v-17Z" />
                </svg>
              </button>
            </div>
            <div class="kpdp-related-info">
              <a :href="product.href" class="kpdp-related-title">
                <span>{{ product.brand }}</span>{{ product.name }}
              </a>
              <div class="kpdp-related-meta">
                <strong>{{ product.price }}</strong>
                <label :for="`compare-${product.handle}`">
                  <input :id="`compare-${product.handle}`" type="checkbox" :aria-label="`Compare ${product.name}`" />
                  <span>Compare</span>
                </label>
              </div>
            </div>
          </article>
        </div>
        <div class="kpdp-related-controls" aria-label="Related product controls">
          <button type="button" aria-label="Previous related products" @click="scrollRelatedProducts(-1)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <button type="button" aria-label="Next related products" @click="scrollRelatedProducts(1)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>
        <div class="kpdp-related-progress" aria-hidden="true">
          <span :style="{ transform: `scaleX(${Math.max(0.08, relatedRailProgress)})` }"></span>
        </div>
      </div>
    </section>

    <section class="kpdp-reviews-block" aria-label="Reviews and questions">
      <div class="kpdp-reviews-head">
        <h2>Reviews &amp; Q&amp;A</h2>
        <div class="kpdp-review-tabs" role="tablist" aria-label="Review content">
          <button
            id="kpdp-review-tab-reviews"
            type="button"
            role="tab"
            :aria-selected="activeReviewTab === 'reviews'"
            aria-controls="kpdp-review-panel-reviews"
            :class="{ 'is-active': activeReviewTab === 'reviews' }"
            @click="setReviewTab('reviews')"
          >
            Reviews
          </button>
          <button
            id="kpdp-review-tab-qa"
            type="button"
            role="tab"
            :aria-selected="activeReviewTab === 'qa'"
            aria-controls="kpdp-review-panel-qa"
            :class="{ 'is-active': activeReviewTab === 'qa' }"
            @click="setReviewTab('qa')"
          >
            Q&amp;A
          </button>
        </div>
      </div>

      <div
        v-show="activeReviewTab === 'reviews'"
        id="kpdp-review-panel-reviews"
        role="tabpanel"
        aria-labelledby="kpdp-review-tab-reviews"
      >
        <div class="kpdp-review-proof">
          <div class="kpdp-review-rating-card">
            <div class="kpdp-review-score">
              <strong>{{ reviewAverageLabel }}</strong>
              <div>
                <div class="kpdp-review-stars" :aria-label="`${reviewAverageLabel} out of 5 stars`">
                  <span v-for="star in 5" :key="star" class="kpdp-review-star" aria-hidden="true"></span>
                </div>
                  <p>Based on {{ reviewTotal }} verified project reviews</p>
              </div>
            </div>

            <div class="kpdp-review-bars" aria-label="Review rating distribution">
              <button
                v-for="row in reviewDistribution"
                :key="row.rating"
                type="button"
                class="kpdp-review-bar-row"
                :class="{ 'is-active': selectedReviewRating === row.rating }"
                :aria-pressed="selectedReviewRating === row.rating"
                :aria-label="`Show ${row.rating} star reviews`"
                @click="toggleReviewRating(row.rating)"
              >
                <span>{{ row.rating }}</span>
                <span class="kpdp-review-bar-star" aria-hidden="true"></span>
                <div class="kpdp-review-bar-track">
                  <span :style="{ transform: `scaleX(${row.percent / 100})` }"></span>
                </div>
                <span>{{ row.count }}</span>
              </button>
            </div>
          </div>

          <div class="kpdp-review-photo-gallery" aria-label="Review photos">
            <div class="kpdp-review-photo-head">
              <button type="button" @click="openReviewPhotoGallery(reviewPhotos, 0)">View all photos</button>
            </div>
            <div class="kpdp-review-photo-strip">
              <button
                v-for="(photo, index) in featuredReviewPhotos"
                :key="`${photo.author}-${photo.src}`"
                type="button"
                :class="{ 'is-video': photo.type === 'video' }"
                :aria-label="`Open review photo gallery from ${photo.author}`"
                @click="openReviewPhotoGallery(reviewPhotos, index)"
              >
                <img :src="photo.src" :alt="photo.alt" loading="lazy" />
                <span v-if="photo.type === 'video'" class="kpdp-review-media-play" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="kpdp-review-filters" aria-label="Review filters">
          <button type="button" class="kpdp-review-write" @click="openReviewSubmission('review')">
            <span aria-hidden="true"></span>
            Write a review
          </button>
          <div class="kpdp-review-filter-controls">
            <button
              v-if="selectedReviewRating !== null"
              type="button"
              class="kpdp-review-active-filter"
              :aria-label="`Clear ${selectedReviewRating} star review filter`"
              @click="selectedReviewRating = null"
            >
              <span>{{ selectedReviewRating }} stars</span>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
              </svg>
            </button>
            <div class="kpdp-review-sort-menu" :class="{ 'is-open': isReviewSortOpen }">
              <button
                type="button"
                class="kpdp-review-sort-trigger"
                :aria-expanded="isReviewSortOpen"
                aria-controls="kpdp-review-sort-options"
                @click.stop="isReviewSortOpen = !isReviewSortOpen"
              >
                <span class="kpdp-review-sort-header">
                  <span class="kpdp-review-sort-selection">{{ reviewSortLabel }}</span>
                  <span class="kpdp-review-sort-title">Sort by</span>
                </span>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
              </button>
              <button class="kpdp-review-sort-close" type="button" aria-label="Close sort options" @click.stop="isReviewSortOpen = false">
                <svg viewBox="0 0 20 20" stroke="currentColor" fill="none" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15L15 5M5 5L15 15" />
                </svg>
              </button>
              <ul id="kpdp-review-sort-options" class="kpdp-review-sort-options" role="menu" aria-label="Sort reviews">
                <li v-for="option in reviewSortOptions" :key="option.value">
                  <button
                    type="button"
                    role="menuitemradio"
                    :aria-checked="reviewSortOption === option.value"
                    :class="{ 'is-active': reviewSortOption === option.value }"
                    @click="selectReviewSortOption(option.value)"
                  >
                    <span>{{ option.label }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div id="kpdp-reviews-list" class="kpdp-review-list">
          <article v-for="review in visibleReviews" :key="review.title" class="kpdp-review-card">
            <aside>
              <strong>{{ review.author }}</strong>
              <span class="kpdp-review-region">{{ review.region }}</span>
              <span class="kpdp-review-verified">{{ review.verifiedLabel }}</span>
            </aside>
            <div>
              <div class="kpdp-review-card-head">
                <div>
                  <div class="kpdp-review-stars" :aria-label="`${review.rating} out of 5 stars`">
                    <span v-for="star in 5" :key="star" class="kpdp-review-star" :class="{ 'is-muted': star > review.rating }" aria-hidden="true"></span>
                  </div>
                  <h3>{{ review.title }}</h3>
                </div>
                <time class="kpdp-review-date">{{ review.date }}</time>
              </div>
              <p>{{ review.body }}</p>

              <div v-if="review.media.length" class="kpdp-review-media" aria-label="Review media">
                <button
                  v-for="(media, mediaIndex) in review.media.slice(0, 4)"
                  :key="`${review.title}-${media.src}`"
                  type="button"
                  :class="{ 'is-video': media.type === 'video', 'has-more': mediaIndex === 3 && review.media.length > 4 }"
                  :aria-label="`${media.type === 'video' ? 'Play' : 'Open'} review media from ${review.author}`"
                  @click="openReviewPhotoGallery(review.media, mediaIndex, review)"
                >
                  <img :src="media.src" :alt="media.alt" loading="lazy" />
                  <span v-if="media.type === 'video'" class="kpdp-review-media-play" aria-hidden="true"></span>
                  <span v-if="mediaIndex === 3 && review.media.length > 4" class="kpdp-review-media-more">+{{ review.media.length - 3 }}</span>
                </button>
              </div>

              <section v-if="review.serviceReply" class="kpdp-review-service-reply">
                <header>
                  <span>{{ review.serviceReply.author }}</span>
                  <time>{{ review.serviceReply.date }}</time>
                </header>
                <p>{{ review.serviceReply.body }}</p>
              </section>

              <footer class="kpdp-review-actions">
                <div class="kpdp-review-vote">
                  <button type="button" :aria-label="`Mark ${review.title} as helpful`">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 11v9H4v-9h3Zm4.5 9H7V10l5-6 1.7 1.4-1.2 4.1H20l-1.2 8.2a2.7 2.7 0 0 1-2.7 2.3h-4.6Z" />
                    </svg>
                    {{ review.helpfulUp }}
                  </button>
                  <button type="button" :aria-label="`Mark ${review.title} as not helpful`">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 13V4H4v9h3Zm4.5-9H7v10l5 6 1.7-1.4-1.2-4.1H20L18.8 6.3A2.7 2.7 0 0 0 16.1 4h-4.6Z" />
                    </svg>
                    {{ review.helpfulDown }}
                  </button>
                </div>
              </footer>
            </div>
          </article>
          <p v-if="filteredReviews.length === 0" class="kpdp-review-empty">No reviews match the selected filters.</p>
        </div>

        <div v-if="filteredReviews.length > 0" class="kpdp-review-load-more">
          <p>{{ visibleReviewTotal }} of {{ filteredReviews.length }} reviews</p>
          <button
            v-if="canLoadMoreReviews"
            type="button"
            :class="{ 'is-loading': isReviewLoadingMore }"
            :aria-busy="isReviewLoadingMore"
            :aria-label="`Load more reviews. Showing ${visibleReviewTotal} of ${filteredReviews.length}.`"
            :disabled="isReviewLoadingMore"
            @click="loadMoreReviews"
          >
            <span class="kpdp-review-load-spinner" aria-hidden="true"></span>
            <span>{{ isReviewLoadingMore ? 'Loading' : 'Load more' }}</span>
          </button>
        </div>
      </div>

      <div
        v-show="activeReviewTab === 'qa'"
        id="kpdp-review-panel-qa"
        class="kpdp-qa-panel"
        role="tabpanel"
        aria-labelledby="kpdp-review-tab-qa"
      >
        <div class="kpdp-qa-summary">
          <div>
            <span>{{ productQuestions.length }} answered questions</span>
            <h3>Product questions answered by support and trade specialists.</h3>
          </div>
          <button type="button" @click="openReviewSubmission('question')">Ask a question</button>
        </div>
        <div class="kpdp-qa-list">
          <article v-for="item in productQuestions" :key="item.question" class="kpdp-qa-item">
            <div class="kpdp-qa-question">
              <span>Q</span>
              <h3>{{ item.question }}</h3>
            </div>
            <div class="kpdp-qa-answer">
              <span>A</span>
              <p>{{ item.answer }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="kpdp-review-submission-dialog" @after-leave="handleReviewSubmissionAfterLeave">
        <section
          v-if="isReviewSubmissionOpen"
          class="kpdp-review-submission-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kpdp-review-submission-title"
        >
          <button type="button" class="kpdp-review-submission-backdrop" :aria-label="`Close ${reviewSubmissionTitle}`" @click="closeReviewSubmission" />
          <div class="kpdp-review-submission-panel">
            <button type="button" class="kpdp-review-submission-close" :aria-label="`Close ${reviewSubmissionTitle}`" @click="closeReviewSubmission">
              <span aria-hidden="true"></span>
            </button>

            <div v-if="reviewSubmissionStep === 'success'" class="kpdp-review-submission-success">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m5.5 12.5 4.2 4.2 8.8-9.4" /></svg>
              </span>
              <h2 id="kpdp-review-submission-title">{{ reviewSubmissionSuccessTitle }}</h2>
              <p>{{ reviewSubmissionSuccessCopy }}</p>
              <button type="button" @click="closeReviewSubmission">Close</button>
            </div>

            <form v-else class="kpdp-review-submission-form" novalidate @submit.prevent="submitReviewSubmission">
              <header>
                <h2 id="kpdp-review-submission-title">{{ reviewSubmissionTitle }}</h2>
                <span>{{ reviewSubmissionIntro }}</span>
              </header>

              <fieldset
                v-if="reviewSubmissionMode === 'review'"
                class="kpdp-review-submission-rating"
                @mouseleave="reviewSubmissionHoverRating = 0"
              >
                <legend>Rating</legend>
                <label
                  v-for="rating in [1, 2, 3, 4, 5]"
                  :key="rating"
                  :class="{ 'is-active': rating <= (reviewSubmissionHoverRating || reviewSubmissionForm.rating) }"
                  :aria-label="`${rating} out of 5 stars`"
                  @mouseenter="reviewSubmissionHoverRating = rating"
                  @focusin="reviewSubmissionHoverRating = rating"
                  @focusout="reviewSubmissionHoverRating = 0"
                >
                  <input
                    v-model.number="reviewSubmissionForm.rating"
                    type="radio"
                    name="review-rating"
                    :value="rating"
                    @change="clearReviewSubmissionError('rating')"
                  />
                  <span class="kpdp-review-rating-empty" aria-hidden="true">☆</span>
                  <span class="kpdp-review-rating-solid" aria-hidden="true">★</span>
                </label>
                <p v-if="reviewSubmissionErrors.rating" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.rating }}</p>
              </fieldset>

              <div class="kpdp-review-submission-grid">
                <div class="kpdp-review-submission-field" :class="{ 'has-error': reviewSubmissionErrors.name }">
                  <label for="kpdp-review-name">Your name</label>
                  <input
                    id="kpdp-review-name"
                    v-model="reviewSubmissionForm.name"
                    type="text"
                    autocomplete="name"
                    placeholder="Name shown publicly"
                    :aria-invalid="Boolean(reviewSubmissionErrors.name)"
                    required
                    @input="clearReviewSubmissionError('name')"
                  />
                  <p v-if="reviewSubmissionErrors.name" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.name }}</p>
                </div>
                <div class="kpdp-review-submission-field" :class="{ 'has-error': reviewSubmissionErrors.email }">
                  <label for="kpdp-review-email">Email</label>
                  <input
                    id="kpdp-review-email"
                    v-model="reviewSubmissionForm.email"
                    type="email"
                    autocomplete="email"
                    placeholder="Used for verification only"
                    :aria-invalid="Boolean(reviewSubmissionErrors.email)"
                    required
                    @input="clearReviewSubmissionError('email')"
                  />
                  <p v-if="reviewSubmissionErrors.email" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.email }}</p>
                </div>
              </div>

              <div v-if="reviewSubmissionMode === 'review'" class="kpdp-review-submission-field kpdp-review-submission-region">
                <label for="kpdp-review-region">Country / region</label>
                <div class="kpdp-review-country-select" :class="{ 'is-open': isReviewCountryOpen }" @click.stop>
                  <input
                    id="kpdp-review-region"
                    v-model="reviewSubmissionForm.region"
                    type="search"
                    autocomplete="country-name"
                    placeholder="US - United States"
                    role="combobox"
                    aria-controls="kpdp-review-country-options"
                    :aria-expanded="isReviewCountryOpen"
                    @focus="isReviewCountryOpen = true"
                    @input="isReviewCountryOpen = true"
                  />
                  <div
                    v-if="isReviewCountryOpen"
                    id="kpdp-review-country-options"
                    class="kpdp-review-country-options"
                    role="listbox"
                    aria-label="Country options"
                  >
                    <button
                      v-for="country in filteredReviewCountryOptions"
                      :key="country"
                      type="button"
                      role="option"
                      :aria-selected="reviewSubmissionForm.region === country"
                      :class="{ 'is-selected': reviewSubmissionForm.region === country }"
                      @click="selectReviewCountry(country)"
                    >
                      {{ country }}
                    </button>
                    <span v-if="!filteredReviewCountryOptions.length" class="kpdp-review-country-empty">No matching country</span>
                  </div>
                </div>
              </div>

              <div v-if="reviewSubmissionMode === 'review'" class="kpdp-review-submission-field" :class="{ 'has-error': reviewSubmissionErrors.title }">
                <label for="kpdp-review-title">Review title</label>
                <input
                  id="kpdp-review-title"
                  v-model="reviewSubmissionForm.title"
                  type="text"
                  autocomplete="off"
                  placeholder="What should other customers know?"
                  :aria-invalid="Boolean(reviewSubmissionErrors.title)"
                  required
                  @input="clearReviewSubmissionError('title')"
                />
                <p v-if="reviewSubmissionErrors.title" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.title }}</p>
              </div>

              <div
                class="kpdp-review-submission-field"
                :class="{ 'has-error': reviewSubmissionMode === 'review' ? reviewSubmissionErrors.body : reviewSubmissionErrors.question }"
              >
                <label :for="reviewSubmissionMode === 'review' ? 'kpdp-review-body' : 'kpdp-question-body'">
                  {{ reviewSubmissionMode === 'review' ? 'Review' : 'Question' }}
                </label>
                <textarea
                  v-if="reviewSubmissionMode === 'review'"
                  id="kpdp-review-body"
                  v-model="reviewSubmissionForm.body"
                  rows="5"
                  placeholder="Tell us about installation, finish, fit, and the finished space."
                  :aria-invalid="Boolean(reviewSubmissionErrors.body)"
                  required
                  @input="clearReviewSubmissionError('body')"
                ></textarea>
                <textarea
                  v-else
                  id="kpdp-question-body"
                  v-model="reviewSubmissionForm.question"
                  rows="5"
                  placeholder="Ask about specifications, installation, finish, or compatibility."
                  :aria-invalid="Boolean(reviewSubmissionErrors.question)"
                  required
                  @input="clearReviewSubmissionError('question')"
                ></textarea>
                <p v-if="reviewSubmissionMode === 'review' && reviewSubmissionErrors.body" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.body }}</p>
                <p v-if="reviewSubmissionMode === 'question' && reviewSubmissionErrors.question" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.question }}</p>
              </div>

              <div
                v-if="reviewSubmissionMode === 'review'"
                class="kpdp-review-submission-field kpdp-review-submission-media-field"
                :class="{ 'has-error': reviewSubmissionErrors.media }"
              >
                <label for="kpdp-review-media">Project media</label>
                <div class="kpdp-review-upload-row">
                  <label class="kpdp-review-upload-control" for="kpdp-review-media">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 5v10" />
                      <path d="m8 9 4-4 4 4" />
                      <path d="M5 15v3.5h14V15" />
                    </svg>
                    <span>Add media</span>
                  </label>
                  <em>{{ reviewSubmissionMediaSummary }}</em>
                </div>
                <input
                  id="kpdp-review-media"
                  class="sr-only"
                  type="file"
                  :accept="reviewSubmissionMediaAccept"
                  multiple
                  @change="handleReviewSubmissionMediaChange"
                />
                <p v-if="reviewSubmissionErrors.media" class="kpdp-review-submission-error">{{ reviewSubmissionErrors.media }}</p>
              </div>

              <label v-if="reviewSubmissionMode === 'question'" class="kpdp-review-submission-check">
                <input v-model="reviewSubmissionForm.notify" type="checkbox" />
                <span>Email me when this question is answered.</span>
              </label>

              <footer>
                <button type="submit" :class="{ 'is-loading': isReviewSubmissionSubmitting }" :disabled="isReviewSubmissionSubmitting">
                  <span class="kpdp-review-load-spinner" aria-hidden="true"></span>
                  <span>{{ isReviewSubmissionSubmitting ? 'Submitting' : 'Submit' }}</span>
                </button>
              </footer>
            </form>
          </div>
        </section>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="kpdp-review-photo-dialog" @after-leave="handleReviewPhotoDialogAfterLeave">
        <section
          v-if="isReviewPhotoGalleryOpen"
          class="kpdp-review-photo-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Review media gallery"
        >
          <button type="button" class="kpdp-review-photo-backdrop" aria-label="Close review media gallery" @click="closeReviewPhotoGallery" />
          <div class="kpdp-review-photo-panel">
            <button type="button" class="kpdp-review-photo-close" aria-label="Close review media gallery" @click="closeReviewPhotoGallery">
              <span aria-hidden="true"></span>
            </button>
            <div class="kpdp-review-media-viewer">
              <div class="kpdp-review-media-stage">
                <figure class="kpdp-review-media-frame" :class="{ 'is-video': activeReviewMedia.type === 'video' }">
                  <video
                    v-if="activeReviewMedia.type === 'video'"
                    :key="activeReviewMedia.videoSrc ?? activeReviewMedia.src"
                    :poster="activeReviewMedia.src"
                    :src="activeReviewMedia.videoSrc"
                    controls
                    playsinline
                  ></video>
                  <img v-else :src="activeReviewMedia.src" :alt="activeReviewMedia.alt" />
                </figure>
                <button
                  v-if="activeReviewMediaItems.length > 1"
                  type="button"
                  class="kpdp-review-media-nav kpdp-review-media-nav-prev"
                  aria-label="Previous review media"
                  @click="moveReviewMedia(-1)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5-6 6.5 6 6.5" /></svg>
                </button>
                <button
                  v-if="activeReviewMediaItems.length > 1"
                  type="button"
                  class="kpdp-review-media-nav kpdp-review-media-nav-next"
                  aria-label="Next review media"
                  @click="moveReviewMedia(1)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5.5 6 6.5-6 6.5" /></svg>
                </button>
              </div>

              <aside class="kpdp-review-media-detail">
                <button type="button" class="kpdp-review-media-close" aria-label="Close review media gallery" @click="closeReviewPhotoGallery">
                  <span aria-hidden="true"></span>
                </button>
                <div class="kpdp-review-media-author">
                  <span class="kpdp-review-media-avatar" aria-hidden="true">{{ activeReviewMediaAuthorInitials }}</span>
                  <div>
                    <strong>{{ activeReviewMediaAuthorName }}</strong>
                    <p>{{ activeReviewMediaContext?.region ?? 'Shared by customer projects' }}</p>
                    <span>{{ activeReviewMediaContext?.verifiedLabel ?? 'Customer media' }}</span>
                  </div>
                </div>

                <div v-if="activeReviewMediaContext" class="kpdp-review-media-copy">
                  <div class="kpdp-review-media-copy-head">
                    <div class="kpdp-review-stars" :aria-label="`${activeReviewMediaContext.rating} out of 5 stars`">
                      <span v-for="star in 5" :key="star" class="kpdp-review-star" :class="{ 'is-muted': star > activeReviewMediaContext.rating }" aria-hidden="true"></span>
                    </div>
                    <time>{{ activeReviewMediaContext.date }}</time>
                  </div>
                  <h3>{{ activeReviewMediaContext.title }}</h3>
                  <p>{{ activeReviewMediaContext.body }}</p>
                </div>

                <div v-if="activeReviewMediaContext" class="kpdp-review-media-helpful" aria-label="Review helpful votes">
                  <span>Was this helpful?</span>
                  <button type="button" aria-label="Mark review helpful">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10H4V10h3Zm4-6-3 7v9h9.4c1 0 1.8-.7 2-1.6l1.3-6c.3-1.2-.6-2.4-1.9-2.4H14l.8-3.9c.2-1-.5-2.1-1.6-2.1H11Z" /></svg>
                    {{ activeReviewMediaContext.helpfulUp }}
                  </button>
                  <button type="button" aria-label="Mark review not helpful">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V4H4v10h3Zm4 6-3-7V4h9.4c1 0 1.8.7 2 1.6l1.3 6c.3 1.2-.6 2.4-1.9 2.4H14l.8 3.9c.2 1-.5 2.1-1.6 2.1H11Z" /></svg>
                    {{ activeReviewMediaContext.helpfulDown }}
                  </button>
                </div>
              </aside>

              <div
                ref="reviewMediaThumbRail"
                class="kpdp-review-media-thumbs"
                :class="{ 'is-dragging': reviewMediaThumbDrag.active && reviewMediaThumbDrag.moved }"
                aria-label="Review media thumbnails"
                @pointerdown="startReviewMediaThumbDrag"
                @pointermove="moveReviewMediaThumbDrag"
                @pointerup="endReviewMediaThumbDrag"
                @pointercancel="endReviewMediaThumbDrag"
              >
                <button
                  v-for="(media, mediaIndex) in activeReviewMediaItems"
                  :key="`${media.author}-${media.src}-${mediaIndex}`"
                  type="button"
                  :class="{ 'is-active': mediaIndex === activeReviewMediaIndex, 'is-video': media.type === 'video' }"
                  :aria-label="`Show review media ${mediaIndex + 1}`"
                  @click="selectReviewMediaFromThumb(mediaIndex)"
                >
                  <img :src="media.src" :alt="media.alt" loading="lazy" />
                  <span v-if="media.type === 'video'" class="kpdp-review-media-play" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="kpdp-gallery-dialog" @after-leave="handleGalleryAfterLeave">
        <section v-if="isGalleryOpen" class="kpdp-gallery-dialog" role="dialog" aria-modal="true" aria-label="Product image gallery">
          <button type="button" class="kpdp-gallery-backdrop" aria-label="Close image gallery" @click="closeGallery" />
          <div
            ref="galleryPanel"
            class="kpdp-gallery-panel"
            :class="{
              'is-zoomed': isGalleryZoomed,
              'is-playing': isGalleryPlaying,
              'is-fullscreen': isGalleryFullscreen,
              'is-thumbs-hidden': !areGalleryThumbsVisible
            }"
          >
            <header class="kpdp-gallery-panel-head">
              <p>{{ activeGalleryIndex + 1 }} / {{ galleryImages.length }}</p>
              <div class="kpdp-gallery-tools" aria-label="Gallery tools">
                <button
                  type="button"
                  class="kpdp-gallery-tool kpdp-gallery-tool-zoom"
                  :class="{ 'is-zoom-out': isGalleryZoomed }"
                  :aria-label="isGalleryZoomed ? 'Zoom out' : 'Zoom in'"
                  :aria-pressed="isGalleryZoomed"
                  :disabled="Boolean(activeGalleryVideo)"
                  @click="toggleGalleryZoom"
                >
                  <svg class="kpdp-gallery-zoom-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4.2-4.2" />
                    <path v-if="!isGalleryZoomed" d="M11 8v6" />
                    <path d="M8 11h6" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="kpdp-gallery-tool kpdp-gallery-tool-play"
                  :aria-label="isGalleryPlaying ? 'Pause slideshow' : 'Play slideshow'"
                  :aria-pressed="isGalleryPlaying"
                  @click="toggleGalleryPlayback"
                >
                  <span aria-hidden="true"></span>
                  <svg
                    v-if="isGalleryPlaying"
                    :key="galleryPlaybackKey"
                    class="kpdp-gallery-play-progress"
                    viewBox="0 0 44 44"
                    aria-hidden="true"
                  >
                    <circle cx="22" cy="22" r="19" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="kpdp-gallery-tool kpdp-gallery-tool-fullscreen"
                  :aria-label="isGalleryFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
                  :aria-pressed="isGalleryFullscreen"
                  @click="toggleGalleryFullscreen"
                >
                  <span aria-hidden="true"></span>
                </button>
                <button
                  type="button"
                  class="kpdp-gallery-tool kpdp-gallery-tool-thumbs"
                  :aria-label="areGalleryThumbsVisible ? 'Hide thumbnails' : 'Show thumbnails'"
                  :aria-pressed="areGalleryThumbsVisible"
                  @click="toggleGalleryThumbs"
                >
                  <span aria-hidden="true"></span>
                </button>
                <button type="button" class="kpdp-gallery-close" aria-label="Close image gallery" @click="closeGallery">
                  <span aria-hidden="true"></span>
                </button>
              </div>
            </header>
            <div class="kpdp-lightbox" @click.self="closeGalleryFromEmptyArea">
              <button type="button" class="kpdp-lightbox-arrow kpdp-lightbox-prev" aria-label="Previous image" @click="moveGallery(-1)" />

              <figure
                class="kpdp-lightbox-stage"
                :class="{
                  'is-panning': isGalleryPanning,
                  'is-pinching': isGalleryPinching,
                  'is-swiping': isGallerySwiping,
                  'is-slide-animating': isGallerySlideAnimating,
                  'is-video': Boolean(activeGalleryVideo)
                }"
                @wheel.prevent="handleGalleryWheelZoom"
                @pointerdown="startGalleryImageDrag"
                @pointermove="moveGalleryImageDrag"
                @pointerup="endGalleryImageDrag"
                @pointercancel="endGalleryImageDrag"
                @dragstart.prevent
              >
                <div
                  v-if="activeGalleryVideo"
                  class="kpdp-lightbox-video"
                  :style="{
                    '--kpdp-swipe-x': `${gallerySwipeX}px`
                  }"
                >
                  <video
                    v-if="isActiveGalleryVideoPlaying"
                    :key="activeGalleryVideo.videoSrc"
                    :src="activeGalleryVideo.videoSrc"
                    :poster="activeGalleryVideo.poster"
                    controls
                    autoplay
                    playsinline
                    preload="metadata"
                  ></video>
                  <button
                    v-else
                    type="button"
                    class="kpdp-lightbox-video-poster"
                    :aria-label="`Play ${activeGalleryVideo.label}`"
                    @click="playActiveGalleryVideo"
                  >
                    <img :src="activeGalleryVideo.poster" :alt="activeGalleryVideo.label" />
                    <span aria-hidden="true"></span>
                  </button>
                </div>
                <img
                  v-else
                  :key="activeGalleryIndex"
                  class="kpdp-lightbox-active-image"
                  :class="{ 'is-intro-enabled': shouldAnimateGalleryImageIntro }"
                  :src="getGalleryMediaImage(activeGalleryMedia, activeGalleryIndex)"
                  :alt="activeGalleryIndex === 0 ? selectedVariant.label : activeGalleryMedia.label"
                  draggable="false"
                  :style="{
                    '--kpdp-zoom-scale': galleryZoomScale,
                    '--kpdp-zoom-origin': galleryZoomOrigin,
                    '--kpdp-swipe-x': `${gallerySwipeX}px`,
                    '--kpdp-pan-x': `${galleryPanX}px`,
                    '--kpdp-pan-y': `${galleryPanY}px`
                  }"
                  @animationend="finishGalleryImageIntro"
                />
                <img
                  v-if="adjacentGalleryMedia && !isGalleryZoomed"
                  class="kpdp-lightbox-adjacent-image"
                  :src="getGalleryMediaImage(adjacentGalleryMedia, adjacentGalleryMediaIndex)"
                  :alt="adjacentGalleryMedia.label"
                  draggable="false"
                  :style="{
                    '--kpdp-adjacent-x': `${gallerySlideStep * galleryStageWidth + gallerySwipeX}px`
                  }"
                />
              </figure>

              <button type="button" class="kpdp-lightbox-arrow kpdp-lightbox-next" aria-label="Next image" @click="moveGallery(1)" />
            </div>
            <aside
              ref="galleryThumbRail"
              class="kpdp-lightbox-thumbs"
              aria-label="Image thumbnails"
              @pointerdown="startThumbDrag"
              @pointermove="moveThumbDrag"
              @pointerup="endThumbDrag"
              @pointercancel="endThumbDrag"
            >
              <button
                v-for="(media, index) in galleryImages"
                :key="`thumb-${media.src}`"
                type="button"
                :class="{ 'is-active': index === activeGalleryIndex, 'is-video': isVideoMedia(media) }"
                :aria-label="isVideoMedia(media) ? `Play video ${index + 1}` : `Show image ${index + 1}`"
                :aria-current="index === activeGalleryIndex ? 'true' : undefined"
                @click="selectGalleryImageFromThumb(index)"
              >
                <img :src="getGalleryMediaImage(media, index)" :alt="media.label" loading="lazy" />
                <span v-if="isVideoMedia(media)" class="kpdp-thumb-play" aria-hidden="true"></span>
              </button>
            </aside>
          </div>
        </section>
      </Transition>
    </Teleport>
  </main>
</template>
