import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';

export default function ProductCard({product}) {

  if (product.node) {
    product = product.node
  }

  const {price} = product.variants?.nodes[0] || {}
  let isDiscounted = false
  let compareAtPrice = null

  if (product.variants?.nodes[0]?.compareAtPrice) {
    compareAtPrice = product.variants?.nodes[0].compareAtPrice
    isDiscounted = compareAtPrice?.amount > price?.amount
  }

  return (
    <Link to={`/products/${product?.handle}`}>
      <div className="grid gap-6">
        <div className="shadow-sm rounded relative">
          {isDiscounted && (
            <label className="subpixel-antialiased absolute top-0 right-0 m-4 text-right text-notice text-red-600 text-xs">
              Sale
            </label>
          )}
          <Image
            data={product?.variants?.nodes[0]?.image}
            sizes="(min-width: 45em) 50vw, 100vw"
            alt={product?.title}
          />
        </div>
        <div className="grid gap-1">
          <h3 className="max-w-prose text-copy w-full overflow-hidden whitespace-nowrap text-ellipsis ">
            {product?.title}
          </h3>
          <div className="flex gap-4">
            <span className="max-w-prose whitespace-pre-wrap inherit text-copy flex gap-4">
              <Money withoutTrailingZeros data={price} />
              {isDiscounted && (
                <Money
                  className="line-through opacity-50"
                  withoutTrailingZeros
                  data={compareAtPrice}
                />
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
