(function () {
    'use strict';

    const { messageFormatter } = SillyTavern.getContext();
    const cards = new Map();
    let seq = 0;

    // Inject CSS directly so the card does not depend on ST loading style.css.
    const CSS = `
.tc-card{background:#000!important;color:#fff!important;max-width:560px!important;width:100%!important;margin:12px auto!important;padding:16px!important;border-radius:20px!important;font-family:Arial,sans-serif!important;box-sizing:border-box!important;box-shadow:0 3px 18px rgba(0,0,0,.28)!important;animation:tc-in .3s ease!important;line-height:normal!important}
.tc-head{display:flex!important;align-items:center!important;gap:10px!important}
.tc-avatar{width:42px!important;height:42px!important;border-radius:50%!important;background:#202020!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:22px!important;font-weight:700!important;flex:none!important}
.tc-user{display:flex!important;flex-direction:column!important;color:#fff!important}
.tc-user b,.tc-comment b{color:#fff!important}
.tc-user span,.tc-comment span,.tc-time,.tc-stats{color:#8b8b8b!important;font-size:13px!important}
.tc-more{margin-left:auto!important;color:#aaa!important}
.tc-text{color:#fff!important;font-size:16px!important;line-height:1.5!important;margin:14px 0!important}
.tc-actions{display:flex!important;justify-content:space-between!important;color:#aaa!important;padding:8px 2px!important;font-size:20px!important}
.tc-stats{border-bottom:1px solid #2b2b2b!important;padding:10px 0!important}
.tc-comment{display:flex!important;gap:9px!important;padding:12px 0!important;border-bottom:1px solid #222!important;color:#fff!important}
.tc-mini{width:30px!important;height:30px!important;border-radius:50%!important;background:#202020!important;color:#aaa!important;display:flex!important;align-items:center!important;justify-content:center!important;flex:none!important}
.tc-comment p{color:#fff!important;margin:4px 0 0!important;line-height:1.4!important}
.tc-time{margin-top:11px!important}
@keyframes tc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;
    if (!document.getElementById('twitter-card-renderer-css')) {
        const s=document.createElement('style');
        s.id='twitter-card-renderer-css';
        s.textContent=CSS;
        document.head.appendChild(s);
    }

    const esc = (s) => String(s ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');

    function parse(raw) {
        const m = raw.match(/<twitter>\s*POSTER:\s*([^\r\n]*)\s*HANDLE:\s*([^\r\n]*)\s*TEXT:\s*([\s\S]*?)\s*COMMENT1:\s*([^\r\n]*)\s*HANDLE1:\s*([^\r\n]*)\s*TEXT1:\s*([\s\S]*?)\s*COMMENT2:\s*([^\r\n]*)\s*HANDLE2:\s*([^\r\n]*)\s*TEXT2:\s*([\s\S]*?)\s*COMMENT3:\s*([^\r\n]*)\s*HANDLE3:\s*([^\r\n]*)\s*TEXT3:\s*([\s\S]*?)\s*LIKES:\s*([^\r\n]*)\s*REPLIES:\s*([^\r\n]*)\s*TIME:\s*([^\r\n]*)\s*<\/twitter>/i);
        if (!m) return null;
        return {p:m[1],h:m[2],t:m[3],c1:m[4],h1:m[5],t1:m[6],c2:m[7],h2:m[8],t2:m[9],c3:m[10],h3:m[11],t3:m[12],l:m[13],r:m[14],time:m[15]};
    }

    function comment(n,h,t) {
        return `<div class="tc-comment"><div class="tc-mini">•</div><div><b>${esc(n)}</b> <span>${esc(h)}</span><p>${esc(t).replace(/\n/g,'<br>')}</p></div></div>`;
    }

    function card(d) {
        return `<div class="tc-card">
          <div class="tc-head"><div class="tc-avatar">𝕏</div><div class="tc-user"><b>${esc(d.p)}</b><span>${esc(d.h)}</span></div><div class="tc-more">•••</div></div>
          <div class="tc-text">${esc(d.t).replace(/\n/g,'<br>')}</div>
          <div class="tc-actions"><span>♡</span><span>💬</span><span>🔁</span><span>↗</span></div>
          <div class="tc-stats">${esc(d.l)} Likes · ${esc(d.r)} Replies</div>
          ${comment(d.c1,d.h1,d.t1)}${comment(d.c2,d.h2,d.t2)}${comment(d.c3,d.h3,d.t3)}
          <div class="tc-time">${esc(d.time)}</div>
        </div>`;
    }

    messageFormatter.addHook((mes) => {
        const d = parse(mes);
        if (!d) return mes;
        const token = `__TWITTER_CARD_${++seq}__`;
        cards.set(token,d);
        if(cards.size>1000) cards.delete(cards.keys().next().value);
        return mes.replace(/<twitter>[\s\S]*?<\/twitter>/i,token);
    },{stage:messageFormatter.stage.BEFORE_REGEX,order:messageFormatter.order.EARLIEST});

    messageFormatter.addHook((mes) => {
        for(const [token,d] of cards) if(mes.includes(token)) mes=mes.replaceAll(token,card(d));
        return mes;
    },{stage:messageFormatter.stage.AFTER_MARKDOWN,order:messageFormatter.order.LATEST});

    console.log('[Twitter Card Renderer] v1.2 loaded');
})();