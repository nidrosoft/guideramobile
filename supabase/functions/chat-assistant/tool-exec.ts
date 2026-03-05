// Tool execution handlers — dedicated APIs with web_search fallback
const WEATHER_CODES: Record<number, string> = {
  1000:'Clear',1001:'Cloudy',1100:'Mostly Clear',1101:'Partly Cloudy',1102:'Mostly Cloudy',
  2000:'Fog',2100:'Light Fog',4000:'Drizzle',4001:'Rain',4200:'Light Rain',4201:'Heavy Rain',
  5000:'Snow',5001:'Flurries',6001:'Freezing Rain',8000:'Thunderstorm',
};
const VIATOR_CITIES: Record<string, string> = {
  'new york':'687','los angeles':'645','san francisco':'651','las vegas':'684','chicago':'673',
  'miami':'662','london':'50648','paris':'479','rome':'511','barcelona':'562','amsterdam':'525',
  'berlin':'488','prague':'462','vienna':'454','lisbon':'538','dublin':'503','madrid':'564',
  'tokyo':'334','bangkok':'343','singapore':'60449','dubai':'828','seoul':'973','bali':'768',
  'cairo':'782','cape town':'318','sydney':'357','buenos aires':'901','cancun':'631','toronto':'623',
};

async function webSearch(query: string): Promise<string> {
  const bk = Deno.env.get('BRAVE_SEARCH_API_KEY');
  if (bk) {
    try {
      const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': bk },
      });
      if (r.ok) { const d = await r.json(); const res = (d.web?.results||[]).slice(0,5).map((x:any)=>`- ${x.title}: ${x.description||x.url}`).join('\n'); if (res) return res; }
    } catch (e:any) { console.warn('Brave error:', e.message); }
  }
  const xk = Deno.env.get('XAI_API_KEY');
  if (xk) {
    try {
      const r = await fetch('https://api.x.ai/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${xk}`}, body:JSON.stringify({model:'grok-3-mini',messages:[{role:'user',content:`Latest info: ${query}. Be factual, concise.`}],max_tokens:400,temperature:0.3,search_parameters:{mode:'auto'}}) });
      if (r.ok) { const d = await r.json(); return d.choices?.[0]?.message?.content||'No results'; }
    } catch {}
  }
  return `Search unavailable. Query: ${query}`;
}

async function geocode(place: string): Promise<{lat:number,lng:number}|null> {
  // Use pk.* public token for Mapbox geocoding (sk.* doesn't work for geocoding)
  const mb = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
  if (mb) { try { const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${mb}&limit=1`); if(r.ok){const d=await r.json();const f=d.features?.[0];if(f)return{lng:f.center[0],lat:f.center[1]};} } catch (e:any) { console.warn('Mapbox geocode error:', e.message); } }
  // Fallback: Google Geocoding
  const gk = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (gk) { try { const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${gk}`); if(r.ok){const d=await r.json();const loc=d.results?.[0]?.geometry?.location;if(loc)return{lat:loc.lat,lng:loc.lng};} } catch {} }
  return null;
}

async function getAmadeusToken(): Promise<{token:string,base:string}|null> {
  const cid=Deno.env.get('AMADEUS_CLIENT_ID'),cs=Deno.env.get('AMADEUS_CLIENT_SECRET');
  if(!cid||!cs) return null;
  const env=Deno.env.get('AMADEUS_ENV')||'test';
  const base=env==='production'?'https://api.amadeus.com':'https://test.api.amadeus.com';
  const r=await fetch(`${base}/v1/security/oauth2/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:cid,client_secret:cs})});
  if(!r.ok) return null;
  return {token:(await r.json()).access_token, base};
}

export async function executeTool(name: string, input: any): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  switch (name) {
    case 'web_search': return await webSearch(input.query);
    case 'get_weather': {
      const ak=Deno.env.get('TOMORROW_IO_API_KEY');
      if(ak){try{const c=await geocode(input.location);if(c){const r=await fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${c.lat},${c.lng}&units=metric&apikey=${ak}`,{headers:{Accept:'application/json'}});if(r.ok){const d=await r.json();const v=d.data?.values||{};return `Weather ${input.location} (${today}): ${v.temperature}°C/${Math.round(v.temperature*9/5+32)}°F, ${WEATHER_CODES[v.weatherCode]||'Unknown'}, humidity ${v.humidity}%, wind ${v.windSpeed}km/h, UV ${v.uvIndex}`;}}}catch(e:any){console.warn('Tomorrow.io:',e.message);}}
      try{const r=await fetch(`https://wttr.in/${encodeURIComponent(input.location)}?format=j1`);if(r.ok){const d=await r.json();const c=d.current_condition?.[0];if(c)return `Weather ${input.location}: ${c.temp_C}°C/${c.temp_F}°F, ${c.weatherDesc?.[0]?.value}, humidity ${c.humidity}%`;}}catch{}
      return `Weather unavailable for ${input.location}.`;
    }
    case 'get_visa_requirements': return await webSearch(`${input.passport_country} passport visa requirements ${input.destination_country} ${year}`);
    case 'get_travel_advisory': return await webSearch(`travel advisory ${input.country_code} safety level ${year} US State Department`);
    case 'get_flight_status': return await webSearch(`flight status ${input.flight_number} ${input.date}`);
    case 'get_exchange_rate': {
      try{const r=await fetch(`https://api.exchangerate-api.com/v4/latest/${input.from_currency}`);if(r.ok){const d=await r.json();const rate=d.rates?.[input.to_currency];if(rate)return `Exchange rate (${today}): 1 ${input.from_currency} = ${rate.toFixed(4)} ${input.to_currency}`;}}catch{}
      return `Exchange rate unavailable for ${input.from_currency}→${input.to_currency}.`;
    }
    case 'search_flights': {
      const a=await getAmadeusToken();
      if(a){try{const p=new URLSearchParams({originLocationCode:input.origin,destinationLocationCode:input.destination,departureDate:input.date,adults:String(input.passengers||1),currencyCode:'USD',max:'5'});const r=await fetch(`${a.base}/v2/shopping/flight-offers?${p}`,{headers:{Authorization:`Bearer ${a.token}`,Accept:'application/json'}});if(r.ok){const d=await r.json();const ca=d.dictionaries?.carriers||{};return(d.data||[]).slice(0,5).map((o:any)=>{const s=o.itineraries?.[0]?.segments||[];const f=s[0],l=s[s.length-1];return`- ${ca[f?.carrierCode]||f?.carrierCode} ${f?.carrierCode}${f?.number}: ${f?.departure?.iataCode} ${f?.departure?.at?.slice(11,16)} → ${l?.arrival?.iataCode} ${l?.arrival?.at?.slice(11,16)}, ${s.length-1} stop(s), ${o.price?.currency} ${o.price?.total}`;}).join('\n')||'No flights found.';}}catch(e:any){console.warn('Amadeus flights:',e.message);}}
      return await webSearch(`flights ${input.origin} to ${input.destination} ${input.date} prices`);
    }
    case 'search_hotels': {
      const a=await getAmadeusToken();
      if(a){try{const cr=await fetch(`${a.base}/v1/reference-data/locations/hotels/by-city?cityCode=${input.destination.toUpperCase()}`,{headers:{Authorization:`Bearer ${a.token}`,Accept:'application/json'}});if(cr.ok){const ids=((await cr.json()).data||[]).slice(0,20).map((h:any)=>h.hotelId);if(ids.length){const hp=new URLSearchParams({hotelIds:ids.join(','),checkInDate:input.checkin,checkOutDate:input.checkout,adults:String(input.guests||1),roomQuantity:'1',currency:'USD'});const hr=await fetch(`${a.base}/v3/shopping/hotel-offers?${hp}`,{headers:{Authorization:`Bearer ${a.token}`,Accept:'application/json'}});if(hr.ok){const hd=await hr.json();return(hd.data||[]).slice(0,5).map((h:any)=>`- ${h.hotel?.name}: ${h.offers?.[0]?.price?.currency} ${h.offers?.[0]?.price?.total} (${h.hotel?.rating?h.hotel.rating+'★':'unrated'})`).join('\n')||'No hotels found.';}}}}catch(e:any){console.warn('Amadeus hotels:',e.message);}}
      return await webSearch(`hotels ${input.destination} ${input.checkin} to ${input.checkout}`);
    }
    case 'search_experiences': {
      const vk=Deno.env.get('VIATOR_API_KEY');
      if(vk){try{const k=input.destination.toLowerCase().trim();let did=VIATOR_CITIES[k];if(!did){for(const[c,id]of Object.entries(VIATOR_CITIES)){if(k.includes(c)||c.includes(k)){did=id;break;}}}if(did){const r=await fetch('https://api.viator.com/partner/products/search',{method:'POST',headers:{'exp-api-key':vk,'Accept':'application/json;version=2.0','Content-Type':'application/json'},body:JSON.stringify({filtering:{destination:did},sorting:{sort:'DEFAULT'},pagination:{start:1,count:5},currency:'USD'})});if(r.ok){const d=await r.json();return(d.products||[]).slice(0,5).map((p:any)=>{const pr=p.pricing?.summary?.fromPrice;const rt=p.reviews?.combinedAverageRating;const dur=p.duration?.fixedDurationInMinutes||p.duration?.variableDurationFromMinutes;return`- ${p.title}: $${pr}/person, ${rt?rt.toFixed(1)+'★':'no rating'}, ${dur?(dur>=60?Math.round(dur/60)+'h':dur+'min'):'varies'}`;}).join('\n')||'No experiences found.';}}}catch(e:any){console.warn('Viator:',e.message);}}
      return await webSearch(`best ${input.category||'things to do'} in ${input.destination} ${year}`);
    }
    case 'get_destination_intel': {
      const gk=Deno.env.get('GOOGLE_PLACES_API_KEY');
      if(gk){try{const r=await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(input.destination+' tourist attractions')}&key=${gk}`);if(r.ok){const d=await r.json();return`Top places in ${input.destination}:\n`+(d.results||[]).slice(0,8).map((p:any)=>`- ${p.name}: ${p.rating?p.rating+'★':''} ${p.formatted_address||''}`).join('\n');}}catch(e:any){console.warn('Google Places:',e.message);}}
      return await webSearch(`${input.destination} travel guide tips ${year}`);
    }
    case 'get_map': {
      const mb=Deno.env.get('MAPBOX_PUBLIC_TOKEN'); if(!mb) return 'Map service not configured.';
      const c=await geocode(input.location); if(!c) return `Could not locate: ${input.location}`;
      const z=input.zoom||13; const pin=`pin-s+ff0000(${c.lng},${c.lat})`;
      return `[MAP_IMAGE]https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pin}/${c.lng},${c.lat},${z},0/600x400@2x?access_token=${mb}[/MAP_IMAGE]`;
    }
    case 'get_directions': {
      const mb=Deno.env.get('MAPBOX_PUBLIC_TOKEN'); if(!mb) return 'Directions service not configured.';
      const mode=input.mode||'driving';
      const [oC,dC]=await Promise.all([geocode(input.origin),geocode(input.destination)]);
      if(!oC||!dC) return 'Could not geocode origin or destination.';
      try{const r=await fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${oC.lng},${oC.lat};${dC.lng},${dC.lat}?access_token=${mb}&overview=full&steps=true`);if(r.ok){const d=await r.json();const rt=d.routes?.[0];if(rt){const km=(rt.distance/1000).toFixed(1);const mins=Math.round(rt.duration/60);const steps=(rt.legs?.[0]?.steps||[]).slice(0,8).map((s:any)=>`- ${s.maneuver?.instruction}`).join('\n');return`${mode}: ${km}km, ~${mins}min\n${steps}`;}}}catch{}
      return `Directions unavailable.`;
    }
    case 'get_nearby_places': {
      const gk=Deno.env.get('GOOGLE_PLACES_API_KEY'); if(!gk) return 'Nearby places not configured.';
      const c=await geocode(input.location); if(!c) return `Could not locate: ${input.location}`;
      try{const p=new URLSearchParams({location:`${c.lat},${c.lng}`,radius:String(input.radius||1000),key:gk});if(input.type)p.append('type',input.type);const r=await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${p}`);if(r.ok){const d=await r.json();return(d.results||[]).slice(0,8).map((p:any)=>`- ${p.name}: ${p.rating?p.rating+'★':''} ${p.vicinity||''} ${p.opening_hours?.open_now?'(Open)':''}`).join('\n')||'No places found.';}}catch{}
      return `Nearby search failed for ${input.location}.`;
    }
    case 'get_distance': {
      const mb=Deno.env.get('MAPBOX_PUBLIC_TOKEN'); if(!mb) return 'Distance service not configured.';
      const mode=input.mode||'driving';
      const [oC,dC]=await Promise.all([geocode(input.origin),geocode(input.destination)]);
      if(!oC||!dC) return 'Could not geocode points.';
      try{const r=await fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${oC.lng},${oC.lat};${dC.lng},${dC.lat}?access_token=${mb}`);if(r.ok){const d=await r.json();const rt=d.routes?.[0];if(rt) return `Distance (${mode}): ${(rt.distance/1000).toFixed(1)}km, ~${Math.round(rt.duration/60)} minutes`;}}catch{}
      return 'Distance unavailable.';
    }
    default: return `Tool ${name} not available.`;
  }
}
