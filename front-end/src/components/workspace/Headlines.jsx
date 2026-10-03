import { useT } from "../../i18n.jsx";
import React from 'react';
import { Globe2, ArrowUpRight, RefreshCw, Newspaper } from 'lucide-react';
import { PageHeading, Button } from '../UI.jsx';
import { NEWS_API, parseNews } from '../../liveData.js';
import { fetchJSON, useRemoteData } from '../../hooks/useRemoteData.js';
import { WeatherCard } from './WeatherCard.jsx';
import s from './Workspace.module.css';
import f from './World.module.css';
export default function Headlines() {
  const tr = useT();
  const {
    cache,
    loading,
    error,
    refresh
  } = useRemoteData('aster-news-bbc-v1', async signal => parseNews(await fetchJSON(NEWS_API, signal)));
  const items = (Array.isArray(cache?.data) ? cache.data : []).filter(item => item && Number.isFinite(item.publishedAt) && Date.now() - item.publishedAt >= -300000 && Date.now() - item.publishedAt < 48 * 3600000 && typeof item.title === 'string' && typeof item.url === 'string' && /^https:\/\/(?:www\.)?bbc\.(?:com|co\.uk)\//.test(item.url));
  const stale = Boolean(error || cache && Date.now() - cache.fetchedAt > 3600000);
  return <><PageHeading eyebrow={tr("A WIDER PERSPECTIVE")} title={tr("Today’s headlines.")} description={tr("A short pause to understand the world beyond your coursework.")} action={<Button variant="secondary" disabled={loading} onClick={refresh}><RefreshCw size={16} />{tr(loading ? 'Refreshing…' : 'Refresh headlines')}</Button>} /><div className={s.pageHero}><div><span className={s.kicker}>{tr("STAY CURIOUS. CHECK THE SOURCE.")}</span><h2>{tr("Big ideas start with")}<br />{tr("knowing what is happening.")}</h2><p>{tr("BBC’s current top-story feed, with publisher summaries and links to the original reporting. This is one editorial perspective, not a ranking of every story.")}</p></div><div className={s.heroIcon}><Globe2 size={55} /></div></div><div className={f.worldLayout}><section><div className={s.toolbar}><h2>{tr("In the news")}</h2><span className={s.pill}>{tr(stale ? 'Saved feed' : 'BBC News')}{tr(" · past 48 hours")}</span></div><p className={s.sourceLine}>{tr(cache ? <>{tr("Last retrieved ")}{tr(new Date(cache.fetchedAt).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }))}{tr(" · ")}</> : 'Waiting for the live feed · ')}<a href="https://www.bbc.com/news" target="_blank" rel="noopener noreferrer">{tr("BBC News")}</a>{tr(" · RSS via ")}<a href="https://rss2json.com/" target="_blank" rel="noopener noreferrer">{tr("rss2json")}</a></p>{tr(error && <div className={s.error} role="status">{tr(items.length ? 'These saved headlines may not reflect the latest news. ' : '')}{tr(error)}</div>)}{tr(loading && !cache ? <div className={f.newsGrid} aria-busy="true" aria-label={tr("Loading headlines")}>{tr([0, 1, 2, 3].map(i => <div className={s.skeleton} key={i} />))}</div> : items.length ? <div className={f.newsGrid}>{tr(items.map((item, i) => <article className={`${s.panel} ${f.newsCard}`} key={item.id}><div className={f.newsMeta}><span>{tr(String(i + 1).padStart(2, '0'))}</span><time dateTime={new Date(item.publishedAt).toISOString()}>{tr(new Date(item.publishedAt).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }))}</time></div><h3><a href={item.url} target="_blank" rel="noopener noreferrer">{tr(item.title)}</a></h3><p>{tr(item.summary)}</p><a className={f.articleLink} href={item.url} target="_blank" rel="noopener noreferrer">{tr("Read original report ")}<ArrowUpRight size={16} /></a></article>))}</div> : !loading && <div className={s.empty}><Newspaper size={35} /><h3>{tr("No recent headlines available.")}</h3><p>{tr("The live feed has not provided stories from the past 48 hours.")}</p><a className={s.buttonLink} href="https://www.bbc.com/news" target="_blank" rel="noopener noreferrer">{tr("Open BBC News ")}<ArrowUpRight size={16} /></a></div>)}<p className={s.fine}>{tr("Publication dates come from the publisher’s feed; displayed times use your device’s time zone. Refreshes every 30 minutes while this page is open. Headlines are never invented to fill an unavailable feed.")}</p></section><aside className={f.worldAside}><WeatherCard /><div className={`${s.panel} ${f.mediaNote}`}><span className={s.kicker}>{tr("READ WITH INTENTION")}</span><h3>{tr("Go one step beyond the headline.")}</h3><p>{tr("Check the publication date, read the whole report, and distinguish reporting from opinion. Compare coverage when a story matters to you.")}</p><a href="https://www.reuters.com/world/" target="_blank" rel="noopener noreferrer">{tr("Explore Reuters World ")}<ArrowUpRight size={15} /></a></div></aside></div></>;
}
