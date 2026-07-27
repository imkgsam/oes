import {
  INSPIRATION_CATEGORY_SLUG,
  type InspirationFilter
} from './inspiration-category-inventory'

export type InspirationTile = {
  alt: string
  aspectRatio: number
  categories: InspirationFilter[]
  src: string
}

export type InspirationHotspotProduct = {
  collection: string
  href: string
  image: string
  imageAlt: string
  price: string
  title: string
}

// capturedFixtureRows keeps the full reference gallery source order, crop ratios, and category mask as user-directed test data.
const capturedFixtureRows: Array<[src: string, aspectRatio: number, categoryMask: number]> = [
  ["https://www.westelm.com/netstorage/images/edam/001-pl-su26-wek-pink-chicken-kid-room-floral--main-v01-262.jpg", 0.4685, 7],
  ["https://www.westelm.com/netstorage/images/edam/002-pl-su26-wek-pink-chicken-floral-boa-main-v01-099.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/003-pl-su26-wek-pink-chicken-floral-boa-detail-v01-018.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/004-pdi-2983538-josephine-desk-dark-walnut---kids-su26-main-034.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/005-pl-su26-wek-lawn-pawty-nursery-detail-v01-089.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/006-pl-su26-wek-lawn-pawty-nursery-main-v01-098_no blanket-baby3.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/007-pl-su26-wek-pink-chicken-nursery-balloons-detail-v01-216.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/008-pl-su26-wek-pink-chicken-nursery-balloons-main-v01-403.jpg", 0.4614, 6],
  ["https://www.westelm.com/netstorage/images/edam/009-pl-su26-wek-lawn-pawty-kid-room-main-v01-129.jpg", 0.7875, 7],
  ["https://www.westelm.com/netstorage/images/edam/010-mid-century-mini-desk-36-4-xl.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/011-pl-su26-wek-mint-drenched-nursery-main-v01-003_No_Blanket_green-baby1.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/012-pl-su26-wek-mint-drenched-nursery-detail-v01-vertical-247.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/013-pl-detail-wek-little-gardener-elora-kid-room-sp24-v01-030.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/014-pl-su26-wek-neutral-nursery-sheep-detail-v01-003.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/015-pl-su26-wek-neutral-nursery-sheep-main-v01-131_large rug-baby1.jpg", 0.4614, 6],
  ["https://www.westelm.com/netstorage/images/edam/016-pl-su26-wek-beach-daze-boy-kid-room-detail-v01-020-yellow.jpg", 0.7875, 7],
  ["https://www.westelm.com/netstorage/images/edam/017-pdi-4967069-daisy-mini-desk-blonde--kids-su26-main-044.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/01-pl-fa25-wek-joseph-altuzarra-nursery-detail-v01-058_Slice01.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/02-pl-fa25-wek-mermaid-kids-room-main-v01-242.jpg", 0.4685, 7],
  ["https://www.westelm.com/netstorage/images/edam/03-pl-sp26-wek-butterfly-shared-room-detail-v01-186.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/04-pdi-8224138-josephine-dresser--dark-walnut--ho24-main-026.jpg", 1.1977, 7],
  ["https://www.westelm.com/netstorage/images/edam/05-pl-detail-wek-story-bunk-sleepover-sp24-v01-048.jpg", 1.1977, 7],
  ["https://www.westelm.com/netstorage/images/edam/06-pl-wek-soft-safari-nursery-wk1-sp25-main-v01-277_saturation_increase.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/07-pl-fa25-wek-mermaid-nursery-detail-v01-005.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/08-pl-wek-x-eva-chen-x-bedroom-main-v01-457.jpg", 1.1977, 7],
  ["https://www.westelm.com/netstorage/images/edam/09-pl-main-wek-elora-trundle-things-that-go-kid-room-sp24-v01-060.jpg", 0.7875, 7],
  ["https://www.westelm.com/netstorage/images/edam/10-pl-wek-rhode-nursery-su25-main-v01-071.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/11-pl-wek-vivienne-kid-room-fa24-main-v01-038.jpg", 0.7875, 7],
  ["https://www.westelm.com/netstorage/images/edam/12-pl-wek-x-eva-chen-x-playroom-main-v01-345.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/13-pdi-8047659-billie-nightstand-limewash-blue-SP25-main-001.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/14-pl-detail-wek-little-gardener-elora-kid-room-sp24-v01-030.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/15-pl-wek-party-animal-kid-room-su25-detail-v01-111.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/16-pl-detail-wek-attic-playroom-ho23-v01-0239.jpg", 0.7772, 4],
  ["https://www.westelm.com/netstorage/images/edam/17-pdi-grp-bucatini-rocker-+-ottoman-su24-detail-008.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/18-pl-fa25-wek-joseph-altuzarra-kids-room-main-v01-112.jpg", 0.4614, 7],
  ["https://www.westelm.com/netstorage/images/edam/19-pdi-6579161-joseph-altuzarra-blooming-garden-crib-sheet.jpg", 1.176, 6],
  ["https://www.westelm.com/netstorage/images/edam/20-pdi-8871028-ziggy-storage-crib-natural-birch---kids-ho25-main-002.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/21-pdi-6574871-calma-upholstered-bed-twin-pack-mauve-distressed-velvet-fa24-main-044.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/22-pl-wek-ziggy-christmas-playroom-ho24-main-v02-Vertical-163.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/23-pdi-586463-gwyn-dresser-wide-changing-table-pack-hudson--sp25-main-012.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/24-pl-detail-wek-story-bunk-sleepover-sp24-v01-038.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/28-pl-wek-joseph-altuzara-nursery-capsule-su25-detail-v01-034.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/29-pdi-grp-ziggy-wall-system---open-closed-storage-playroom--group-007.jpg", 0.7772, 4],
  ["https://www.westelm.com/netstorage/images/edam/30-pl-wek-joseph-altuzara-nursery-capsule-su25-main-V02-ROMAN-PLATE-259.jpg", 0.4614, 6],
  ["https://www.westelm.com/netstorage/images/edam/31-pl-fa25-wek-woodland-nursery-detail-v01-077.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/32-pl-wek-mc-celadon-nursery-sp23-detail-060.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/33-pl-tiny-chair-boa-ho23-main-001-013.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/36-pl-main-wek-joseph-altuzarra-zodiac-kid-room-fa23-v02-001.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/37-pl-fa25-wek-mermaid-nursery-main-v01-268-V2-Blocks.jpg", 0.7772, 4],
  ["https://www.westelm.com/netstorage/images/edam/38-pl-fa25-wek-woodland-nursery-detail-v01-023.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/39-pl-wek-craft-room-and-holiday-layer-ho22-main-156.jpg", 0.7772, 4],
  ["https://www.westelm.com/netstorage/images/edam/40-pl-detail-wek-ida-rainbow-su23-v01-018.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/41-pl-sp26-wek-butterfly-shared-room-main-v01-416.jpg", 0.4614, 7],
  ["https://www.westelm.com/netstorage/images/edam/42-pl-wek-lively-kid-room-fa24-detail-v01-133.jpg", 1.176, 7],
  ["https://www.westelm.com/netstorage/images/edam/43-pl-detail-wek-scallop-nursery-refresh-su24-v01-001.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/44-pl-wek-surfshack-kid-room-su25-main-v01-774-Vertical.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/45-pl-wek-wildflower-kid-shared-room-su25-detail-v01-041.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/46-pl-wek-party-animal-kid-room-su25-detail-v01-109.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/47-pl-main-keke-palmer-ht-nursery-ho23-v01_037.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/48-pl-wek-x-eva-chen-x-playroom-main-v01-091.jpg", 0.4614, 4],
  ["https://www.westelm.com/netstorage/images/edam/49-pl-wek-party-animal-playroom-su25-DETAIL-v01-053.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/50-pdi-6363437-wl-scallop-crib--toasted-oak--su24-main-018.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/51-pl-fa25-wek-mermaid-kids-room-detail-v01-019.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/52-pl-main-wek-ida-shared-space-nursery-ho23-v01-115.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/53-pl-main-wek-gemini-trundle-bed-su23-v01-132-gif.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/54-pl-main-wek-joseph-altuzarra-cloud-nursery-fa23-v02-001.jpg", 0.4614, 6],
  ["https://www.westelm.com/netstorage/images/edam/55-pl-wek-no-nail-mitzi-headboard-big-kid-su24-main-v01-UGT-103.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/56-pl-wek-surfshack-kid-room-su25-detail-v01-148.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/57-pl-wek-x-eva-chen-x-bedroom-main-v01-350.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/58-SP25-PL-Darling-Daisy-Bedroom-Vignette-002.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/59-pl-fa25-wek-joseph-altuzarra-kids-room-detail-v01-114.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/60-pl-wek-ziggy-christmas-playroom-ho24-detail-v01-062.jpg", 1.176, 4],
  ["https://www.westelm.com/netstorage/images/edam/61-pdi-grp-daisy-we-white-collection--group-052.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/62-pl-detail-wek-gemini-toddler-nursery-things-that-go-sp24-v01-005.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/63-pl-fa25-wek-joseph-altuzarra-kids-room-main-v01-836-plate-dresser.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/64-pl-main-wek-leo-pine-twin-nursery-sp24-v02-209.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/65-pl-fa25-wek-mermaid-kids-room-detail-v01-075.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/66-pl-wek-party-animal-kid-room-su25-main-v01-307.jpg", 0.4614, 7],
  ["https://www.westelm.com/netstorage/images/edam/67-pl-detail-wek-joseph-altuzarra-cloud-nursery-fa23-v01-282.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/68-pl-wek-billie-nursery-catalog-strip-in-sp25-main-v01-002.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/69-pl-main-wek-story-bunk-sleepover-sp24-v01-112.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/70-pl-wek-x-eva-chen-x-playroom-main-v01-178.jpg", 0.7772, 4],
  ["https://www.westelm.com/netstorage/images/edam/71-pl-wek-little-bayou-nursery-wk-2-sp25-detail-v01-019.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/72-pl-wek-earth-lover-nursery-su25-main-v01-1128.jpg", 0.4614, 6],
  ["https://www.westelm.com/netstorage/images/edam/73-pl-wek-dino-shared-miso-bunk-wk-2-sp25-main-v01-085.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/74-pl-wek-wildflower-kid-shared-room-su25-main-v01-110.jpg", 0.4614, 7],
  ["https://www.westelm.com/netstorage/images/edam/75-pl-detail-wek-little-gardener-elora-kid-room-sp24-v01-001.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/76-pl-detail-wek-little-gardener-elora-nursery-sp24-v01-002.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/77-pl-detail-wek-leo-pine-twin-nursery-sp24-v01-055.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/78-pl-main-wek-gemini-toddler-nursery-things-that-go-sp24-v01-142.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/79-pl-wek-craft-room-and-holiday-layer-ho22-detail-130.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/80-pl-detail-wek-scallop-kid-room-refresh-su24-v01-001.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/81-pl-main-wek-platform-bed-cerused-white-sunny-skies-su23-v01-010.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/82-pl-main-wek-little-gardener-elora-nursery-sp24-v01-084.jpg", 0.4614, 6],
  ["https://www.westelm.com/netstorage/images/edam/83-collection-josephine-bedroom-collection-shot-main-072.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/84-pl-sp26-wek-butterfly-shared-room-detail-v01-163.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/85-pl-wek-earth-lover-nursery-su25-detail-v01-108.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/86-pl-wek-x-eva-chen-x-bedroom-main-v01-305.jpg", 1.176, 7],
  ["https://www.westelm.com/netstorage/images/edam/87-pdi-wekids2591761-ziggy-slide-captains-bed-twin-pack-naturalwhite--ho24-main-005.jpg", 0.7772, 7],
  ["https://www.westelm.com/netstorage/images/edam/88-pl-wek-wildflower-kid-shared-room-su25-detail-v01-008.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/89-pl-wek-ziggy-christmas-playroom-ho24-main-v01-105.jpg", 0.7772, 4],
  ["https://www.westelm.com/netstorage/images/edam/90-pl-main-keke-palmer-ht-nursery-ho23-v01_066.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/91-pl-main-wek-midcentury-convertible-crib-shared-space-sp24-v01-127.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/92-pl-wek-earth-lover-nursery-su25-detail-v01-159.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/93-pl-wek-mc-sage-nursery-fa24-main-v02-096.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/94-pl-wek-rhode-nursery-su25-detail-v01-052.jpg", 1.183, 6],
  ["https://www.westelm.com/netstorage/images/edam/95-pdi-6158410-billie-dresser-wide-dresser-limewash-blue-sp25-main-002.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/96-pl-detail-wek-gemini-trundle-bed-su23-v01-005.jpg", 1.183, 7],
  ["https://www.westelm.com/netstorage/images/edam/97-pl-wek-vivienne-nursery-fa24-main-v01-057.jpg", 0.7772, 6],
  ["https://www.westelm.com/netstorage/images/edam/98-pdi-wekids11052988-tiny-chair-pack-naturalforest-greensagelight-blue-pz-ho23-main-001-PZ.jpg", 1.183, 4],
  ["https://www.westelm.com/netstorage/images/edam/99-pl-main-wek-scallop-kid-room-refresh-su24-v01-116.jpg", 0.4614, 7],
  ["https://images.pexels.com/photos/5942740/pexels-photo-5942740.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.6667, 8],
  ["https://images.pexels.com/photos/19690520/pexels-photo-19690520.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/2412079/pexels-photo-2412079.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.6667, 8],
  ["https://images.pexels.com/photos/22020950/pexels-photo-22020950.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/32710695/pexels-photo-32710695.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.6667, 8],
  ["https://images.pexels.com/photos/37926048/pexels-photo-37926048.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.6667, 8],
  ["https://images.pexels.com/photos/20708738/pexels-photo-20708738.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/15929723/pexels-photo-15929723.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/17406284/pexels-photo-17406284.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/15414562/pexels-photo-15414562.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/6605793/pexels-photo-6605793.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/22483424/pexels-photo-22483424.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/36937387/pexels-photo-36937387.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/36771629/pexels-photo-36771629.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.6667, 8],
  ["https://images.pexels.com/photos/19572798/pexels-photo-19572798.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
  ["https://images.pexels.com/photos/16450226/pexels-photo-16450226.jpeg?auto=compress&cs=tinysrgb&w=1200", 0.75, 8],
]

// inspirationTiles maps the captured rows into the component contract while assigning the current test categories.
export const inspirationTiles: InspirationTile[] = capturedFixtureRows.map(([src, aspectRatio, categoryMask]) => ({
  alt: referenceAlt(categoryMask),
  aspectRatio,
  categories: [
    ...(categoryMask & 8 ? [INSPIRATION_CATEGORY_SLUG.PETS] : []),
    ...(!(categoryMask & 8) ? [INSPIRATION_CATEGORY_SLUG.KIDS] : []),
    ...(categoryMask & 1 ? [INSPIRATION_CATEGORY_SLUG.TETRO] : [])
  ],
  src
}))

// inspirationHotspotProducts preserves the captured Curalate product metadata used by the reference room scene.
export const inspirationHotspotProducts: InspirationHotspotProduct[] = [
  {
    collection: 'WEST ELM',
    href: 'https://www.westelm.com/products/kane-2-piece-wedge-chaise-sectional-113/',
    image: 'https://edge.curalate.com/v1/img/MePOAw-QgQVH8Gn32ClnIhhfP7UMiOGQ66W4JvjksCs=/d/l',
    imageAlt: 'Kane sectional in the New Modernist living room reference.',
    price: '$2,999',
    title: 'Kane 2-Piece Wedge Chaise Sectional (113")'
  },
  {
    collection: 'WEST ELM',
    href: 'https://www.westelm.com/products/3473022/?catalogId=71',
    image: 'https://assets.weimgs.com/weimgs/rk/images/wcm/products/202625/0334/sintra-pedestal-coffee-table-30-36-c.jpg',
    imageAlt: 'Sintra round pedestal coffee table in dark bronze.',
    price: '$599 - $699',
    title: 'Sintra Round Pedestal Coffee Table (30"-36")'
  },
  {
    collection: 'WEST ELM',
    href: 'https://www.westelm.com/products/5356008/?catalogId=71',
    image: 'https://assets.weimgs.com/weimgs/rk/images/wcm/products/202624/0423/laila-chair-c.jpg',
    imageAlt: 'Laila chair in dark ochre chenille.',
    price: '$699 - $1,898',
    title: 'Laila Chair'
  },
  {
    collection: 'WEST ELM',
    href: 'https://www.westelm.com/products/sharpe-cabinet-32/',
    image: 'https://assets.weimgs.com/weimgs/rk/images/wcm/products/202624/0670/sharpe-bar-cabinet-c.jpg',
    imageAlt: 'Sharpe cabinet in a warm wood finish.',
    price: '$1,299',
    title: 'Sharpe Cabinet (32")'
  },
  {
    collection: 'WEST ELM',
    href: 'https://www.westelm.com/products/endellion-wall-mirror/',
    image: 'https://assets.weimgs.com/weimgs/rk/images/wcm/products/202623/0124/endellion-wall-mirror-1-c.jpg',
    imageAlt: 'Endellion wall mirror with an antique brass frame.',
    price: '$799',
    title: 'Endellion Wall Mirror'
  }
]

// referenceAlt gives every reference image a concise content category while the remote fixture remains intentionally visual-first.
function referenceAlt(categoryMask: number): string {
  if (categoryMask & 8) {
    return 'Pet-friendly interior inspiration with a companion animal.'
  }
  if (categoryMask & 1) {
    return 'Tetro-inspired room styling from the reference inspiration gallery.'
  }
  return 'Kids room inspiration from the reference gallery.'
}
