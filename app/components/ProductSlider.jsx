// import Swiper core and required modules
import { Navigation, Pagination } from 'swiper/modules';

import { Swiper, SwiperSlide } from 'swiper/react';

import ProductCard from '~/components/ProductCard';


/**
 * Display a slider with products and a heading based on some options.
 * This components uses the data from prompts
 * @see swiper https://swiperjs.com/element
 */
export default function ProductSlider({products, header = 'Featured products'}) {

  if (products?.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className='max-w-[100vw]'>
      <h2 className='text-2xl font-medium mb-3'>{header}</h2>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={50}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: {
            slidesPerView: 2
          },
          1024: {
            slidesPerView: 3
          },
          1280: {
            slidesPerView: 4
          }
        }}
      >
        {
          products?.map((product) => {
            return (
              <SwiperSlide key={product.id}>
                <ProductCard product={product}/>
              </SwiperSlide>
            )
          })
        }
      </Swiper>
    </div>
  );
};