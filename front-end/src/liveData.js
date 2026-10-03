export const NEWS_FEED='https://feeds.bbci.co.uk/news/rss.xml';
export const NEWS_API='https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(NEWS_FEED);
export function plainFeedText(value){if(typeof value!=='string')return '';if(typeof DOMParser!=='undefined'){const doc=new DOMParser().parseFromString(value,'text/html');doc.querySelectorAll('script,style').forEach(n=>n.remove());return (doc.body.textContent||'').replace(/\s+/g,' ').trim();}return value.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();}
export function parseNews(data,now=Date.now()){
 if(data?.status!=='ok'||!Array.isArray(data.items))throw new Error('The headline feed is unavailable. Open BBC News directly or try again.');
 return data.items.flatMap(item=>{try{const url=new URL(item.link);const publishedAt=Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(item.pubDate)?item.pubDate:item.pubDate.replace(' ','T')+'Z');if(url.protocol!=='https:'||!/(^|\.)bbc\.(co\.uk|com)$/.test(url.hostname)||!Number.isFinite(publishedAt)||publishedAt>now+300000||now-publishedAt>48*3600000)return [];const title=plainFeedText(item.title).slice(0,240);if(!title)return [];return [{id:url.href,title,summary:plainFeedText(item.description).slice(0,380),url:url.href,publishedAt}];}catch{return [];}}).slice(0,10);
}
export function describeWeather(code){if(code===0)return 'Clear skies';if([1,2].includes(code))return 'Partly cloudy';if(code===3)return 'Overcast';if([45,48].includes(code))return 'Fog';if([51,53,55,56,57].includes(code))return 'Drizzle';if([61,63,65,66,67,80,81,82].includes(code))return 'Rain';if([71,73,75,77,85,86].includes(code))return 'Snow';if([95,96,99].includes(code))return 'Thunderstorms';return 'Conditions unavailable';}
export function parseWeather(data,now=Date.now()){
 const current=data?.current,daily=data?.daily;const measured=Date.parse(current?.time+'Z')-(data?.utc_offset_seconds||0)*1000;
 if(!current||!['temperature_2m','apparent_temperature','weather_code','wind_speed_10m'].every(key=>Number.isFinite(current[key]))||!Array.isArray(daily?.time)||daily.time.length<5||!daily.time.slice(0,5).every(day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day))||!['weather_code','temperature_2m_max','temperature_2m_min','precipitation_probability_max'].every(key=>Array.isArray(daily[key])&&daily[key].length>=5&&daily[key].slice(0,5).every(Number.isFinite))||typeof data.timezone!=='string'||!Number.isFinite(measured)||Math.abs(now-measured)>48*3600000)throw new Error('The provider did not return a current forecast. Please try again later.');
 return {current,daily,timezone:data.timezone,measured,units:data.current_units};
}
export function validForecastCache(data,now=Date.now()){
 if(!data||!Number.isFinite(data.measured)||Math.abs(now-data.measured)>48*3600000)return false;
 try{new Intl.DateTimeFormat('en-GB',{timeZone:data.timezone}).format();}catch{return false;}
 return typeof data.timezone==='string'&&['temperature_2m','apparent_temperature','weather_code','wind_speed_10m'].every(k=>Number.isFinite(data.current?.[k]))&&Array.isArray(data.daily?.time)&&data.daily.time.length>=5&&data.daily.time.slice(0,5).every(v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v)))&&['weather_code','temperature_2m_max','temperature_2m_min','precipitation_probability_max'].every(k=>Array.isArray(data.daily[k])&&data.daily[k].length>=5&&data.daily[k].slice(0,5).every(Number.isFinite));
}
