#!/usr/bin/env python3
"""Pull this week's public schedule from Gymdesk and write site/js/schedule.json.
Gymdesk renders each class as <div class="schedule-event" data-event-info="{json}">; we read that JSON."""
import html, json, re, sys, urllib.request, collections
URL="https://cobrinha-jiu-jitsu-academy.gymdesk.com/schedule"
def fetch():
    req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0 (site schedule sync)"})
    return urllib.request.urlopen(req,timeout=30).read().decode("utf-8","replace")
def parse(h):
    out=[]
    for m in re.finditer(r'data-event-info="([^"]+)"', h):
        e=json.loads(html.unescape(m.group(1)))
        if not e.get("website_visible",1): continue
        hh,mm=e["start"].split(":")[:2]; start=int(hh)*60+int(mm); end=start+int(e.get("duration",60))
        out.append({"day":int(e["day"]),"start":start,"end":end,"title":e["title"].strip(),"color":e.get("color",""),"id":e.get("id")})
    # de-dup (the page can repeat an event in its details panel)
    seen=set(); uniq=[]
    for e in out:
        k=(e["day"],e["start"],e["title"])
        if k in seen: continue
        seen.add(k); uniq.append(e)
    uniq.sort(key=lambda e:(e["day"],e["start"]))
    return uniq
if __name__=="__main__":
    ev=parse(fetch())
    if len(ev)<10: sys.exit("too few events parsed: %d"%len(ev))
    json.dump({"source":URL,"events":ev},open((sys.argv[1] if len(sys.argv)>1 else "js/schedule.json"),"w"),ensure_ascii=False,separators=(",",":"))
    print(len(ev),"events;",collections.Counter(e["day"] for e in ev))
