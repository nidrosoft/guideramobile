/**
 * REFRESH DEAL IMAGES — One-off utility v2
 * 
 * Re-fetches real images from Viator API for experience deals
 * and from SerpAPI Google Images for hotel deals.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const VIATOR_BASE = 'https://api.viator.com/partner'

function getViatorHeaders(): Record<string, string> {
  const apiKey = Deno.env.get('VIATOR_API_KEY')
  if (!apiKey) throw new Error('VIATOR_API_KEY not configured')
  return {
    'exp-api-key': apiKey,
    'Accept': 'application/json;version=2.0',
    'Content-Type': 'application/json',
    'Accept-Language': 'en-US',
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results: any[] = []

  try {
    // 1. Experience deals — Viator product detail API
    const { data: experienceDeals } = await supabase
      .from('deal_cache')
      .select('id, deal_data')
      .eq('deal_type', 'experience')

    for (const deal of (experienceDeals || [])) {
      const productCode = deal.deal_data?.productCode
      if (!productCode) {
        results.push({ id: deal.id, status: 'skipped', reason: 'no productCode' })
        continue
      }

      // Check if images already have real (non-unsplash) URLs
      const existingImages = deal.deal_data?.images || []
      const hasUnsplash = existingImages.some((img: string) =>
        typeof img === 'string' && img.includes('unsplash.com')
      )
      if (!hasUnsplash && existingImages.length > 3) {
        results.push({ id: deal.id, productCode, status: 'already_real', imageCount: existingImages.length })
        continue
      }

      try {
        const response = await fetch(`${VIATOR_BASE}/products/${productCode}?currency=USD`, {
          method: 'GET',
          headers: getViatorHeaders(),
        })

        if (!response.ok) {
          results.push({ id: deal.id, productCode, status: 'api_error', httpStatus: response.status })
          continue
        }

        const product = await response.json()
        const images = (product.images || []).map((img: any) => {
          const variants = img.variants || []
          const best = variants.find((v: any) => v.width === 720) ||
                       variants.find((v: any) => v.width >= 480) ||
                       variants[variants.length - 1] || {}
          return best.url || ''
        }).filter((url: string) => url.length > 0)

        if (images.length === 0) {
          results.push({ id: deal.id, productCode, status: 'no_images_from_api' })
          continue
        }

        const updatedDealData = { ...deal.deal_data, images, heroImage: images[0] }
        const { error } = await supabase.from('deal_cache').update({ deal_data: updatedDealData }).eq('id', deal.id)
        results.push({ id: deal.id, productCode, status: error ? 'update_error' : 'updated', imageCount: images.length })
      } catch (err: any) {
        results.push({ id: deal.id, productCode, status: 'error', error: err.message })
      }
    }

    // 2. Hotel deals — SerpAPI Google Images
    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY')
    if (SERPAPI_KEY) {
      const { data: hotelDeals } = await supabase
        .from('deal_cache')
        .select('id, deal_data')
        .eq('deal_type', 'hotel')

      for (const deal of (hotelDeals || [])) {
        const hotelName = deal.deal_data?.name || deal.deal_data?.title
        const city = deal.deal_data?.city
        if (!hotelName || !city) {
          results.push({ id: deal.id, status: 'skipped', reason: 'no hotel name or city' })
          continue
        }

        // Check if images already have real (non-unsplash) URLs
        const existingImages = deal.deal_data?.images || []
        const hasUnsplash = existingImages.some((img: string) =>
          typeof img === 'string' && img.includes('unsplash.com')
        )
        if (!hasUnsplash && existingImages.length > 3) {
          results.push({ id: deal.id, hotel: hotelName, status: 'already_real', imageCount: existingImages.length })
          continue
        }

        try {
          // Use Google Images search to find real hotel photos
          const params = new URLSearchParams({
            engine: 'google_images',
            q: `${hotelName} ${city} hotel rooms exterior`,
            num: '10',
            api_key: SERPAPI_KEY,
          })

          const resp = await fetch(`https://serpapi.com/search?${params}`)
          if (!resp.ok) {
            results.push({ id: deal.id, hotel: hotelName, status: 'serpapi_error', httpStatus: resp.status })
            continue
          }

          const data = await resp.json()
          const imageResults = data.images_results || []

          // Filter to get reasonable hotel images (skip tiny ones, ads, etc.)
          const images = imageResults
            .filter((img: any) => img.original && img.original_width >= 400 && img.original_height >= 300)
            .map((img: any) => img.original)
            .slice(0, 8)

          if (images.length === 0) {
            results.push({ id: deal.id, hotel: hotelName, status: 'no_images' })
            continue
          }

          const updatedDealData = { ...deal.deal_data, images, heroImage: images[0] }
          const { error } = await supabase.from('deal_cache').update({ deal_data: updatedDealData }).eq('id', deal.id)
          results.push({ id: deal.id, hotel: hotelName, status: error ? 'update_error' : 'updated', imageCount: images.length })
        } catch (err: any) {
          results.push({ id: deal.id, hotel: hotelName, status: 'error', error: err.message })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message, results }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
