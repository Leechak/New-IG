(function () {
    'use strict';

    const { eventSource, event_types } = SillyTavern.getContext();

    const CSS = `
.tc-card{
    background:#000!important;
    color:#fff!important;
    width:min(560px,100%)!important;
    margin:12px auto!important;
    padding:16px!important;
    border-radius:20px!important;
    font-family:Arial,sans-serif!important;
    box-sizing:border-box!important;
    box-shadow:0 3px 18px rgba(0,0,0,.28)!important;
    animation:tc-in .3s ease!important;
    line-height:normal!important;
}
.tc-head{display:flex!important;align-items:center!important;gap:10px!important}
.tc-avatar{
    width:42px!important;
    height:42px!important;
    border-radius:50%!important;
    background:#202020!important;
    color:#fff!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    font-size:22px!important;
    font-weight:700!important;
    flex:none!important;
}
.tc-user{display:flex!important;flex-direction:column!important;color:#fff!important}
.tc-user b,.tc-comment b{color:#fff!important}
.tc-user span,.tc-comment span,.tc-time,.tc-stats{
    color:#8b8b8b!important;
    font-size:13px!important;
}
.tc-more{margin-left:auto!important;color:#aaa!important}
.tc-text{
    color:#fff!important;
    font-size:16px!important;
    line-height:1.5!important;
    margin:14px 0!important;
}
.tc-actions{
    display:flex!important;
    justify-content:space-between!important;
    color:#aaa!important;
    padding:8px 2px!important;
    font-size:20px!important;
}
.tc-stats{
    border-bottom:1px solid #2b2b2b!important;
    padding:10px 0!important;
}
.tc-comment{
    display:flex!important;
    gap:9px!important;
    padding:12px 0!important;
    border-bottom:1px solid #222!important;
    color:#fff!important;
}
.tc-mini{
    width:30px!important;
    height:30px!important;
    border-radius:50%!important;
    background:#202020!important;
    color:#aaa!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    flex:none!important;
}
.tc-comment p{
    color:#fff!important;
    margin:4px 0 0!important;
    line-height:1.4!important;
}
.tc-time{margin-top:11px!important}

@keyframes tc-in{
    from{opacity:0;transform:translateY(8px)}
    to{opacity:1;transform:translateY(0)}
}
`;

    function loadCSS() {
        if (document.getElementById('twitter-card-renderer-css')) return;

        const style = document.createElement('style');
        style.id = 'twitter-card-renderer-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function esc(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function parse(raw) {
        const match = String(raw).match(
            /<twitter>\s*POSTER:\s*([^\r\n]*)\s*HANDLE:\s*([^\r\n]*)\s*TEXT:\s*([\s\S]*?)\s*COMMENT1:\s*([^\r\n]*)\s*HANDLE1:\s*([^\r\n]*)\s*TEXT1:\s*([\s\S]*?)\s*COMMENT2:\s*([^\r\n]*)\s*HANDLE2:\s*([^\r\n]*)\s*TEXT2:\s*([\s\S]*?)\s*COMMENT3:\s*([^\r\n]*)\s*HANDLE3:\s*([^\r\n]*)\s*TEXT3:\s*([\s\S]*?)\s*LIKES:\s*([^\r\n]*)\s*REPLIES:\s*([^\r\n]*)\s*TIME:\s*([^\r\n]*)\s*<\/twitter>/i
        );

        if (!match) return null;

        return {
            poster: match[1],
            handle: match[2],
            text: match[3],
            comment1: match[4],
            handle1: match[5],
            text1: match[6],
            comment2: match[7],
            handle2: match[8],
            text2: match[9],
            comment3: match[10],
            handle3: match[11],
            text3: match[12],
            likes: match[13],
            replies: match[14],
            time: match[15]
        };
    }

    function makeComment(name, handle, text) {
        return `
            <div class="tc-comment">
                <div class="tc-mini">•</div>
                <div>
                    <b>${esc(name)}</b>
                    <span>${esc(handle)}</span>
                    <p>${esc(text).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
    }

    function makeCard(data) {
        return `
            <div class="tc-card">
                <div class="tc-head">
                    <div class="tc-avatar">𝕏</div>

                    <div class="tc-user">
                        <b>${esc(data.poster)}</b>
                        <span>${esc(data.handle)}</span>
                    </div>

                    <div class="tc-more">•••</div>
                </div>

                <div class="tc-text">
                    ${esc(data.text).replace(/\n/g, '<br>')}
                </div>

                <div class="tc-actions">
                    <span>♡</span>
                    <span>💬</span>
                    <span>🔁</span>
                    <span>↗</span>
                </div>

                <div class="tc-stats">
                    ${esc(data.likes)} Likes · ${esc(data.replies)} Replies
                </div>

                ${makeComment(data.comment1, data.handle1, data.text1)}
                ${makeComment(data.comment2, data.handle2, data.text2)}
                ${makeComment(data.comment3, data.handle3, data.text3)}

                <div class="tc-time">
                    ${esc(data.time)}
                </div>
            </div>
        `;
    }

    function renderMessage(messageElement) {
        if (!messageElement) return;

        if (messageElement.querySelector('.tc-card')) {
            return;
        }

        const raw = messageElement.textContent || '';

        if (!raw.includes('<twitter>')) {
            return;
        }

        if (!raw.includes('</twitter>')) {
            return;
        }

        const data = parse(raw);

        if (!data) {
            console.log('[Twitter Card] พบ twitter แต่ parse ไม่สำเร็จ');
            return;
        }

        messageElement.innerHTML = makeCard(data);

        console.log('[Twitter Card] rendered');
    }

    function scan() {
        document
            .querySelectorAll('.mes_text')
            .forEach(renderMessage);
    }

    function delayedScan() {
        setTimeout(scan, 50);
        setTimeout(scan, 300);
        setTimeout(scan, 800);
    }

    function start() {
        loadCSS();
        delayedScan();

        if (eventSource && event_types) {

            if (event_types.CHARACTER_MESSAGE_RENDERED) {
                eventSource.on(
                    event_types.CHARACTER_MESSAGE_RENDERED,
                    delayedScan
                );
            }

            if (event_types.USER_MESSAGE_RENDERED) {
                eventSource.on(
                    event_types.USER_MESSAGE_RENDERED,
                    delayedScan
                );
            }

            if (event_types.MESSAGE_EDITED) {
                eventSource.on(
                    event_types.MESSAGE_EDITED,
                    delayedScan
                );
            }

            if (event_types.CHAT_CHANGED) {
                eventSource.on(
                    event_types.CHAT_CHANGED,
                    delayedScan
                );
            }
        }

        const observer = new MutationObserver(function () {
            delayedScan();
        });

        const chat = document.querySelector('#chat');

        if (chat) {
            observer.observe(chat, {
                childList: true,
                subtree: true
            });
        }

        console.log('[Twitter Card] v2.0 loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})();
