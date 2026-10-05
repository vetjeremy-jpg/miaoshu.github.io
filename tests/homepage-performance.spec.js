const { test, expect } = require('@playwright/test');

const VIEWPORTS=[320,375,390,430];
const BUDGET={
  requests:28,
  transferKB:850,
  imageKB:420,
  largestImageKB:275,
  lcpMs:2500,
  cls:0.40,
  interactionMs:200
};

test.describe('homepage performance regression contract',()=>{
  for(const width of VIEWPORTS){
    test(width+'px stays inside the mobile performance budget',async({page})=>{
      await page.setViewportSize({width,height:932});

      await page.addInitScript(()=>{
        window.__moonlitPerf={lcp:0,cls:0};
        new PerformanceObserver(list=>{
          const entries=list.getEntries();
          if(entries.length) window.__moonlitPerf.lcp=entries[entries.length-1].startTime;
        }).observe({type:'largest-contentful-paint',buffered:true});
        new PerformanceObserver(list=>{
          for(const e of list.getEntries()) if(!e.hadRecentInput) window.__moonlitPerf.cls+=e.value;
        }).observe({type:'layout-shift',buffered:true});
      });

      await page.goto('./',{waitUntil:'load'});
      await page.waitForTimeout(600);

      const metrics=await page.evaluate(()=>{
        const resources=performance.getEntriesByType('resource');
        const local=resources.filter(r=>r.name.startsWith(location.origin));
        const bytes=r=>r.transferSize||r.encodedBodySize||0;
        const images=local.filter(r=>r.initiatorType==='img');
        const imageEls=[...document.images].map(img=>({
          src:img.currentSrc||img.src,
          naturalWidth:img.naturalWidth,
          naturalHeight:img.naturalHeight,
          renderedWidth:img.getBoundingClientRect().width,
          renderedHeight:img.getBoundingClientRect().height,
          loading:img.loading
        }));
        return {
          requests:local.length,
          transferKB:local.reduce((n,r)=>n+bytes(r),0)/1024,
          imageKB:images.reduce((n,r)=>n+bytes(r),0)/1024,
          largestImageKB:Math.max(0,...images.map(r=>bytes(r)/1024)),
          lcp:window.__moonlitPerf.lcp,
          cls:window.__moonlitPerf.cls,
          images:imageEls
        };
      });

      expect(metrics.requests,width+'px request count').toBeLessThanOrEqual(BUDGET.requests);
      expect(metrics.transferKB,width+'px transferred KB').toBeLessThanOrEqual(BUDGET.transferKB);
      expect(metrics.imageKB,width+'px image KB').toBeLessThanOrEqual(BUDGET.imageKB);
      expect(metrics.largestImageKB,width+'px largest image KB').toBeLessThanOrEqual(BUDGET.largestImageKB);
      expect(metrics.lcp,width+'px LCP').toBeGreaterThan(0);
      expect(metrics.lcp,width+'px LCP').toBeLessThanOrEqual(BUDGET.lcpMs);
      expect(metrics.cls,width+'px CLS').toBeLessThanOrEqual(BUDGET.cls);

      const oversized=metrics.images.filter(img=>img.renderedWidth>0&&img.naturalWidth>Math.max(1200,img.renderedWidth*4));
      expect(oversized,width+'px oversized decoded images').toEqual([]);

      const hero=page.locator('.hero-primary');
      const t0=await page.evaluate(()=>performance.now());
      await hero.click();
      await page.waitForFunction(start=>location.hash==='#tonight'&&performance.now()-start<1000,t0);
      const heroDelay=await page.evaluate(start=>performance.now()-start,t0);
      expect(heroDelay,width+'px hero interaction delay').toBeLessThanOrEqual(BUDGET.interactionMs);

      await page.locator('#book').scrollIntoViewIfNeeded();
      const toggle=page.locator('#show-all-novels');
      await expect(toggle).toBeVisible();
      const before=await toggle.getAttribute('aria-expanded');
      const t1=await page.evaluate(()=>performance.now());
      await toggle.click();
      await expect(toggle).not.toHaveAttribute('aria-expanded',before);
      const toggleDelay=await page.evaluate(start=>performance.now()-start,t1);
      expect(toggleDelay,width+'px shelf interaction delay').toBeLessThanOrEqual(BUDGET.interactionMs);
    });
  }
});
