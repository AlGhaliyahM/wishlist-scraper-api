import { Injectable } from '@nestjs/common';
import { WishlistUrl } from './wishlist.interface';
import { WishlistData } from './wishlistData.interface';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { WishlistDocument, Wishlist } from './wishlist.schema';
import { Model, now } from 'mongoose';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
  ) {}

  TODO: '1-Validate URL 2-if valid proceed with scraping the data';

  async wishlistScraper(url: WishlistUrl) {
    let wishlists: WishlistData[] = [];

    //check if the url in valid format
    if (this.isValidUrl(url.wishlistUrl)) {
      wishlists = await this.scrapeData(url.wishlistUrl);

      const objModel = new this.wishlistModel();
      objModel.items = wishlists;
      objModel.Url = url.wishlistUrl;

      objModel.save();
      return {
        sucess: true,
        data: objModel,
      };
    } else {
      return {
        sucess: false,
        error: 'Please provide valid wishlist URL',
      };
    }
  }

  //Validate Url format method
  isValidUrl(url: string) {
    try {
      let Url = new URL(url);
      return Boolean(Url);
    } catch (e) {
      return false;
    }
  }

  // ScrapData for mama&papas wishlist URL
  async scrapeData(url: string): Promise<WishlistData[]> {
    let Url = new URL(url);
    let domain = Url.hostname;
    // console.log(domain);

    const wishlists: WishlistData[] = [];

    try {
      // Fetch HTML of the page we want to scrape
      const { data } = await axios.get(url);

      // Load HTML we fetched in the previous line
      const $ = cheerio.load(data);

      // Select all the list items in b-tab-content b-toggle__content m-expanded class
      const wishlistItems = $(
        '#tab-item-all.b-tab-content.b-toggle__content.m-expanded div.b-wishlist__product.col-6.col-md-4.col-lg-3',
      );

      // Use .each method to loop through the selected css
      wishlistItems.each((i, el) => {
        wishlists.push({
          item_name: $(el).find('div.b-wishlist-tile__name').text(),
          item_price: $(el).find('span.b-price__value').attr('content'),
          item_img: $(el)
            .find('.b-product-tile__image-img.tile-image.js-product__image')
            .attr('src'),
          item_url:
            'https://' +
            domain +
            $(el).find('.b-wishlist-tile__image-link').attr('href'),
        });
      });

      return wishlists;
    } catch (error) {}
  }

  //   async amazonWishlistScraper(url: string): Promise<WishlistData[]> {}
}
