import { join } from 'node:path';
import { buildSiteAuditEnvelope } from '../application/audit/site-audit-envelope';
import { checkActiveLocaleCompleteness, SiteLocaleCompletenessError } from '../domain/publication/locale-completeness';
import { assertSlugAvailable, normalizeSiteSlug, siteSlugNamespaceForContentType, SiteSlugConflictError } from '../domain/publication/site-slug-policy';
import { buildBlogPublicView, buildCategoryPublicView, buildNewsPublicView, buildArticleCategoryPublicView, buildProductPublicView } from '../domain/public-view/public-view-builders';
import { assertContentCategoryReferencesValid, ContentCategoryReferenceError } from '../domain/publication/content-category-policy';
import { createSyncBatchPlan } from '../domain/sync/sync-batch-planner';
import { issuePreviewToken, validatePreviewToken } from '../domain/preview/preview-token';
describe('site-service publication and sync Unit', () => {
    it('Slug policy / rejects duplicate site resource locale slugs', () => {
        expect(() => assertSlugAvailable([
            {
                siteId: 'site_a',
                resourceType: 'product',
                locale: 'en-US',
                slug: 'basin-100',
                resourceId: 'product_a'
            }
        ], {
            siteId: 'site_a',
            resourceType: 'product',
            locale: 'en-US',
            slug: 'basin-100',
            resourceId: 'product_b'
        })).toThrow(SiteSlugConflictError);
        expect(() => assertSlugAvailable([
            {
                siteId: 'site_a',
                resourceType: 'product',
                locale: 'en-US',
                slug: 'basin-100',
                resourceId: 'product_a'
            }
        ], {
            siteId: 'site_a',
            resourceType: 'product',
            locale: 'fr-FR',
            slug: 'basin-100',
            resourceId: 'product_b'
        })).not.toThrow();
    });
    it('Dynamic slug policy / normalizes once and keeps Blog and News namespaces independent', () => {
        expect(normalizeSiteSlug('  Launch-Note  ')).toBe('launch-note');
        expect(siteSlugNamespaceForContentType('blog')).toBe('blog');
        expect(siteSlugNamespaceForContentType('news')).toBe('news');
        expect(() => normalizeSiteSlug('   ')).toThrow('slug is required');
    });
    it('Dynamic slug policy / folds Unicode compatibility-equivalent slugs into one key', () => {
        expect(normalizeSiteSlug('  Ｌａｕｎｃｈ-Ｎｏｔｅ  ')).toBe('launch-note');
    });
    it('Locale completeness / checks active locales and ignores preparing locales', () => {
        expect(() => checkActiveLocaleCompleteness({
            locales: [
                { locale: 'en-US', status: 'active' },
                { locale: 'fr-FR', status: 'preparing' }
            ],
            productPublications: [
                {
                    productId: 'product_a',
                    locale: 'en-US',
                    slug: 'basin-100',
                    displayTitle: 'Basin 100',
                    displayDescription: 'Ceramic basin'
                }
            ],
            contentVersions: [
                {
                    contentId: 'blog_a',
                    contentType: 'blog',
                    locale: 'fr-FR',
                    slug: '',
                    title: '',
                    bodyHtml: ''
                }
            ]
        })).not.toThrow();
        expect(() => checkActiveLocaleCompleteness({
            locales: [{ locale: 'en-US', status: 'active' }],
            productPublications: [
                {
                    productId: 'product_a',
                    locale: 'en-US',
                    slug: '',
                    displayTitle: 'Basin 100',
                    displayDescription: ''
                }
            ],
            contentVersions: []
        })).toThrow(SiteLocaleCompletenessError);
    });
    it('Public view / builds product views without price, inventory, or OES internal fields', () => {
        const view = buildProductPublicView({
            siteId: 'site_a',
            productId: 'product_a',
            locale: 'en-US',
            slug: 'basin-100',
            displayTitle: 'Basin 100',
            displayDescription: 'Ceramic basin',
            seoTitle: 'Basin SEO',
            seoDescription: 'A public-safe basin page',
            seoImage: 'https://cdn.example/basin-og.jpg',
            imageOverride: 'https://cdn.example/basin-main.jpg',
            publishVersion: 7,
            updatedAt: new Date('2026-06-15T08:00:00.000Z'),
            facts: {
                productId: 'product_a',
                summary: 'A compact basin',
                model: 'B100',
                brand: 'OES Bath',
                categoryIds: ['cat_basin'],
                images: [{ url: 'https://cdn.example/master.jpg', alt: 'Master image', role: 'primary' }],
                specs: [{ name: 'Width', value: '600', unit: 'mm', group: 'Dimensions' }],
                internalCost: '99.00'
            }
        });
        expect(view).toEqual(expect.objectContaining({
            site_id: 'site_a',
            resource_type: 'product',
            resource_id: 'product_a',
            locale: 'en-US',
            slug: 'basin-100',
            status: 'published',
            publish_version: 7
        }));
        expect(view.payload).toEqual({
            product_id: 'product_a',
            display_title: 'Basin 100',
            display_description: 'Ceramic basin',
            summary: 'A compact basin',
            model: 'B100',
            brand: 'OES Bath',
            category_ids: ['cat_basin'],
            images: [{ url: 'https://cdn.example/basin-main.jpg', alt: 'Master image', role: 'primary' }],
            specs: [{ name: 'Width', value: '600', unit: 'mm', group: 'Dimensions' }],
            seo: {
                title: 'Basin SEO',
                description: 'A public-safe basin page',
                image: 'https://cdn.example/basin-og.jpg',
                canonical_url: null
            }
        });
        expect(JSON.stringify(view.payload)).not.toMatch(/internalCost|price|inventory/i);
    });
    it('Public view / builds site category views as site-owned taxonomy projections', () => {
        const view = buildCategoryPublicView({
            siteId: 'site_a',
            categoryId: 'cat_basins',
            parentCategoryId: 'cat_bathroom',
            locale: 'en-US',
            slug: 'basins',
            displayTitle: 'Basins',
            description: 'Bathroom basin collections',
            image: 'https://cdn.example/basins.jpg',
            sortOrder: 10,
            seoTitle: 'Bathroom Basins',
            seoDescription: 'Explore basin collections',
            seoImage: 'https://cdn.example/basins-og.jpg',
            publishStatus: 'published',
            publishVersion: 8,
            updatedAt: new Date('2026-06-15T08:00:00.000Z')
        });
        expect(view).toEqual({
            site_id: 'site_a',
            resource_type: 'category',
            resource_id: 'cat_basins',
            locale: 'en-US',
            slug: 'basins',
            status: 'published',
            publish_version: 8,
            updated_at: '2026-06-15T08:00:00.000Z',
            payload: {
                category_id: 'cat_basins',
                parent_category_id: 'cat_bathroom',
                display_title: 'Basins',
                description: 'Bathroom basin collections',
                image: 'https://cdn.example/basins.jpg',
                sort_order: 10,
                seo: {
                    title: 'Bathroom Basins',
                    description: 'Explore basin collections',
                    image: 'https://cdn.example/basins-og.jpg'
                }
            }
        });
    });
    it('Public view / builds sanitized blog and news views', () => {
        const baseContentInput = {
            siteId: 'site_a',
            contentId: 'blog_a',
            locale: 'en-US',
            slug: 'launch-note',
            title: 'Launch note',
            bodyHtml: '<p onclick="x()">Hello<script>alert(1)</script></p>',
            summary: 'Short note',
            coverImage: null,
            coverImageAlt: 'Launch note kiln inspection photo',
            author: 'OES Editorial',
            tags: ['launch'],
            seoTitle: 'Launch SEO',
            seoDescription: 'Launch page',
            seoImage: null,
            publishedAt: new Date('2026-06-15T08:00:00.000Z'),
            publishVersion: 3,
            updatedAt: new Date('2026-06-15T08:30:00.000Z')
        };
        const blog = buildBlogPublicView(baseContentInput);
        const news = buildNewsPublicView({
            ...baseContentInput,
            contentId: 'news_a',
            slug: 'factory-update',
            title: 'Factory update'
        });
        expect(blog.resource_type).toBe('blog');
        expect(blog.payload.body_html).toBe('<p>Hello</p>');
        expect(blog.payload.cover_image_alt).toBe('Launch note kiln inspection photo');
        expect(news.resource_type).toBe('news');
        expect(news.payload.body_html).toBe('<p>Hello</p>');
        expect(news.payload.cover_image_alt).toBe('Launch note kiln inspection photo');
    });
    it('Public view / builds category views with archive SEO and historical slugs', () => {
        const view = buildArticleCategoryPublicView({
            siteId: 'site_a',
            categoryId: 'content_category_guides',
            locale: 'en-US',
            slug: 'how-to-guides',
            displayName: 'How-to Guides',
            archiveIntro: 'Practical installation and buying guides',
            archiveLabel: 'Guides',
            sortOrder: 20,
            historicalSlugs: ['guides'],
            seoTitle: 'How-to Guides',
            seoDescription: 'Ceramic product guides',
            seoImage: 'https://cdn.example/guides-og.jpg',
            publishVersion: 6,
            updatedAt: new Date('2026-06-15T08:00:00.000Z')
        });
        expect(view).toEqual({
            site_id: 'site_a',
            resource_type: 'article-category',
            resource_id: 'content_category_guides',
            locale: 'en-US',
            slug: 'how-to-guides',
            status: 'published',
            publish_version: 6,
            updated_at: '2026-06-15T08:00:00.000Z',
            payload: {
                content_category_id: 'content_category_guides',
                display_name: 'How-to Guides',
                archive_intro: 'Practical installation and buying guides',
                archive_label: 'Guides',
                sort_order: 20,
                historical_slugs: ['guides'],
                seo: {
                    title: 'How-to Guides',
                    description: 'Ceramic product guides',
                    image: 'https://cdn.example/guides-og.jpg'
                }
            }
        });
    });
    it('Category policy / requires a non-deleted same-locale published revision', () => {
        expect(() => assertContentCategoryReferencesValid({
            contentType: 'blog',
            targetLocale: 'en-US',
            referencedCategoryIds: ['content_category_news'],
            categories: [
                {
                    categoryId: 'content_category_news',
                    localeVersions: [
                        {
                            locale: 'en-US',
                            slug: 'press',
                            displayName: 'Press',
                            lastPublishedRevision: 1
                        },
                        {
                            locale: 'zh-CN',
                            slug: 'xinwen',
                            displayName: '新闻',
                            seoTitle: '新闻',
                            seoDescription: '公司新闻'
                        }
                    ]
                }
            ]
        })).not.toThrow();
        expect(() => assertContentCategoryReferencesValid({
            contentType: 'news',
            targetLocale: 'zh-CN',
            referencedCategoryIds: ['content_category_company'],
            categories: [
                {
                    categoryId: 'content_category_company',
                    localeVersions: [
                        {
                            locale: 'en-US',
                            slug: 'company',
                            displayName: 'Company',
                            lastPublishedRevision: 1
                        }
                    ]
                }
            ]
        })).toThrow(ContentCategoryReferenceError);
        expect(() => assertContentCategoryReferencesValid({
            contentType: 'blog',
            targetLocale: 'en-US',
            referencedCategoryIds: ['content_category_guides'],
            categories: [
                {
                    categoryId: 'content_category_guides',
                    localeVersions: [
                        {
                            locale: 'en-US',
                            slug: 'guides',
                            displayName: 'Guides',
                            lastPublishedRevision: 1
                        }
                    ]
                }
            ]
        })).not.toThrow();
    });
    it('Sync batch / skips empty pending changes and aggregates repeated resource changes', () => {
        expect(createSyncBatchPlan({ siteId: 'site_a', currentPublishVersion: 4, pendingResources: [] })).toBeNull();
        const plan = createSyncBatchPlan({
            siteId: 'site_a',
            currentPublishVersion: 4,
            pendingResources: [
                {
                    resourceType: 'product',
                    resourceId: 'product_a',
                    locale: 'en-US',
                    changeType: 'unpublish',
                    markedAt: new Date('2026-06-15T08:00:00.000Z'),
                    syncRevision: 2
                },
                {
                    resourceType: 'product',
                    resourceId: 'product_a',
                    locale: 'en-US',
                    changeType: 'update',
                    markedAt: new Date('2026-06-15T08:00:00.000Z'),
                    syncRevision: 1
                },
                {
                    resourceType: 'blog',
                    resourceId: 'blog_a',
                    locale: 'en-US',
                    changeType: 'create',
                    markedAt: new Date('2026-06-15T08:06:00.000Z'),
                    syncRevision: 3
                },
                {
                    resourceType: 'article-category',
                    resourceId: 'content_category_guides',
                    locale: 'en-US',
                    changeType: 'update',
                    markedAt: new Date('2026-06-15T08:07:00.000Z'),
                    syncRevision: 4
                }
            ]
        });
        expect(plan).toEqual({
            siteId: 'site_a',
            publishVersion: 5,
            resources: [
                {
                    resourceType: 'product',
                    resourceId: 'product_a',
                    locale: 'en-US',
                    changeType: 'unpublish'
                },
                {
                    resourceType: 'blog',
                    resourceId: 'blog_a',
                    locale: 'en-US',
                    changeType: 'create'
                },
                {
                    resourceType: 'article-category',
                    resourceId: 'content_category_guides',
                    locale: 'en-US',
                    changeType: 'update'
                }
            ]
        });
        expect(plan?.resources.map((resource) => resource.expectedRevision)).toEqual([2, 3, 4]);
    });
    it('Preview token / issues a 15 minute token bound to site resource locale and operator', () => {
        const issued = issuePreviewToken({
            secret: 'preview_secret',
            now: new Date('2026-06-15T08:00:00.000Z'),
            siteId: 'site_a',
            resourceType: 'blog',
            resourceId: 'blog_a',
            locale: 'en-US',
            operatorId: 'operator_a'
        });
        expect(issued.expiresAt.toISOString()).toBe('2026-06-15T08:15:00.000Z');
        expect(issued.token).not.toContain('Hello');
        expect(validatePreviewToken(issued.token, {
            secret: 'preview_secret',
            now: new Date('2026-06-15T08:14:59.000Z'),
            expectedSiteId: 'site_a',
            expectedResourceType: 'blog',
            expectedResourceId: 'blog_a',
            expectedLocale: 'en-US'
        })).toEqual(expect.objectContaining({
            ok: true,
            operatorId: 'operator_a'
        }));
        expect(validatePreviewToken(issued.token, {
            secret: 'preview_secret',
            now: new Date('2026-06-15T08:16:00.000Z'),
            expectedSiteId: 'site_a',
            expectedResourceType: 'blog',
            expectedResourceId: 'blog_a',
            expectedLocale: 'en-US'
        })).toEqual({ ok: false, errorCode: 'TOKEN_EXPIRED' });
    });
    it('Audit / builds a site-service envelope with tenant operator trace and resource facts', () => {
        const envelope = buildSiteAuditEnvelope({
            module: 'sync',
            eventType: 'sync.completed',
            result: 'SUCCEEDED',
            operatorId: 'operator_a',
            tenantId: 'tenant_a',
            orgId: 'org_a',
            traceId: 'trace_a',
            resourceType: 'site_sync_batch',
            resourceId: 'sync_a',
            details: {
                siteId: 'site_a',
                publishVersion: 5
            },
            occurredAt: new Date('2026-06-15T08:00:00.000Z')
        });
        expect(envelope).toEqual(expect.objectContaining({
            service: 'site-service',
            module: 'sync',
            eventType: 'sync.completed',
            result: 'SUCCEEDED',
            operator: { operatorId: 'operator_a', operatorType: 'HUMAN' },
            scope: { tenantId: 'tenant_a', orgId: 'org_a' },
            trace: { traceId: 'trace_a' },
            resource: { resourceType: 'site_sync_batch', resourceId: 'sync_a' }
        }));
    });
});
