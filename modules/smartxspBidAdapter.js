import {registerBidder} from '../src/adapters/bidderFactory.js';
import {BANNER} from '../src/mediaTypes.js';
import {find} from '../src/polyfill.js';

const SMARTXSP_CONFIG = {
  bidRequestUrl: 'https://tag.smartxsp.io/pbjs/bid',
  method: 'POST'
}

const BIDDER_CODE = 'smartxsp';

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],
  isBidRequestValid: function (bid) {
    return !!(bid && bid.params && bid.params.accountId && bid.params.widgetId);
  },
  buildRequests: function (validBidRequests, bidderRequest) {
    var i
    var j
    var bid
    var bidParam
    var bidParams = []
    var sizes
    var frameWidth = Math.round(window.screen.width)
    var frameHeight = Math.round(window.screen.height)
    for (i = 0; i < validBidRequests.length; i++) {
      bid = validBidRequests[i]
      if (bid.sizes) {
        sizes = bid.sizes
      } else if (typeof (BANNER) != 'undefined' && bid.mediaTypes && bid.mediaTypes[BANNER] && bid.mediaTypes[BANNER].sizes) {
        sizes = bid.mediaTypes[BANNER].sizes
      } else if (frameWidth && frameHeight) {
        sizes = [[frameWidth, frameHeight]]
      } else {
        sizes = []
      }
      for (j = 0; j < sizes.length; j++) {
        bidParam = {
          accountId: bid.params.accountId || '',
          bidId: bid.bidId,
          'banner-format-width': sizes[j][0],
          'banner-format-height': sizes[j][1]
        }
        if (bid.params.language) {
          bidParam.language = bid.params.language
        }
        if (bid.params.region) {
          bidParam.region = bid.params.region
        }
        if (bid.params.regions && (bid.params.regions instanceof String || (bid.params.regions instanceof Array && bid.params.regions.length))) {
          bidParam.regions = bid.params.regions
          if (bidParam.regions instanceof Array) {
            bidParam.regions = bidParam.regions.join(',')
          }
        }

        bidParam.schain= bid.schain;

        bidParams.push(bidParam);
      }
    }

    var bidUrl = SMARTXSP_CONFIG.bidRequestUrl;
    if(bid.params.bidUrl != undefined) {
      bidUrl = bid.params.bidUrl;
    }

    var ServerRequestObjects = {
      method: SMARTXSP_CONFIG.method,
      url: bidUrl,
      bids: validBidRequests,
      data: {bidParams: bidParams, auctionId: bidderRequest.auctionId}
    }
    return ServerRequestObjects;
  },
  interpretResponse: function (serverResponse, bidRequest) {
    var i
    var bid
    var bidObject
    var ad
    var ads
    var bidResponses = []
    ads = serverResponse.body
    for (i = 0; i < ads.length; i++) {
      ad = ads[i]
      bid = find(bidRequest.bids, bid => bid.bidId === ad.bidId)
      if (bid) {
        
        bidObject = {
          requestId: bid.bidId,
          cpm: ad.cpm,
          width: parseInt(ad.bannerFormatWidth),
          height: parseInt(ad.bannerFormatHeight),
          creativeId: ad.id,
          netRevenue: !!ad.netRevenue,
          currency: ad.currency,
          ttl: ad.ttl,
          ad: ad.ad,
          adUrl: ad.adUrl,
          meta: {
            advertiserDomains: bid.adomain
          }
        }
        bidResponses.push(bidObject);
      }
    }
    return bidResponses;
  }
}
registerBidder(spec)
