import {useLoaderData, useMatches, useFetcher} from '@remix-run/react';
import {MediaFile, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {AnalyticsPageType} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';

// import Swiper core and required modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import ProductOptions from '~/components/ProductOptions';
import ProductSlider from '~/components/ProductSlider';

const seo = ({data}) => ({
  title: data?.product?.seo?.title || data?.product?.title,
  description: data?.product?.seo?.description?.substr(0, 154) || data?.product?.description?.substr(0, 154),
  media: data?.product?.media?.nodes[0]?.image?.url,
});

export const handle = {
  seo,
};

export async function loader({params, context, request}) {
  const {handle} = params;
  const searchParams = new URL(request.url).searchParams;
  const selectedOptions = [];
  const storeDomain = context.storefront.getShopifyDomain();

  // set selected options from the query string
  searchParams.forEach((value, name) => {
    selectedOptions.push({name, value});
  });

  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions,
    },
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const productId = product?.id

  const {productRecommendations} = await context.storefront.query(PRODUCT_RECOMMENDATIONS, {
    variables: {
      productId
    },
  });

  // optionally set a default variant so you always have an "orderable" product selected
  const selectedVariant = product.selectedVariant ?? product?.variants?.nodes[0];

  return json({
    product,
    productRecommendations,
    selectedVariant,
    storeDomain,
    analytics: {
      pageType: AnalyticsPageType.product,
      products: [product],
    }
  });
}

function ProductGallery({media}) {
  if (!media.length) {
    return null;
  }

  const typeNameMap = {
    MODEL_3D: 'Model3d',
    VIDEO: 'Video',
    IMAGE: 'MediaImage',
    EXTERNAL_VIDEO: 'ExternalVideo',
  };

  return (
    <Swiper
      // install Swiper modules
      modules={[Navigation, Pagination]}
      spaceBetween={50}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      className='overflow-hidden rounded-md'
    >
      {media.map((med, i) => {
        let extraProps = {};

        if (med.mediaContentType === 'MODEL_3D') {
          extraProps = {
            interactionPromptThreshold: '0',
            ar: true,
            loading: 'eager',
            disableZoom: true,
            style: {height: '100%', margin: '0 auto'},
          };
        }

        const data = {
          ...med,
          __typename: typeNameMap[med.mediaContentType] || typeNameMap['IMAGE'],
          image: {
            ...med.image,
            altText: med.alt || 'Product image',
          },
        };

        return (
            <SwiperSlide
             key={data.id || data.image.id}
             class='overflow-hidden rounded-md'
            >
              <MediaFile
                tabIndex="0"
                className={`w-full h-full aspect-square object-cover text-center`}
                data={data}
                {...extraProps}
              />
            </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

function ProductForm({variantId, productAnalytics}) {
  const [root] = useMatches();
  const selectedLocale = root?.data?.selectedLocale;
  const fetcher = useFetcher();

  const lines = [{merchandiseId: variantId, quantity: 1}];

  const analytics = {
    event: 'addToCart',
    products: [productAnalytics]
  };

  return (
    <fetcher.Form action="/cart" method="post">
      <input type="hidden" name="cartAction" value={'ADD_TO_CART'} />
      <input
        type="hidden"
        name="countryCode"
        value={selectedLocale?.country ?? 'US'}
      />
      <input type="hidden" name="analytics" value={JSON.stringify(analytics)} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <button className="bg-black text-white px-6 py-3 w-full rounded-md text-center font-medium">
        Add to Cart
      </button>
    </fetcher.Form>
  );
}


export default function ProductHandle() {
  const {product, productRecommendations, selectedVariant, storeDomain} = useLoaderData();
  const orderable = selectedVariant?.availableForSale || false;

  return (
    <section className="w-full gap-4 md:gap-8 grid grid-cols-1 px-6 md:px-8 lg:px-12">
      <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid justify-items-center md:grid-flow-row md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
          <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-[80vw] shadow rounded">
            <ProductGallery media={product.media.nodes} />
          </div>
        </div>
        <div className="md:sticky md:mx-auto max-w-xl md:max-w-[24rem] grid grid-cols-1 gap-8 p-0 md:p-6 md:px-0 top-[6rem] lg:top-[8rem] xl:top-[10rem]">
          <div className="grid gap-2">
            <h1 className="text-4xl font-bold leading-10 whitespace-normal">
              {product.title}
            </h1>
            <span className="max-w-prose whitespace-pre-wrap inherit text-copy opacity-50 font-medium">
              {product.vendor}
            </span>
          </div>
          <ProductOptions
            options={product.options}
            selectedVariant={selectedVariant}
          />
          <Money
            withoutTrailingZeros
            data={selectedVariant.price}
            className="text-xl font-semibold mb-2"
          />
          {
            orderable ? (
              <div className="space-y-2">
                <ShopPayButton
                  storeDomain={storeDomain}
                  variantIds={[selectedVariant?.id]}
                  width={'100%'}
                  className='grid grid-cols-1'
                />
                <ProductForm variantId={selectedVariant?.id} />
              </div>
            ) : (
              <div className="bg-zinc-800 text-white px-6 py-3 w-full rounded-md text-center font-medium">
                Not orderable
              </div>
            )
          }
          <div
            className="prose border-t border-gray-200 pt-6 text-black text-md"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>
      </div>
      <ProductSlider
        products={productRecommendations}
        header='Recommendations'
      />
    </section>
  );
}

const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    product(handle: $handle) {
      id
      title
      handle
      vendor
      description
      descriptionHtml
      media(first: 10) {
        nodes {
          ... on MediaImage {
            mediaContentType
            image {
              id
              url
              altText
              width
              height
            }
          }
          ... on Model3d {
            id
            mediaContentType
            sources {
              mimeType
              url
            }
          }
        }
      }
      options {
        name,
        values
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
      seo {
        description
        title
      }
    }
  }
`;

const PRODUCT_RECOMMENDATIONS = `#graphql
  query getProductRecommendations($productId: ID!) {
  productRecommendations(productId: $productId) {
    id
    title
    handle
    variants(first: 1) {
      nodes {
        id
        title
        availableForSale
        image {
          id
          url
          altText
          width
          height
        }
        price {
          currencyCode
          amount
        }
        compareAtPrice {
          currencyCode
          amount
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
}
`